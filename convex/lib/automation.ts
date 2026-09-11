import type { MutationCtx } from "../_generated/server";
import type { Doc, Id } from "../_generated/dataModel";

export async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export type AutomationEntry = {
  tenantId: Id<"tenants">;
  triggerType: Doc<"automationLogs">["triggerType"];
  action: string;
  idempotencyKey: string;
  entityType?: string;
  entityId?: string;
  payload?: string;
  status?: Doc<"automationLogs">["status"];
  errorMessage?: string;
};

export async function logAutomation(ctx: MutationCtx, entry: AutomationEntry) {
  const existing = await ctx.db
    .query("automationLogs")
    .withIndex("by_idempotency", (q) => q.eq("idempotencyKey", entry.idempotencyKey))
    .first();
  if (existing) return false;
  await ctx.db.insert("automationLogs", {
    tenantId: entry.tenantId,
    triggerType: entry.triggerType,
    entityType: entry.entityType,
    entityId: entry.entityId,
    action: entry.action,
    payload: entry.payload,
    status: entry.status ?? "success",
    errorMessage: entry.errorMessage,
    idempotencyKey: entry.idempotencyKey,
    createdAt: Date.now(),
  });
  return true;
}