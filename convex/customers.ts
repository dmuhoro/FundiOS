import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireGarage, requireTenantDocument } from "./lib/authorization";
import { normalizePhone, isValidKenyanPhone } from "@/lib/phone";
import { ForbiddenError } from "./lib/authorization";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const { tenantId } = await requireGarage(ctx);
    return await ctx.db
      .query("customers")
      .withIndex("by_tenant", (q) => q.eq("tenantId", tenantId))
      .order("desc")
      .collect();
  },
});

export const get = query({
  args: { customerId: v.id("customers") },
  handler: async (ctx, args) => {
    const customer = await ctx.db.get(args.customerId);
    return await requireTenantDocument(ctx, customer);
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    phone: v.string(),
    email: v.optional(v.string()),
    notes: v.optional(v.string()),
    waOptIn: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { tenantId } = await requireGarage(ctx);
    const phone = normalizePhone(args.phone);
    if (!isValidKenyanPhone(phone)) throw new ForbiddenError("Invalid phone number");
    const now = Date.now();
    return await ctx.db.insert("customers", {
      tenantId,
      name: args.name,
      phone,
      email: args.email,
      notes: args.notes,
      waOptIn: args.waOptIn ?? false,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    customerId: v.id("customers"),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    notes: v.optional(v.string()),
    waOptIn: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const customer = await ctx.db.get(args.customerId);
    await requireTenantDocument(ctx, customer);
    await ctx.db.patch(args.customerId, {
      name: args.name,
      email: args.email,
      notes: args.notes,
      waOptIn: args.waOptIn,
      updatedAt: Date.now(),
    });
    return await ctx.db.get(args.customerId);
  },
});