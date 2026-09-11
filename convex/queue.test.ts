import { describe, expect, it } from "vitest";
import { convexTest } from "convex-test";
import { api } from "./_generated/api";
import schema from "./schema";
import { setTransportForTests } from "../convex/lib/whatsappSender";

const modules = import.meta.glob("./**/*.ts");

function makePayload(overrides: Record<string, unknown> = {}) {
  return JSON.stringify({
    to: "254712345678",
    phoneNumberId: "105431206008513",
    message: "Hello from FundiOS",
    source: "lead_auto_reply",
    ...overrides,
  });
}

async function seedTenant(t: ReturnType<typeof convexTest>, slug: string) {
  return await t.run(async (ctx) => {
    const now = Date.now();
    return await ctx.db.insert("tenants", {
      name: `${slug} Garage`,
      slug,
      planTier: "starter",
      metaVerified: false,
      metadata: "{}",
      createdAt: now,
      updatedAt: now,
    });
  });
}

describe("Automation queue durability", () => {
  it("enqueue deduplicates by idempotency key", async () => {
    const t = convexTest(schema, modules);
    const tenantId = await seedTenant(t, "q-dedupe");

    const first = await t.mutation(api.queue.enqueue, {
      tenantId,
      type: "whatsapp_outbound",
      payload: makePayload(),
      idempotencyKey: "ik-dedupe-1",
    });
    expect(first.deduped).toBe(false);

    const second = await t.mutation(api.queue.enqueue, {
      tenantId,
      type: "whatsapp_outbound",
      payload: makePayload(),
      idempotencyKey: "ik-dedupe-1",
    });
    expect(second.deduped).toBe(true);
    expect(second.jobId).toBe(first.jobId);

    const jobs = await t.run((ctx) =>
      ctx.db
        .query("automationQueue")
        .withIndex("by_tenant", (q) => q.eq("tenantId", tenantId))
        .collect(),
    );
    expect(jobs).toHaveLength(1);
  });

  it("claimJob transitions pending → processing and increments attemptCount", async () => {
    const t = convexTest(schema, modules);
    const tenantId = await seedTenant(t, "q-claim");
    const { jobId } = await t.mutation(api.queue.enqueue, {
      tenantId,
      type: "whatsapp_outbound",
      payload: makePayload(),
      idempotencyKey: "ik-claim-1",
    });

    const claimed = await t.mutation(api.queue.claimJob, { jobId });
    expect(claimed).not.toBeNull();
    expect(claimed!.status).toBe("processing");
    expect(claimed!.attemptCount).toBe(1);

    const stale = await t.mutation(api.queue.claimJob, { jobId });
    expect(stale).toBeNull();
  });

  it("finalizeJob marks dispatched and writes an audit entry", async () => {
    const t = convexTest(schema, modules);
    const tenantId = await seedTenant(t, "q-final");
    const { jobId } = await t.mutation(api.queue.enqueue, {
      tenantId,
      type: "whatsapp_outbound",
      payload: makePayload(),
      idempotencyKey: "ik-final-1",
    });
    await t.mutation(api.queue.claimJob, { jobId });
    await t.mutation(api.queue.finalizeJob, { jobId });

    const job = await t.run((ctx) => ctx.db.get(jobId));
    expect(job!.status).toBe("dispatched");

    const audit = await t.run((ctx) =>
      ctx.db
        .query("automationLogs")
        .withIndex("by_tenant", (q) => q.eq("tenantId", tenantId))
        .collect(),
    );
    expect(audit.some((e) => e.action === "whatsapp_sent")).toBe(true);
  });

  it("failJob retries under maxAttempts and transitions to failed at cap", async () => {
    const t = convexTest(schema, modules);
    const tenantId = await seedTenant(t, "q-fail");
    const { jobId } = await t.mutation(api.queue.enqueue, {
      tenantId,
      type: "whatsapp_outbound",
      payload: makePayload(),
      idempotencyKey: "ik-fail-1",
    });
    await t.mutation(api.queue.claimJob, { jobId });
    await t.mutation(api.queue.failJob, { jobId, error: "http_500" });
    let job = await t.run((ctx) => ctx.db.get(jobId));
    expect(job!.status).toBe("retrying");
    expect(job!.attemptCount).toBe(1);

    await t.mutation(api.queue.claimJob, { jobId });
    await t.mutation(api.queue.failJob, { jobId, error: "http_500" });
    job = await t.run((ctx) => ctx.db.get(jobId));
    expect(job!.status).toBe("retrying");
    expect(job!.attemptCount).toBe(2);

    await t.mutation(api.queue.claimJob, { jobId });
    await t.mutation(api.queue.failJob, { jobId, error: "http_500" });
    job = await t.run((ctx) => ctx.db.get(jobId));
    expect(job!.status).toBe("failed");
    expect(job!.attemptCount).toBe(3);
    expect(job!.lastError).toBe("http_500");

    const audit = await t.run((ctx) =>
      ctx.db
        .query("automationLogs")
        .withIndex("by_tenant", (q) => q.eq("tenantId", tenantId))
        .collect(),
    );
    expect(audit.some((e) => e.action === "whatsapp_send_failed")).toBe(true);
  });

  it("processQueue dispatches via the sender and finalizes (end-to-end happy path)", async () => {
    const t = convexTest(schema, modules);
    const tenantId = await seedTenant(t, "q-e2e");
    await t.mutation(api.queue.enqueue, {
      tenantId,
      type: "whatsapp_outbound",
      payload: makePayload(),
      idempotencyKey: "ik-e2e-1",
    });

    setTransportForTests(async (_url, _init) =>
      new Response(JSON.stringify({ success: true }), { status: 200 }),
    );
    const prevToken = process.env.WHATSAPP_ACCESS_TOKEN;
    process.env.WHATSAPP_ACCESS_TOKEN = "test-token";
    try {
      const result = await t.action(api.queue.processQueue, { limit: 10 });
      expect(result.scanned).toBeGreaterThanOrEqual(1);
      expect(result.dispatched).toBeGreaterThanOrEqual(1);
      expect(result.failed).toBe(0);
    } finally {
      process.env.WHATSAPP_ACCESS_TOKEN = prevToken;
      setTransportForTests(null);
    }

    const job = await t.run((ctx) =>
      ctx.db
        .query("automationQueue")
        .withIndex("by_tenant", (q) => q.eq("tenantId", tenantId))
        .first(),
    );
    expect(job!.status).toBe("dispatched");
  });

  it("processQueue marks failed when the sender returns a non-200 (and retries on next cycle)", async () => {
    const t = convexTest(schema, modules);
    const tenantId = await seedTenant(t, "q-e2e-fail");
    await t.mutation(api.queue.enqueue, {
      tenantId,
      type: "whatsapp_outbound",
      payload: makePayload(),
      idempotencyKey: "ik-e2e-fail-1",
    });

    setTransportForTests(async () => new Response("error", { status: 500 }));
    const prevToken = process.env.WHATSAPP_ACCESS_TOKEN;
    process.env.WHATSAPP_ACCESS_TOKEN = "test-token";
    try {
      const result = await t.action(api.queue.processQueue, { limit: 10 });
      expect(result.scanned).toBeGreaterThanOrEqual(1);
      expect(result.failed).toBeGreaterThanOrEqual(1);
    } finally {
      process.env.WHATSAPP_ACCESS_TOKEN = prevToken;
      setTransportForTests(null);
    }

    const job = await t.run((ctx) =>
      ctx.db
        .query("automationQueue")
        .withIndex("by_tenant", (q) => q.eq("tenantId", tenantId))
        .first(),
    );
    expect(job!.status).toBe("retrying");
    expect(job!.lastError).toBe("http_500");
  });
});