import type { MutationCtx } from "../_generated/server";
import type { Doc, Id } from "../_generated/dataModel";
import { normalizePhone } from "./phone";
import { logAutomation, sha256Hex } from "./automation";

export type LeadCaptureInput = {
  tenantId: Id<"tenants">;
  phone: string;
  name?: string;
  message?: string;
  source?: Doc<"leads">["source"];
  campaignKey?: string;
  trigger?: "whatsapp_inbound" | "campaign_fired";
};

export async function createInboundLead(
  ctx: MutationCtx,
  input: LeadCaptureInput,
): Promise<Id<"leads">> {
  const normalized = normalizePhone(input.phone);
  const existing = await ctx.db
    .query("leads")
    .withIndex("by_phone", (q) =>
      q.eq("tenantId", input.tenantId).eq("phone", normalized),
    )
    .unique();
  if (existing) return existing._id;

  const now = Date.now();
  const leadId = await ctx.db.insert("leads", {
    tenantId: input.tenantId,
    phone: normalized,
    name: input.name,
    message: input.message,
    source: input.source ?? "whatsapp",
    campaignKey: input.campaignKey,
    status: "new",
    convertedCustomerId: undefined,
    createdAt: now,
    updatedAt: now,
  });

  const trigger = input.trigger ?? "whatsapp_inbound";
  const idempotencyKey = await sha256Hex(
    `${trigger}|${input.tenantId}|${normalized}`,
  );
  await logAutomation(ctx, {
    tenantId: input.tenantId,
    triggerType: trigger,
    entityType: "lead",
    entityId: leadId,
    action: "lead_created",
    idempotencyKey,
  });

  return leadId;
}