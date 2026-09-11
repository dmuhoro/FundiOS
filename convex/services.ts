import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireGarage, requireTenantDocument } from "./lib/authorization";
import { logAutomation, sha256Hex } from "./lib/automation";

const serviceStatuses = v.union(
  v.literal("pending"),
  v.literal("in_progress"),
  v.literal("completed"),
  v.literal("cancelled"),
);
const paymentMethods = v.union(
  v.literal("cash"),
  v.literal("mpesa"),
  v.literal("card"),
  v.literal("invoice"),
);

export const list = query({
  args: {},
  handler: async (ctx) => {
    const { tenantId } = await requireGarage(ctx);
    return await ctx.db
      .query("services")
      .withIndex("by_tenant", (q) => q.eq("tenantId", tenantId))
      .order("desc")
      .collect();
  },
});

export const listByVehicle = query({
  args: { vehicleId: v.id("vehicles") },
  handler: async (ctx, args) => {
    const vehicle = await ctx.db.get(args.vehicleId);
    await requireTenantDocument(ctx, vehicle);
    return await ctx.db
      .query("services")
      .withIndex("by_vehicle", (q) => q.eq("vehicleId", args.vehicleId))
      .order("desc")
      .collect();
  },
});

export const get = query({
  args: { serviceId: v.id("services") },
  handler: async (ctx, args) => {
    const service = await ctx.db.get(args.serviceId);
    return await requireTenantDocument(ctx, service);
  },
});

export const create = mutation({
  args: {
    vehicleId: v.id("vehicles"),
    description: v.string(),
    customerId: v.optional(v.id("customers")),
    status: v.optional(serviceStatuses),
    amountMinor: v.optional(v.number()),
    appointmentAt: v.optional(v.number()),
    nextServiceKm: v.optional(v.number()),
    nextServiceAt: v.optional(v.number()),
    paymentMethod: v.optional(paymentMethods),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const vehicle = await ctx.db.get(args.vehicleId);
    await requireTenantDocument(ctx, vehicle);
    const now = Date.now();
    const serviceId = await ctx.db.insert("services", {
      tenantId: vehicle!.tenantId,
      customerId: args.customerId ?? vehicle!.customerId,
      vehicleId: args.vehicleId,
      description: args.description,
      status: args.status ?? "pending",
      amountMinor: args.amountMinor,
      paid: false,
      paymentMethod: args.paymentMethod,
      appointmentAt: args.appointmentAt,
      nextServiceKm: args.nextServiceKm,
      nextServiceAt: args.nextServiceAt,
      reminderSent: false,
      notes: args.notes,
      createdAt: now,
      updatedAt: now,
    });

    const idempotencyKey = await sha256Hex(`service_created|${vehicle!.tenantId}|${serviceId}`);
    await logAutomation(ctx, {
      tenantId: vehicle!.tenantId,
      triggerType: "service_completed",
      entityType: "service",
      entityId: serviceId,
      action: "service_created",
      idempotencyKey,
    });

    return await ctx.db.get(serviceId);
  },
});

export const update = mutation({
  args: {
    serviceId: v.id("services"),
    status: v.optional(serviceStatuses),
    description: v.optional(v.string()),
    amountMinor: v.optional(v.number()),
    paid: v.optional(v.boolean()),
    paymentMethod: v.optional(paymentMethods),
    nextServiceKm: v.optional(v.number()),
    nextServiceAt: v.optional(v.number()),
    appointmentAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    reminderSent: v.optional(v.boolean()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const service = await ctx.db.get(args.serviceId);
    await requireTenantDocument(ctx, service);
    const { serviceId, ...patch } = args;
    const completedAt = patch.status === "completed" ? (patch.completedAt ?? Date.now()) : patch.completedAt;
    await ctx.db.patch(serviceId, { ...patch, completedAt, updatedAt: Date.now() });
    return await ctx.db.get(serviceId);
  },
});