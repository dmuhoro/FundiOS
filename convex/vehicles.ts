import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireGarage, requireTenantDocument } from "./lib/authorization";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const { tenantId } = await requireGarage(ctx);
    return await ctx.db
      .query("vehicles")
      .withIndex("by_tenant", (q) => q.eq("tenantId", tenantId))
      .order("desc")
      .collect();
  },
});

export const listByCustomer = query({
  args: { customerId: v.id("customers") },
  handler: async (ctx, args) => {
    const customer = await ctx.db.get(args.customerId);
    await requireTenantDocument(ctx, customer);
    return await ctx.db
      .query("vehicles")
      .withIndex("by_customer", (q) => q.eq("customerId", args.customerId))
      .order("desc")
      .collect();
  },
});

export const get = query({
  args: { vehicleId: v.id("vehicles") },
  handler: async (ctx, args) => {
    const vehicle = await ctx.db.get(args.vehicleId);
    return await requireTenantDocument(ctx, vehicle);
  },
});

export const create = mutation({
  args: {
    customerId: v.id("customers"),
    make: v.string(),
    model: v.string(),
    year: v.optional(v.number()),
    plateNumber: v.optional(v.string()),
    color: v.optional(v.string()),
    mileageKm: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const customer = await ctx.db.get(args.customerId);
    await requireTenantDocument(ctx, customer);
    const now = Date.now();
    return await ctx.db.insert("vehicles", {
      tenantId: customer!.tenantId,
      customerId: args.customerId,
      make: args.make,
      model: args.model,
      year: args.year,
      plateNumber: args.plateNumber,
      color: args.color,
      mileageKm: args.mileageKm,
      notes: args.notes,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    vehicleId: v.id("vehicles"),
    make: v.optional(v.string()),
    model: v.optional(v.string()),
    year: v.optional(v.number()),
    plateNumber: v.optional(v.string()),
    color: v.optional(v.string()),
    mileageKm: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const vehicle = await ctx.db.get(args.vehicleId);
    await requireTenantDocument(ctx, vehicle);
    const { vehicleId, ...patch } = args;
    await ctx.db.patch(vehicleId, { ...patch, updatedAt: Date.now() });
    return await ctx.db.get(vehicleId);
  },
});