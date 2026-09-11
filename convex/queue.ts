import { action, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import { enqueueJob, backoffMs } from "./lib/jobs";
import { logAutomation, sha256Hex } from "./lib/automation";
import { sendWhatsAppText } from "./lib/whatsappSender";
import { z } from "zod";

const outboundPayloadSchema = z.object({
  to: z.string(),
  phoneNumberId: z.string(),
  message: z.string(),
  source: z.enum(["lead_auto_reply", "service_reminder"]),
});

export const jobTypes = v.union(
  v.literal("whatsapp_outbound"),
  v.literal("whatsapp_reminder"),
);

export const enqueue = mutation({
  args: {
    tenantId: v.id("tenants"),
    type: jobTypes,
    payload: v.string(),
    idempotencyKey: v.string(),
  },
  handler: async (ctx, args) => {
    return await enqueueJob(ctx, {
      tenantId: args.tenantId,
      type: args.type,
      payload: JSON.parse(args.payload) as Record<string, unknown>,
      idempotencyKey: args.idempotencyKey,
    });
  },
});

export const dueJobs = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const now = Date.now();
    const limit = args.limit ?? 20;
    const pending = await ctx.db
      .query("automationQueue")
      .withIndex("by_due", (q) =>
        q.eq("status", "pending").lte("nextAttemptAt", now),
      )
      .order("asc")
      .take(limit);
    if (pending.length >= limit) return pending;
    const retrying = await ctx.db
      .query("automationQueue")
      .withIndex("by_due", (q) =>
        q.eq("status", "retrying").lte("nextAttemptAt", now),
      )
      .order("asc")
      .take(limit - pending.length);
    const seen = new Set(pending.map((j) => j._id));
    return [...pending, ...retrying.filter((j) => !seen.has(j._id))];
  },
});

export const claimJob = mutation({
  args: { jobId: v.id("automationQueue") },
  handler: async (ctx, args) => {
    const job = await ctx.db.get(args.jobId);
    if (!job) return null;
    if (job.status !== "pending" && job.status !== "retrying") return null;
    const now = Date.now();
    await ctx.db.patch(args.jobId, {
      status: "processing",
      attemptCount: job.attemptCount + 1,
      updatedAt: now,
    });
    return { ...job, status: "processing" as const, attemptCount: job.attemptCount + 1, updatedAt: now };
  },
});

export const finalizeJob = mutation({
  args: { jobId: v.id("automationQueue") },
  handler: async (ctx, args) => {
    const job = await ctx.db.get(args.jobId);
    if (!job) return null;
    await ctx.db.patch(args.jobId, {
      status: "dispatched",
      updatedAt: Date.now(),
    });
    const auditKey = await sha256Hex(`whatsapp_sent|${job._id}`);
    await logAutomation(ctx, {
      tenantId: job.tenantId,
      triggerType:
        job.type === "whatsapp_reminder" ? "reminder_due" : "whatsapp_inbound",
      entityType: "queue_job",
      entityId: job._id,
      action: "whatsapp_sent",
      payload: job.payload,
      idempotencyKey: auditKey,
    });
    return job;
  },
});

export const failJob = mutation({
  args: { jobId: v.id("automationQueue"), error: v.string() },
  handler: async (ctx, args) => {
    const job = await ctx.db.get(args.jobId);
    if (!job) return null;
    const attempts = job.attemptCount;
    if (attempts >= job.maxAttempts) {
      await ctx.db.patch(args.jobId, {
        status: "failed",
        lastError: args.error,
        updatedAt: Date.now(),
      });
      const auditKey = await sha256Hex(`whatsapp_send_failed|${job._id}`);
      await logAutomation(ctx, {
        tenantId: job.tenantId,
        triggerType:
          job.type === "whatsapp_reminder" ? "reminder_due" : "whatsapp_inbound",
        entityType: "queue_job",
        entityId: job._id,
        action: "whatsapp_send_failed",
        payload: job.payload,
        status: "failed",
        errorMessage: args.error,
        idempotencyKey: auditKey,
      });
      return { ...job, attemptCount: attempts };
    }
    await ctx.db.patch(args.jobId, {
      status: "retrying",
      lastError: args.error,
      nextAttemptAt: Date.now() + backoffMs(attempts),
      updatedAt: Date.now(),
    });
    const auditKey = await sha256Hex(`whatsapp_retry|${job._id}|${attempts}`);
    await logAutomation(ctx, {
      tenantId: job.tenantId,
      triggerType:
        job.type === "whatsapp_reminder" ? "reminder_due" : "whatsapp_inbound",
      entityType: "queue_job",
      entityId: job._id,
      action: "whatsapp_retry",
      payload: job.payload,
      status: "pending",
      errorMessage: args.error,
      idempotencyKey: auditKey,
    });
    return { ...job, attemptCount: attempts };
  },
});

export const processQueue = action({
  args: { limit: v.optional(v.number()) },
  handler: async (
    ctx,
    args,
  ): Promise<{ scanned: number; dispatched: number; failed: number }> => {
    const jobs = await ctx.runQuery(api.queue.dueJobs, { limit: args.limit });
    let dispatched = 0;
    let failed = 0;

    for (const job of jobs) {
      const claimed = await ctx.runMutation(api.queue.claimJob, {
        jobId: job._id,
      });
      if (!claimed) continue;

      const parsed = outboundPayloadSchema.safeParse(JSON.parse(job.payload));
      if (!parsed.success) {
        await ctx.runMutation(api.queue.failJob, {
          jobId: job._id,
          error: `invalid_payload: ${parsed.error.message}`,
        });
        failed += 1;
        continue;
      }

      const result = await sendWhatsAppText({
        to: parsed.data.to,
        phoneNumberId: parsed.data.phoneNumberId,
        body: parsed.data.message,
        accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
      });

      if (result.ok) {
        await ctx.runMutation(api.queue.finalizeJob, { jobId: job._id });
        dispatched += 1;
      } else {
        await ctx.runMutation(api.queue.failJob, {
          jobId: job._id,
          error: result.code,
        });
        failed += 1;
      }
    }

    return { scanned: jobs.length, dispatched, failed };
  },
});