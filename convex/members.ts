import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireMember, requireSuperAdmin } from "./lib/authorization";

export const myProfile = query({
  args: {},
  handler: async (ctx) => {
    const member = await requireMember(ctx);
    return {
      id: member._id,
      name: member.name,
      phone: member.phone,
      role: member.role,
      tenantId: member.tenantId,
    };
  },
});

export const updateMyProfile = mutation({
  args: {
    name: v.optional(v.string()),
    phone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const member = await requireMember(ctx);
    await ctx.db.patch(member._id, {
      name: args.name ?? member.name,
      phone: args.phone ?? member.phone,
      updatedAt: Date.now(),
    });
  },
});

export const assignMembership = mutation({
  args: {
    tokenIdentifier: v.string(),
    name: v.string(),
    role: v.union(v.literal("owner"), v.literal("mechanic"), v.literal("receptionist"), v.literal("super_admin")),
    tenantId: v.optional(v.id("tenants")),
    active: v.optional(v.boolean()),
    phone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireSuperAdmin(ctx);
    const now = Date.now();
    if (args.tenantId) {
      const tenant = await ctx.db.get(args.tenantId);
      if (!tenant) throw new Error("Tenant not found");
    }
    const existing = await ctx.db
      .query("members")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", args.tokenIdentifier))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, {
        name: args.name,
        role: args.role,
        tenantId: args.tenantId,
        active: args.active ?? true,
        phone: args.phone,
        updatedAt: now,
      });
      return existing._id;
    }
    return await ctx.db.insert("members", {
      tokenIdentifier: args.tokenIdentifier,
      name: args.name,
      role: args.role,
      tenantId: args.tenantId,
      active: args.active ?? true,
      phone: args.phone,
      createdAt: now,
      updatedAt: now,
    });
  },
});