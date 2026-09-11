import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireGarage, requireTenantDocument, ForbiddenError } from "./lib/authorization";
import { normalizePhone, isValidKenyanPhone } from "./lib/phone";
import { logAutomation, sha256Hex } from "./lib/automation";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const { tenantId } = await requireGarage(ctx);
    return await ctx.db
      .query("leads")
      .withIndex("by_tenant", (q) => q.eq("tenantId", tenantId))
      .order("desc")
      .collect();
  },
});

export const get = query({
  args: { leadId: v.id("leads") },
  handler: async (ctx, args) => {
    const lead = await ctx.db.get(args.leadId);
    await requireTenantDocument(ctx, lead);
    return lead;
  },
});

export const create = mutation({
  args: {
    phone: v.string(),
    name: v.optional(v.string()),
    vehicleMake: v.optional(v.string()),
    vehicleModel: v.optional(v.string()),
    message: v.optional(v.string()),
    source: v.optional(
      v.union(
        v.literal("whatsapp"),
        v.literal("facebook"),
        v.literal("walk_in"),
        v.literal("referral"),
        v.literal("google"),
        v.literal("other"),
      ),
    ),
  },
  handler: async (ctx, args) => {
    const { tenantId } = await requireGarage(ctx);
    const phone = normalizePhone(args.phone);
    if (!isValidKenyanPhone(phone)) throw new ForbiddenError("Invalid phone number");

    const existing = await ctx.db
      .query("leads")
      .withIndex("by_phone", (q) => q.eq("tenantId", tenantId).eq("phone", phone))
      .first();

    if (existing && (existing.status === "new" || existing.status === "contacted")) {
      return { lead: existing, created: false };
    }

    const now = Date.now();
    const id = await ctx.db.insert("leads", {
      tenantId,
      name: args.name,
      phone,
      vehicleMake: args.vehicleMake,
      vehicleModel: args.vehicleModel,
      message: args.message,
      source: args.source ?? "whatsapp",
      status: "new",
      createdAt: now,
      updatedAt: now,
    });

    const idempotencyKey = await sha256Hex(`lead_created|${tenantId}|${phone}`);
    await logAutomation(ctx, {
      tenantId,
      triggerType: "lead_created",
      entityType: "lead",
      entityId: id,
      action: "lead_captured",
      idempotencyKey,
    });

    return { lead: await ctx.db.get(id), created: true };
  },
});

export const setStatus = mutation({
  args: {
    leadId: v.id("leads"),
    status: v.union(v.literal("new"), v.literal("contacted"), v.literal("converted"), v.literal("lost")),
  },
  handler: async (ctx, args) => {
    const lead = await ctx.db.get(args.leadId);
    await requireTenantDocument(ctx, lead);
    if (args.status === "converted") throw new ForbiddenError("Use convert mutation");
    await ctx.db.patch(args.leadId, { status: args.status, updatedAt: Date.now() });
    return await ctx.db.get(args.leadId);
  },
});

export const convert = mutation({
  args: {
    leadId: v.id("leads"),
    customerName: v.optional(v.string()),
    vehicleMake: v.optional(v.string()),
    vehicleModel: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const lead = await ctx.db.get(args.leadId);
    const guarded = await requireTenantDocument(ctx, lead);

    if (guarded.status === "converted") {
      return { customerId: guarded.convertedCustomerId, alreadyConverted: true };
    }

    const now = Date.now();
    const customerId = await ctx.db.insert("customers", {
      tenantId: guarded.tenantId,
      name: args.customerName ?? guarded.name ?? "New Customer",
      phone: normalizePhone(guarded.phone),
      waOptIn: guarded.source === "whatsapp",
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.patch(guarded._id, {
      status: "converted",
      convertedCustomerId: customerId,
      updatedAt: now,
    });

    if (args.vehicleMake || args.vehicleModel) {
      await ctx.db.insert("vehicles", {
        tenantId: guarded.tenantId,
        customerId,
        make: args.vehicleMake ?? "Unknown",
        model: args.vehicleModel ?? "Unknown",
        createdAt: now,
        updatedAt: now,
      });
    }

    const idempotencyKey = await sha256Hex(
      `lead_converted|${guarded.tenantId}|${args.leadId}`,
    );
    await logAutomation(ctx, {
      tenantId: guarded.tenantId,
      triggerType: "lead_created",
      entityType: "lead",
      entityId: args.leadId,
      action: "lead_converted",
      idempotencyKey,
    });

    return { customerId, alreadyConverted: false };
  },
});

export const getByPhone = query({
  args: { tenantId: v.id("tenants"), phone: v.string() },
  handler: async (ctx, args) => {
    const normalized = normalizePhone(args.phone);
    return await ctx.db
      .query("leads")
      .withIndex("by_phone", (q) =>
        q.eq("tenantId", args.tenantId).eq("phone", normalized),
      )
      .unique();
  },
});

export const createInbound = mutation({
  args: {
    tenantId: v.id("tenants"),
    phone: v.string(),
    name: v.optional(v.string()),
    source: v.optional(v.union(v.literal("whatsapp"), v.literal("other"))),
  },
  handler: async (ctx, args) => {
    const normalized = normalizePhone(args.phone);
    const existing = await ctx.db
      .query("leads")
      .withIndex("by_phone", (q) =>
        q.eq("tenantId", args.tenantId).eq("phone", normalized),
      )
      .unique();
    if (existing) return existing._id;

    const now = Date.now();
    const leadId = await ctx.db.insert("leads", {
      tenantId: args.tenantId,
      phone: normalized,
      name: args.name,
      source: args.source ?? "whatsapp",
      status: "new",
      convertedCustomerId: undefined,
      createdAt: now,
      updatedAt: now,
    });

    const idempotencyKey = await sha256Hex(
      `whatsapp_inbound|${args.tenantId}|${normalized}`,
    );
    await logAutomation(ctx, {
      tenantId: args.tenantId,
      triggerType: "whatsapp_inbound",
      entityType: "lead",
      entityId: leadId,
      action: "lead_created",
      idempotencyKey,
    });

    return leadId;
  },
});