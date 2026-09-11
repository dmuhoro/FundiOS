import { describe, expect, it } from "vitest";
import { convexTest } from "convex-test";
import { api } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

const DAY_MS = 24 * 60 * 60 * 1000;

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

async function seedWorld() {
  const t = convexTest(schema, modules);
  const now = Date.now();
  const ids = await t.run(async (ctx) => {
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

    const c1 = await ctx.db.insert("customers", {
      tenantId: tenantA,
      name: "Nyaga",
      phone: "+254700000001",
      waOptIn: true,
      createdAt: now,
      updatedAt: now,
    });
    const c2 = await ctx.db.insert("customers", {
      tenantId: tenantA,
      name: "Wanjiru",
      phone: "+254700000002",
      waOptIn: true,
      createdAt: now,
      updatedAt: now,
    });
    await ctx.db.insert("customers", {
      tenantId: tenantA,
      name: "Kariuki",
      phone: "+254700000003",
      waOptIn: false,
      createdAt: now,
      updatedAt: now,
    });
    const v1 = await ctx.db.insert("vehicles", {
      tenantId: tenantA,
      customerId: c1,
      make: "Toyota",
      model: "Fielder",
      createdAt: now,
      updatedAt: now,
    });
    await ctx.db.insert("vehicles", {
      tenantId: tenantA,
      customerId: c2,
      make: "Mazda",
      model: "Demio",
      createdAt: now,
      updatedAt: now,
    });
    await ctx.db.insert("services", {
      tenantId: tenantA,
      customerId: c1,
      vehicleId: v1,
      description: "Full service",
      status: "in_progress",
      paid: false,
      reminderSent: false,
      createdAt: now,
      updatedAt: now,
    });
    await ctx.db.insert("services", {
      tenantId: tenantA,
      customerId: c2,
      vehicleId: v1,
      description: "Brake pads",
      status: "completed",
      paid: true,
      reminderSent: true,
      createdAt: now,
      updatedAt: now,
    });
    await ctx.db.insert("leads", {
      tenantId: tenantA,
      name: "Akinyi",
      phone: "+254711111111",
      message: "My Fielder is noisy",
      source: "whatsapp",
      status: "new",
      createdAt: now - 2 * DAY_MS,
      updatedAt: now - 2 * DAY_MS,
    });
    await ctx.db.insert("leads", {
      tenantId: tenantA,
      phone: "+254722222222",
      source: "facebook",
      status: "lost",
      createdAt: now - 30 * DAY_MS,
      updatedAt: now - 30 * DAY_MS,
    });
    await ctx.db.insert("leads", {
      tenantId: tenantB,
      phone: "+254733333333",
      source: "whatsapp",
      status: "new",
      createdAt: now,
      updatedAt: now,
    });
    await ctx.db.insert("automationLogs", {
      tenantId: tenantA,
      triggerType: "whatsapp_inbound",
      entityType: "queue_job",
      entityId: "job-1",
      action: "whatsapp_sent",
      payload: '{"to":"+254711111111"}',
      status: "success",
      idempotencyKey: "ik-dash-1",
      createdAt: now - 3600_000,
    });
    await ctx.db.insert("automationQueue", {
      tenantId: tenantA,
      type: "whatsapp_outbound",
      payload: "{}",
      status: "pending",
      idempotencyKey: "ik-dash-queue-1",
      attemptCount: 0,
      maxAttempts: 3,
      nextAttemptAt: now,
      createdAt: now,
      updatedAt: now,
    });
    await ctx.db.insert("automationQueue", {
      tenantId: tenantA,
      type: "whatsapp_outbound",
      payload: "{}",
      status: "failed",
      idempotencyKey: "ik-dash-queue-2",
      attemptCount: 3,
      maxAttempts: 3,
      nextAttemptAt: now,
      lastError: "http_500",
      createdAt: now,
      updatedAt: now,
    });
    await ctx.db.insert("automationQueue", {
      tenantId: tenantB,
      type: "whatsapp_outbound",
      payload: "{}",
      status: "pending",
      idempotencyKey: "ik-dash-queue-b",
      attemptCount: 0,
      maxAttempts: 3,
      nextAttemptAt: now,
      createdAt: now,
      updatedAt: now,
    });
    return { tenantA, tenantB };
  });
  const alice = t.withIdentity({ issuer: "convex", subject: "alice" });
  const bob = t.withIdentity({ issuer: "convex", subject: "bob" });
  return { t, ids, alice, bob };
}

