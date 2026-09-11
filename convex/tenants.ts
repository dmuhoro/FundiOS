import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireSuperAdmin, requireGarage, ForbiddenError } from "./lib/authorization";

export const myTenant = query({
  args: {},
  handler: async (ctx) => {
    const { tenantId } = await requireGarage(ctx);
    const tenant = await ctx.db.get(tenantId);
    if (!tenant) return null;
    return {
      id: tenant._id,
      name: tenant.name,
      slug: tenant.slug,
      planTier: tenant.planTier,
      waPhoneId: tenant.waPhoneId,
      metaVerified: tenant.metaVerified,
      metadata: tenant.metadata,
    };
  },
});

export const adminListTenants = query({
  args: {},
  handler: async (ctx) => {
    await requireSuperAdmin(ctx);
    return await ctx.db.query("tenants").collect();
  },
});

export const createTenant = mutation({
  args: {
    name: v.string(),
    slug: v.string(),
    planTier: v.optional(v.union(v.literal("starter"), v.literal("growth"), v.literal("premium"))),
  },
  handler: async (ctx, args) => {
    await requireSuperAdmin(ctx);
    const existing = await ctx.db.query("tenants").withIndex("by_slug", (q) => q.eq("slug", args.slug)).unique();
    if (existing) throw new ForbiddenError("Slug already taken");
    const now = Date.now();
    return await ctx.db.insert("tenants", {
      name: args.name,
      slug: args.slug,
      planTier: args.planTier ?? "starter",
      metaVerified: false,
      metadata: "{}",
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const getByWaPhoneId = query({
  args: { waPhoneId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("tenants")
      .withIndex("by_wa_phone", (q) => q.eq("waPhoneId", args.waPhoneId))
      .unique();
  },
});