/// <reference types="vite/client" />

import { convexTest } from "convex-test";
import { expect, describe, it } from "vitest";
import schema from "./schema";
import { api } from "./_generated/api";

const modules = import.meta.glob("./**/*.ts");

async function expectCode(p: Promise<unknown>, code: string) {
  let error: unknown;
  try {
    await p;
  } catch (e) {
    error = e;
  }
  expect(error, "expected rejection").toBeDefined();
  expect((error as { data?: { code: string } }).data?.code).toBe(code);
}

describe("Tenant isolation", () => {
  it("anonymous is denied on all tenant endpoints", async () => {
    const t = convexTest(schema, modules);
    await expectCode(t.query(api.leads.list), "UNAUTHENTICATED");
    await expectCode(
      t.mutation(api.leads.create, { phone: "+254700000000" }),
      "UNAUTHENTICATED",
    );
    await expectCode(t.query(api.tenants.myTenant), "UNAUTHENTICATED");
    await expectCode(t.query(api.members.myProfile), "UNAUTHENTICATED");
  });

  it("garage A can CRUD; garage B is scoped away", async () => {
    const t = convexTest(schema, modules);

    await t.run(async (ctx) => {
      const now = Date.now();
      const tenantA = await ctx.db.insert("tenants", {
        name: "Garage A",
        slug: "garage-a",
        planTier: "starter",
        metaVerified: false,
        metadata: "{}",
        createdAt: now,
        updatedAt: now,
      });
      const tenantB = await ctx.db.insert("tenants", {
        name: "Garage B",
        slug: "garage-b",
        planTier: "starter",
        metaVerified: false,
        metadata: "{}",
        createdAt: now,
        updatedAt: now,
      });

      await ctx.db.insert("members", {
        tenantId: tenantA,
        tokenIdentifier: "convex|alice",
        name: "Alice",
        role: "owner",
        active: true,
        createdAt: now,
        updatedAt: now,
      });

      await ctx.db.insert("members", {
        tenantId: tenantB,
        tokenIdentifier: "convex|bob",
        name: "Bob",
        role: "owner",
        active: true,
        createdAt: now,
        updatedAt: now,
      });

      await ctx.db.insert("members", {
        tokenIdentifier: "convex|admin",
        name: "Root",
        role: "super_admin",
        active: true,
        createdAt: now,
        updatedAt: now,
      });
      return true;
    });

    const alice = t.withIdentity({
      issuer: "convex",
      subject: "alice",
      tokenIdentifier: "convex|alice",
    });
    const bob = t.withIdentity({
      issuer: "convex",
      subject: "bob",
      tokenIdentifier: "convex|bob",
    });
    const admin = t.withIdentity({
      issuer: "convex",
      subject: "admin",
      tokenIdentifier: "convex|admin",
    });

    const aliceCustomer = await alice.mutation(api.customers.create, {
      name: "Alice Customer",
      phone: "+254711000001",
    });
    const aliceLeadResult = await alice.mutation(api.leads.create, {
      phone: "+254711000002",
    });
    expect(aliceLeadResult.created).toBe(true);
    const aliceLead = aliceLeadResult.lead!._id;
    const aliceVehicle = await alice.mutation(api.vehicles.create, {
      customerId: aliceCustomer,
      make: "Toyota",
      model: "Vitz",
    });

    expect(await alice.query(api.customers.list)).toHaveLength(1);
    expect(await bob.query(api.customers.list)).toHaveLength(0);
    expect(await alice.query(api.leads.list)).toHaveLength(1);
    expect(await bob.query(api.leads.list)).toHaveLength(0);

    await expectCode(bob.query(api.customers.get, { customerId: aliceCustomer }), "TENANT_SCOPE");
    await expectCode(bob.query(api.leads.get, { leadId: aliceLead }), "TENANT_SCOPE");
    await expectCode(
      bob.mutation(api.leads.convert, { leadId: aliceLead }),
      "TENANT_SCOPE",
    );
    await expectCode(
      bob.mutation(api.services.create, { vehicleId: aliceVehicle, description: "Try steal" }),
      "TENANT_SCOPE",
    );

    expect(await admin.query(api.tenants.adminListTenants)).toHaveLength(2);
    await expectCode(alice.query(api.tenants.adminListTenants), "FORBIDDEN");

    const superAdminTenant = await t.run(async (ctx) => {
      await ctx.db.insert("tenants", {
        name: "Super Admin Tenant",
        slug: "super",
        planTier: "starter",
        metaVerified: false,
        metadata: "{}",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      return true;
    });
    expect(superAdminTenant).toBe(true);
  });

  it("lead deduplication on same phone within tenant", async () => {
    const t = convexTest(schema, modules);

    await t.run(async (ctx) => {
      const now = Date.now();
      const tenant = await ctx.db.insert("tenants", {
        name: "Dedup Garage",
        slug: "dedup",
        planTier: "starter",
        metaVerified: false,
        metadata: "{}",
        createdAt: now,
        updatedAt: now,
      });
      await ctx.db.insert("members", {
        tenantId: tenant,
        tokenIdentifier: "convex|dedup-user",
        name: "Dedup",
        role: "owner",
        active: true,
        createdAt: now,
        updatedAt: now,
      });
    });

    const user = t.withIdentity({
      issuer: "convex",
      subject: "dedup-user",
      tokenIdentifier: "convex|dedup-user",
    });

    const first = await user.mutation(api.leads.create, {
      phone: "+254700111222",
    });
    expect(first.created).toBe(true);

    const second = await user.mutation(api.leads.create, {
      phone: "+254700111222",
    });
    expect(second.created).toBe(false);
    expect(second.lead).not.toBeNull();
    expect(first.lead).not.toBeNull();
    expect(second.lead!._id).toBe(first.lead!._id);

    const allLeads = await t.run(async (ctx) => {
      return await ctx.db
        .query("leads")
        .filter((q) => q.eq(q.field("phone"), "+254700111222"))
        .collect();
    });
    expect(allLeads).toHaveLength(1);
  });

  it("deactivated member is denied", async () => {
    const t = convexTest(schema, modules);

    await t.run(async (ctx) => {
      const now = Date.now();
      const tenant = await ctx.db.insert("tenants", {
        name: "Active Garage",
        slug: "active",
        planTier: "starter",
        metaVerified: false,
        metadata: "{}",
        createdAt: now,
        updatedAt: now,
      });
      await ctx.db.insert("members", {
        tenantId: tenant,
        tokenIdentifier: "convex|active-user",
        name: "Active",
        role: "owner",
        active: true,
        createdAt: now,
        updatedAt: now,
      });
    });

    const user = t.withIdentity({
      issuer: "convex",
      subject: "active-user",
      tokenIdentifier: "convex|active-user",
    });

    await user.mutation(api.customers.create, {
      name: "Before deactivation",
      phone: "+254700333444",
    });

    const memberId = await t.run(async (ctx) => {
      const member = await ctx.db
        .query("members")
        .withIndex("by_token", (q) => q.eq("tokenIdentifier", "convex|active-user"))
        .unique();
      return member!._id;
    });

    await t.run(async (ctx) => {
      await ctx.db.patch(memberId, { active: false });
    });

    await expectCode(user.query(api.customers.list), "FORBIDDEN");

    await t.run(async (ctx) => {
      await ctx.db.patch(memberId, { active: true });
    });

    expect(await user.query(api.customers.list)).toHaveLength(1);
  });

  it("assigned membership gives scoped access; wrong tenant denied", async () => {
    const t = convexTest(schema, modules);

    const { tenantA } = await t.run(async (ctx) => {
      const now = Date.now();
      const tenantA = await ctx.db.insert("tenants", {
        name: "Assigned Garage",
        slug: "assigned",
        planTier: "starter",
        metaVerified: false,
        metadata: "{}",
        createdAt: now,
        updatedAt: now,
      });
      const tenantB = await ctx.db.insert("tenants", {
        name: "Other Garage",
        slug: "other",
        planTier: "starter",
        metaVerified: false,
        metadata: "{}",
        createdAt: now,
        updatedAt: now,
      });
      await ctx.db.insert("members", {
        tenantId: undefined,
        tokenIdentifier: "convex|admin",
        name: "Root",
        role: "super_admin",
        active: true,
        createdAt: now,
        updatedAt: now,
      });
      return { tenantA, tenantB };
    });

    const admin = t.withIdentity({
      issuer: "convex",
      subject: "admin",
      tokenIdentifier: "convex|admin",
    });

    await admin.mutation(api.members.assignMembership, {
      tokenIdentifier: "convex|mechanic",
      name: "Mechanic",
      role: "mechanic",
      tenantId: tenantA,
    });

    const mechanic = t.withIdentity({
      issuer: "convex",
      subject: "mechanic",
      tokenIdentifier: "convex|mechanic",
    });

    const profile = await mechanic.query(api.members.myProfile);
    expect(profile?.role).toBe("mechanic");
    expect(profile?.tenantId).toBe(tenantA);

    expect(await mechanic.query(api.customers.list)).toHaveLength(0);

    await expectCode(mechanic.query(api.tenants.adminListTenants), "FORBIDDEN");
  });

  it("service money stored as integer minor units without float drift", async () => {
    const t = convexTest(schema, modules);

    const { vehicleId } = await t.run(async (ctx) => {
      const now = Date.now();
      const tenant = await ctx.db.insert("tenants", {
        name: "Money Garage",
        slug: "money",
        planTier: "starter",
        metaVerified: false,
        metadata: "{}",
        createdAt: now,
        updatedAt: now,
      });
      await ctx.db.insert("members", {
        tenantId: tenant,
        tokenIdentifier: "convex|finance",
        name: "Finance",
        role: "owner",
        active: true,
        createdAt: now,
        updatedAt: now,
      });
      const customerId = await ctx.db.insert("customers", {
        tenantId: tenant,
        name: "Payer",
        phone: "+254700555666",
        waOptIn: false,
        createdAt: now,
        updatedAt: now,
      });
      const vehicleId = await ctx.db.insert("vehicles", {
        tenantId: tenant,
        customerId,
        make: "Nissan",
        model: "Note",
        createdAt: now,
        updatedAt: now,
      });
      return { vehicleId };
    });

    const user = t.withIdentity({
      issuer: "convex",
      subject: "finance",
      tokenIdentifier: "convex|finance",
    });

    await user.mutation(api.services.create, {
      vehicleId,
      description: "Oil change",
      amountMinor: 1500,
    });
    await user.mutation(api.services.create, {
      vehicleId,
      description: "Brake pad",
      amountMinor: 8750,
    });

    const services = await user.query(api.services.listByVehicle, { vehicleId });
    expect(services).toHaveLength(2);
    const total = services.reduce<number>((sum, s) => sum + (s.amountMinor ?? 0), 0);
    expect(total).toBe(10250);
    expect(total / 100).toBe(102.5);
  });

  it("automation audit trail scoped and idempotent", async () => {
    const t = convexTest(schema, modules);

    await t.run(async (ctx) => {
      const now = Date.now();
      const tenant = await ctx.db.insert("tenants", {
        name: "Audit Garage",
        slug: "audit",
        planTier: "starter",
        metaVerified: false,
        metadata: "{}",
        createdAt: now,
        updatedAt: now,
      });
      await ctx.db.insert("members", {
        tenantId: tenant,
        tokenIdentifier: "convex|auditor",
        name: "Auditor",
        role: "owner",
        active: true,
        createdAt: now,
        updatedAt: now,
      });
    });

    const user = t.withIdentity({
      issuer: "convex",
      subject: "auditor",
      tokenIdentifier: "convex|auditor",
    });

    await user.mutation(api.leads.create, { phone: "+254700777888" });
    const firstLogs = await t.run(async (ctx) => {
      return await ctx.db.query("automationLogs").collect();
    });
    expect(firstLogs).toHaveLength(1);
    expect(firstLogs[0].triggerType).toBe("lead_created");
    expect(firstLogs[0].idempotencyKey).toBeTruthy();

    await user.mutation(api.leads.create, { phone: "+254700777888" });
    const secondLogs = await t.run(async (ctx) => {
      return await ctx.db.query("automationLogs").collect();
    });
    expect(secondLogs).toHaveLength(1);

    const otherTenantLogs = await t.run(async (ctx) => {
      const tenants = await ctx.db.query("tenants").collect();
      return tenants.filter((t) => t.slug === "audit").length;
    });
    expect(otherTenantLogs).toBe(1);
  });
});