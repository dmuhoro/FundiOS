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

async function seed() {
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
      tokenIdentifier: "convex|unassigned",
      name: "Floating",
      role: "owner",
      active: true,
      createdAt: now,
      updatedAt: now,
    });
  });
  return { t, alice: t.withIdentity({ issuer: "convex", subject: "alice" }), floating: t.withIdentity({ issuer: "convex", subject: "unassigned" }) };
}

describe("GMB launch checklist", () => {
  it("anonymous is denied on getChecklist and updateChecklist", async () => {
    const { t } = await seed();
    await expectCode(t.query(api.gmb.getChecklist), "UNAUTHENTICATED");
    await expectCode(t.mutation(api.gmb.updateChecklist, { completedItems: [], notes: "" }), "UNAUTHENTICATED");
  });

  it("a member without a garage cannot read or write a checklist (TENANT_SCOPE)", async () => {
    const { floating } = await seed();
    await expectCode(floating.query(api.gmb.getChecklist), "TENANT_SCOPE");
    await expectCode(floating.mutation(api.gmb.updateChecklist, { completedItems: [], notes: "" }), "TENANT_SCOPE");
  });

  it("saves and reads back a checklist per tenant", async () => {
    const { alice } = await seed();
    const empty = await alice.query(api.gmb.getChecklist);
    expect(empty.items.length).toBeGreaterThanOrEqual(9);
    expect(empty.completedItems).toEqual([]);

    const done = await alice.mutation(api.gmb.updateChecklist, {
      completedItems: ["claim_profile", "verify_business", "set_categories"],
      notes: "Waiting for verification postcard.",
    });
    expect(done.saved).toBe(true);
    expect(done.completed).toBe(3);

    const after = await alice.query(api.gmb.getChecklist);
    expect(after.completedItems).toEqual(["claim_profile", "verify_business", "set_categories"]);
    expect(after.notes).toBe("Waiting for verification postcard.");
  });

  it("rejects unknown checklist item keys (INVALID_ARGS)", async () => {
    const { alice } = await seed();
    await expectCode(alice.mutation(api.gmb.updateChecklist, { completedItems: ["not-a-real-item"], notes: "" }), "INVALID_ARGS");
  });

  it("isolates checklists between tenants", async () => {
    const { alice, t } = await seed();
    await alice.mutation(api.gmb.updateChecklist, {
      completedItems: ["claim_profile"],
      notes: "A notes",
    });
    const tenantB = await t.run((ctx) => {
      const member = ctx.db.query("members").withIndex("by_token", (q) => q.eq("tokenIdentifier", "convex|unassigned")).unique();
      return member;
    });
    void tenantB;
    const rows = await t.run((ctx) => ctx.db.query("gmbChecklists").collect());
    expect(rows).toHaveLength(1);
    expect(rows[0].notes).toBe("A notes");
  });
});