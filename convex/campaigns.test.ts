import { describe, expect, it } from "vitest";
import { convexTest } from "convex-test";
import type { Doc, Id } from "./_generated/dataModel";
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

type TestContext = ReturnType<typeof convexTest>;

async function allLeads(t: TestContext): Promise<Doc<"leads">[]> {
  return t.run(async (ctx) => ctx.db.query("leads").collect());
}

async function leadByPhone(
  t: TestContext,
  tenantId: Id<"tenants">,
  phone: string,
): Promise<Doc<"leads"> | undefined> {
  const leads = await allLeads(t);
  return leads.find((l) => l.tenantId === tenantId && l.phone === phone);
}

async function seedWorld() {
  const t = convexTest(schema, modules);
  const now = Date.now();
  const { tenantA, tenantB } = await t.run(async (ctx) => {
    const tenantA = await ctx.db.insert("tenants", {
      name: "Quickstop Garage",
      slug: "quickstop",
      planTier: "starter",
      metaVerified: false,
      metadata: "{}",
      createdAt: now,
      updatedAt: now,
    });
    const tenantB = await ctx.db.insert("tenants", {
      name: "Other Garage",
      slug: "other-garage",
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
    return { tenantA, tenantB };
  });
  const alice = t.withIdentity({ issuer: "convex", subject: "alice" });
  return { t, tenantA, tenantB, alice };
}

describe("Campaign landing capture", () => {
  it("captures an attributed lead under the resolved tenant", async () => {
    const { t, tenantA } = await seedWorld();
    const result = await t.mutation(api.campaigns.captureLandingLead, {
      slug: "quickstop",
      phone: "+254700111222",
      name: "Nyaga",
      message: "Noisy brakes",
      source: "facebook",
      campaignKey: "quickstop_awareness_march",
    });
    expect(result.ok).toBe(true);

    const lead = await leadByPhone(t, tenantA, "+254700111222");
    expect(lead).toBeDefined();
    expect(lead?.source).toBe("facebook");
    expect(lead?.campaignKey).toBe("quickstop_awareness_march");
    expect(lead?.message).toBe("Noisy brakes");
    expect(lead?.phone).toBe("+254700111222");

    const logs = await t.run(async (ctx) => ctx.db.query("automationLogs").collect());
    expect(logs).toHaveLength(1);
    expect(logs[0].triggerType).toBe("campaign_fired");
    expect(logs[0].entityId).toBe(result.leadId);
  });

  it("dedupes re-delivered captures on the same phone (idempotent)", async () => {
    const { t } = await seedWorld();
    const first = await t.mutation(api.campaigns.captureLandingLead, {
      slug: "quickstop",
      phone: "0711222333",
      source: "facebook",
      campaignKey: "c1",
    });
    const second = await t.mutation(api.campaigns.captureLandingLead, {
      slug: "quickstop",
      phone: "+254711222333",
      source: "facebook",
      campaignKey: "c1",
    });
    expect(second.leadId).toBe(first.leadId);

    const leads = await t.run(async (ctx) => ctx.db.query("leads").collect());
    expect(leads).toHaveLength(1);
  });

  it("normalizes local and +254 phone formats to one canonical lead", async () => {
    const { t } = await seedWorld();
    const captured = await t.mutation(api.campaigns.captureLandingLead, {
      slug: "quickstop",
      phone: "0700000000",
      source: "instagram",
      campaignKey: "insta_campaign",
    });
    expect(captured.leadId).toBeDefined();
    const byPhone = await t.run(async (ctx) =>
      ctx.db.query("leads").collect(),
    );
    expect(byPhone).toHaveLength(1);
    expect(byPhone[0].phone).toBe("+254700000000");
    expect(byPhone[0].source).toBe("instagram");
  });

  it("fails closed on an unknown campaign slug", async () => {
    const { t } = await seedWorld();
    await expectCode(
      t.mutation(api.campaigns.captureLandingLead, {
        slug: "nonexistent",
        phone: "+254700000000",
      }),
      "FORBIDDEN",
    );
  });

  it("fails closed on an invalid slug shape", async () => {
    const { t } = await seedWorld();
    await expectCode(
      t.mutation(api.campaigns.captureLandingLead, {
        slug: "GOOD SLAUGHTER?",
        phone: "+254700000000",
      }),
      "FORBIDDEN",
    );
  });

  it("fails closed on a non-Kenyan phone number", async () => {
    const { t } = await seedWorld();
    await expectCode(
      t.mutation(api.campaigns.captureLandingLead, {
        slug: "quickstop",
        phone: "+15551234567",
      }),
      "FORBIDDEN",
    );
  });

  it("does not leak a capture into another tenant's data", async () => {
    const { t, tenantB } = await seedWorld();
    await t.mutation(api.campaigns.captureLandingLead, {
      slug: "quickstop",
      phone: "+254701111111",
      source: "facebook",
      campaignKey: "quickstop_ad",
    });
    const otherLeads = await t.run(async (ctx) =>
      ctx.db
        .query("leads")
        .withIndex("by_tenant", (q) => q.eq("tenantId", tenantB))
        .collect(),
    );
    expect(otherLeads).toHaveLength(0);
  });
});