describe("Dashboard KPIs", () => {
  it("anonymous is denied", async () => {
    const t = convexTest(schema, modules);
    await expectCode(t.query(api.dashboard.overview), "UNAUTHENTICATED");
    await expectCode(t.query(api.dashboard.activityFeed), "UNAUTHENTICATED");
  });

  it("computes correct tenant KPIs from seeded data", async () => {
    const { alice } = await seedWorld();
    const kpi = await alice.query(api.dashboard.overview);
    expect(kpi.leadsTotal).toBe(2);
    expect(kpi.leadsNew7d).toBe(1);
    expect(kpi.customersTotal).toBe(3);
    expect(kpi.optInRate).toBe(67);
    expect(kpi.vehiclesTotal).toBe(2);
    expect(kpi.servicesOpen).toBe(1);
    expect(kpi.servicesCompleted).toBe(1);
    expect(kpi.remindersSent).toBe(1);
    expect(kpi.queueBacklog).toBe(1);
    expect(kpi.queueFailed).toBe(1);
  });

  it("scopes KPIs to the caller's tenant — no cross-tenant leakage", async () => {
    const { alice, bob } = await seedWorld();
    const a = await alice.query(api.dashboard.overview);
    const b = await bob.query(api.dashboard.overview);
    expect(a.leadsTotal).toBe(2);
    expect(b.leadsTotal).toBe(1);
    expect(a.queueBacklog).toBe(1);
    expect(b.queueBacklog).toBe(1);
    expect(b.queueFailed).toBe(0);
  });
});

describe("Dashboard activity feed", () => {
  it("returns a merged, time-descending feed of leads and automation events", async () => {
    const { alice } = await seedWorld();
    const feed = await alice.query(api.dashboard.activityFeed);
    expect(feed.length).toBeGreaterThanOrEqual(3);
    for (let i = 1; i < feed.length; i++) {
      expect(feed[i - 1].at).toBeGreaterThanOrEqual(feed[i].at);
    }
    const leadEvent = feed.find((e) => e.kind === "lead" && e.title === "New WhatsApp lead");
    expect(leadEvent).toBeDefined();
    expect(leadEvent!.detail).toContain("•••");
    expect(leadEvent!.detail).not.toContain("+254");
    const automationEvent = feed.find((e) => e.kind === "automation" && e.title === "WhatsApp message sent");
    expect(automationEvent).toBeDefined();
  });

  it("does not include another tenant's events", async () => {
    const { bob } = await seedWorld();
    const feed = await bob.query(api.dashboard.activityFeed);
    expect(feed.some((e) => e.title === "WhatsApp message sent")).toBe(false);
    expect(feed.length).toBe(1);
  });
});

describe("Acquisition funnel", () => {
  it("attributes a campaign-landing capture and masks phone numbers", async () => {
    const t = convexTest(schema, modules);
    const now = Date.now();
    const tenantId = await t.run((ctx) =>
      ctx.db.insert("tenants", {
        name: "Quickstop Auto Garage",
        slug: "quickstop",
        planTier: "starter",
        metaVerified: false,
        metadata: "{}",
        createdAt: now,
        updatedAt: now,
      }),
    );
    await t.run((ctx) =>
      ctx.db.insert("members", {
        tenantId,
        tokenIdentifier: "convex|alice",
        name: "Alice",
        role: "owner",
        active: true,
        createdAt: now,
        updatedAt: now,
      }),
    );
    const alice = t.withIdentity({ issuer: "convex", subject: "alice" });

    await t.mutation(api.campaigns.captureLandingLead, {
      slug: "quickstop",
      phone: "+254700333444",
      name: "Wanjiru",
      source: "facebook",
      campaignKey: "quickstop_awareness",
    });

    const acquisition = await alice.query(api.dashboard.acquisition);
    expect(acquisition.total).toBe(1);
    expect(acquisition.facebookLeads).toBe(1);
    expect(acquisition.byCampaign).toEqual([
      { campaign: "quickstop_awareness", count: 1 },
    ]);
    expect(acquisition.bySource).toEqual([{ source: "facebook", count: 1 }]);
    expect(acquisition.untracked).toBe(0);
    expect(acquisition.recent[0].campaignKey).toBe("quickstop_awareness");
    expect(acquisition.recent[0].phone).not.toContain("+254700333444");
    expect(acquisition.recent[0].phone).toContain("•••");
  });
});