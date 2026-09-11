import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";
import {
  LEAD_SOURCES,
  LEAD_STATUSES,
  SERVICE_STATUSES,
} from "@/lib/constants";

export const serviceStatuses = v.union(
  ...SERVICE_STATUSES.map((s) => v.literal(s)),
);
export const leadStatuses = v.union(...LEAD_STATUSES.map((s) => v.literal(s)));
export const leadSources = v.union(
  ...LEAD_SOURCES.map((s) => v.literal(s)),
);
export const paymentMethods = v.union(
  v.literal("cash"),
  v.literal("mpesa"),
  v.literal("card"),
  v.literal("invoice"),
);
export const planTiers = v.union(
  v.literal("starter"),
  v.literal("growth"),
  v.literal("premium"),
);
export const userRoles = v.union(
  v.literal("owner"),
  v.literal("mechanic"),
  v.literal("receptionist"),
  v.literal("super_admin"),
);
export const automationTriggers = v.union(
  v.literal("whatsapp_inbound"),
  v.literal("lead_created"),
  v.literal("service_completed"),
  v.literal("reminder_due"),
  v.literal("campaign_fired"),
  v.literal("agent_action"),
);
export const automationStatuses = v.union(
  v.literal("success"),
  v.literal("failed"),
  v.literal("skipped"),
  v.literal("pending"),
);

const schema = defineSchema({
  ...authTables,
  tenants: defineTable({
    name: v.string(),
    slug: v.string(),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    address: v.optional(v.string()),
    planTier: planTiers,
    waPhoneId: v.optional(v.string()),
    waAccessTokenEncrypted: v.optional(v.string()),
    metaVerified: v.boolean(),
    metadata: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_slug", ["slug"]),

  members: defineTable({
    tenantId: v.optional(v.id("tenants")),
    tokenIdentifier: v.string(),
    name: v.string(),
    phone: v.optional(v.string()),
    role: userRoles,
    active: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_token", ["tokenIdentifier"])
    .index("by_tenant", ["tenantId"]),

  customers: defineTable({
    tenantId: v.id("tenants"),
    name: v.string(),
    phone: v.string(),
    email: v.optional(v.string()),
    notes: v.optional(v.string()),
    waOptIn: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_tenant", ["tenantId"])
    .index("by_phone", ["tenantId", "phone"]),

  vehicles: defineTable({
    tenantId: v.id("tenants"),
    customerId: v.id("customers"),
    make: v.string(),
    model: v.string(),
    year: v.optional(v.number()),
    plateNumber: v.optional(v.string()),
    color: v.optional(v.string()),
    mileageKm: v.optional(v.number()),
    notes: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_tenant", ["tenantId"])
    .index("by_customer", ["customerId"]),

  services: defineTable({
    tenantId: v.id("tenants"),
    customerId: v.id("customers"),
    vehicleId: v.id("vehicles"),
    description: v.string(),
    status: serviceStatuses,
    amountMinor: v.optional(v.number()),
    paid: v.boolean(),
    paymentMethod: v.optional(paymentMethods),
    appointmentAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    nextServiceKm: v.optional(v.number()),
    nextServiceAt: v.optional(v.number()),
    reminderSent: v.boolean(),
    notes: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_tenant", ["tenantId"])
    .index("by_vehicle", ["vehicleId"])
    .index("by_reminder", ["tenantId", "nextServiceAt", "reminderSent"]),

  leads: defineTable({
    tenantId: v.id("tenants"),
    name: v.optional(v.string()),
    phone: v.string(),
    vehicleMake: v.optional(v.string()),
    vehicleModel: v.optional(v.string()),
    message: v.optional(v.string()),
    source: leadSources,
    status: leadStatuses,
    convertedCustomerId: v.optional(v.id("customers")),
    assignedMemberId: v.optional(v.id("members")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_tenant", ["tenantId"])
    .index("by_status", ["tenantId", "status"])
    .index("by_phone", ["tenantId", "phone"]),

  automationLogs: defineTable({
    tenantId: v.id("tenants"),
    triggerType: automationTriggers,
    entityType: v.optional(v.string()),
    entityId: v.optional(v.string()),
    action: v.string(),
    payload: v.optional(v.string()),
    status: automationStatuses,
    errorMessage: v.optional(v.string()),
    idempotencyKey: v.string(),
    createdAt: v.number(),
  })
    .index("by_tenant", ["tenantId"])
    .index("by_entity", ["entityType", "entityId"])
    .index("by_idempotency", ["idempotencyKey"]),

  campaigns: defineTable({
    tenantId: v.id("tenants"),
    name: v.string(),
    type: v.optional(v.string()),
    status: v.string(),
    budgetMinor: v.optional(v.number()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    createdAt: v.number(),
  }).index("by_tenant", ["tenantId"]),
});

export default schema;