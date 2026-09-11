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

export const adminSummary = query({
  args: {},
  handler: async (ctx) => {
    await requireSuperAdmin(ctx);
    const tenants = await ctx.db.query("tenants").collect();
    const rows = await Promise.all(
      tenants.map(async (tenant) => {
        const members = await ctx.db
          .query("members")
          .withIndex("by_tenant", (q) => q.eq("tenantId", tenant._id))
          .collect();
        const customers = await ctx.db
          .query("customers")
          .withIndex("by_tenant", (q) => q.eq("tenantId", tenant._id))
          .collect();
        const services = await ctx.db
          .query("services")
          .withIndex("by_tenant", (q) => q.eq("tenantId", tenant._id))
          .collect();
        const leads = await ctx.db
          .query("leads")
          .withIndex("by_tenant", (q) => q.eq("tenantId", tenant._id))
          .collect();
        const queue = await ctx.db
          .query("automationQueue")
          .withIndex("by_tenant", (q) => q.eq("tenantId", tenant._id))
          .collect();
        return {
          tenantId: tenant._id,
          name: tenant.name,
          slug: tenant.slug,
          planTier: tenant.planTier,
          waPhoneId: tenant.waPhoneId ?? null,
          metaVerified: tenant.metaVerified,
          createdAt: tenant.createdAt,
          members: members.length,
          customers: customers.length,
          openServices: services.filter(
            (s) => s.status === "pending" || s.status === "in_progress",
          ).length,
          leads: leads.length,
          queueBacklog: queue.filter(
            (j) => j.status === "pending" || j.status === "retrying",
          ).length,
          queueFailed: queue.filter((j) => j.status === "failed").length,
        };
      }),
    );
    rows.sort((a, b) => b.createdAt - a.createdAt);
    return rows;
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

export const onboardTenant = mutation({
  args: {
    name: v.string(),
    slug: v.string(),
    planTier: v.optional(v.union(v.literal("starter"), v.literal("growth"), v.literal("premium"))),
    waPhoneId: v.optional(v.string()),
    memberTokenIdentifier: v.string(),
    memberName: v.string(),
    memberRole: v.union(v.literal("owner"), v.literal("mechanic"), v.literal("receptionist")),
    memberPhone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireSuperAdmin(ctx);
    const slug = args.slug.trim().toLowerCase();
    if (!/^[a-z0-9][a-z0-9-]{1,31}$/.test(slug)) {
      throw new ForbiddenError("Slug must be 2-32 lowercase letters, digits, or hyphens");
    }
    const existingSlug = await ctx.db.query("tenants").withIndex("by_slug", (q) => q.eq("slug", slug)).unique();
    if (existingSlug) throw new ForbiddenError("Slug already taken");
    const existingMember = await ctx.db
      .query("members")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", args.memberTokenIdentifier))
      .unique();
    if (existingMember?.tenantId) {
      throw new ForbiddenError("Member already has a garage");
    }

    const now = Date.now();
    const tenantId = await ctx.db.insert("tenants", {
      name: args.name.trim(),
      slug,
      planTier: args.planTier ?? "starter",
      waPhoneId: args.waPhoneId?.trim() || undefined,
      metaVerified: false,
      metadata: "{}",
      createdAt: now,
      updatedAt: now,
    });
    if (existingMember) {
      await ctx.db.patch(existingMember._id, {
        tenantId,
        name: args.memberName.trim(),
        role: args.memberRole,
        phone: args.memberPhone?.trim() || existingMember.phone,
        active: true,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("members", {
        tenantId,
        tokenIdentifier: args.memberTokenIdentifier.trim(),
        name: args.memberName.trim(),
        phone: args.memberPhone?.trim(),
        role: args.memberRole,
        active: true,
        createdAt: now,
        updatedAt: now,
      });
    }
    return { tenantId };
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