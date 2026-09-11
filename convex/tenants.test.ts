import { describe, expect, it } from "vitest";
import { convexTest } from "convex-test";
import { api } from "./_generated/api";
import schema from "./schema";

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

async function seedBase() {
  const t = convexTest(schema, modules);
  const now = Date.now();
  await t.run(async (ctx) => {
    const tenantA = await ctx.db.insert("tenants", {
      name: "Garage A",
      slug: "garage-a",
      planTier: "starter",
      metaVerified: false,
      metadata: "{}",
      createdAt: now,
      updatedAt: now,
    });
    await ctx.db.insert("tenants", {
      name: "Garage B",
      slug: "garage-b",
      planTier: "growth",
      metaVerified: false,
      metadata: "{}",
      createdAt: now - 100,
      updatedAt: now,
    });
    await ctx.db.insert("members", {
      tenantId: tenantA,
      tokenIdentifier: "convex|owner",
      name: "Owner",
      role: "owner",
      active: true,
      createdAt: now,
      updatedAt: now,
    });
    await ctx.db.insert("members", {
      tokenIdentifier: "convex|superadmin",
      name: "Root",
      role: "super_admin",
      active: true,
      createdAt: now,
      updatedAt: now,
    });
  });
  return { t, owner: t.withIdentity({ issuer: "convex", subject: "owner" }), superadmin: t.withIdentity({ issuer: "convex", subject: "superadmin" }) };
}

describe("Super admin cross-tenant visibility", () => {
  it("anonymous is denied on adminSummary", async () => {
    const { t } = await seedBase();
    await expectCode(t.query(api.tenants.adminSummary), "UNAUTHENTICATED");
  });

  it("a non-super-admin member is denied on adminSummary", async () => {
    const { owner } = await seedBase();
    await expectCode(owner.query(api.tenants.adminSummary), "FORBIDDEN");
  });

  it("super admin can list all tenants with correct aggregate counts", async () => {
    const { superadmin, t } = await seedBase();
    await t.run(async (ctx) => {
      const now = Date.now();
      const tenant = (await ctx.db.query("tenants").withIndex("by_slug", (q) => q.eq("slug", "garage-a")).unique())!;
      await ctx.db.insert("customers", { tenantId: tenant._id, name: "C1", phone: "+254700000001", waOptIn: true, createdAt: now, updatedAt: now });
      await ctx.db.insert("customers", { tenantId: tenant._id, name: "C2", phone: "+254700000002", waOptIn: false, createdAt: now, updatedAt: now });
      await ctx.db.insert("vehicles", { tenantId: tenant._id, customerId: (await ctx.db.query("customers").first())!._id, make: "Toyota", model: "Fielder", createdAt: now, updatedAt: now });
      await ctx.db.insert("leads", { tenantId: tenant._id, phone: "+254711111111", source: "whatsapp", status: "new", createdAt: now, updatedAt: now });
      await ctx.db.insert("automationQueue", { tenantId: tenant._id, type: "whatsapp_outbound", payload: "{}", status: "pending", idempotencyKey: "ik-q1", attemptCount: 0, maxAttempts: 3, nextAttemptAt: now, createdAt: now, updatedAt: now });
    });
    const rows = await superadmin.query(api.tenants.adminSummary);
    expect(rows.length).toBe(2);
    const garageA = rows.find((r) => r.slug === "garage-a");
    expect(garageA).toBeDefined();
    expect(garageA!.members).toBe(1);
    expect(garageA!.customers).toBe(2);
    expect(garageA!.leads).toBe(1);
    expect(garageA!.queueBacklog).toBe(1);
    expect(garageA!.queueFailed).toBe(0);
  });
});

describe("Super admin onboarding (atomic)", () => {
  it("anonymous is denied on onboardTenant", async () => {
    const { t } = await seedBase();
    await expectCode(t.mutation(api.tenants.onboardTenant, { name: "X", slug: "x", memberTokenIdentifier: "convex|x", memberName: "X", memberRole: "owner" }), "UNAUTHENTICATED");
  });

  it("a non-super-admin is denied on onboardTenant", async () => {
    const { owner } = await seedBase();
    await expectCode(owner.mutation(api.tenants.onboardTenant, { name: "X", slug: "x", memberTokenIdentifier: "convex|x", memberName: "X", memberRole: "owner" }), "FORBIDDEN");
  });

  it("rejects invalid slug format and duplicate slugs", async () => {
    const { superadmin } = await seedBase();
    await expectCode(superadmin.mutation(api.tenants.onboardTenant, { name: "Bad", slug: "-bad", memberTokenIdentifier: "convex|x", memberName: "X", memberRole: "owner" }), "FORBIDDEN");
    await expectCode(superadmin.mutation(api.tenants.onboardTenant, { name: "Bad", slug: "garage-a", memberTokenIdentifier: "convex|x", memberName: "X", memberRole: "owner" }), "FORBIDDEN");
  });

  it("creates a tenant and assigns the member atomically", async () => {
    const { superadmin, t } = await seedBase();
    const result = await superadmin.mutation(api.tenants.onboardTenant, {
      name: "New Garage",
      slug: "new-garage",
      memberTokenIdentifier: "convex|newowner",
      memberName: "New Owner",
      memberRole: "owner",
    });
    expect(result.tenantId).toBeDefined();
    const tenant = await t.run((ctx) => ctx.db.get(result.tenantId));
    expect(tenant).not.toBeNull();
    expect(tenant!.name).toBe("New Garage");
    const member = await t.run((ctx) => ctx.db.query("members").withIndex("by_token", (q) => q.eq("tokenIdentifier", "convex|newowner")).unique());
    expect(member).not.toBeNull();
    expect(member!.tenantId).toBe(result.tenantId);
    expect(member!.role).toBe("owner");
    const rows = await superadmin.query(api.tenants.adminSummary);
    expect(rows.find((r) => r.slug === "new-garage")).toBeDefined();
  });

  it("rejects if the member already belongs to a garage", async () => {
    const { superadmin } = await seedBase();
    await expectCode(superadmin.mutation(api.tenants.onboardTenant, { name: "Dup Member", slug: "dup-member", memberTokenIdentifier: "convex|owner", memberName: "Dup", memberRole: "owner" }), "FORBIDDEN");
  });
});