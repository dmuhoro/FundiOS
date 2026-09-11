import type { MutationCtx } from "../_generated/server";
import type { Doc, Id } from "../_generated/dataModel";
import { logAutomation, sha256Hex } from "./automation";

export type JobType = Doc<"automationQueue">["type"];

export type JobEnvelope = {
  tenantId: Id<"tenants">;
  type: JobType;
  payload: Record<string, unknown>;
  idempotencyKey: string;
  maxAttempts?: number;
};

export async function enqueueJob(
  ctx: MutationCtx,
  job: JobEnvelope,
): Promise<{ jobId: Id<"automationQueue">; deduped: boolean }> {
  const existing = await ctx.db
    .query("automationQueue")
    .withIndex("by_idempotency", (q) => q.eq("idempotencyKey", job.idempotencyKey))
    .first();
  if (existing) {
    return { jobId: existing._id, deduped: true };
  }

  const now = Date.now();
  const jobId = await ctx.db.insert("automationQueue", {
    tenantId: job.tenantId,
    type: job.type,
    payload: JSON.stringify(job.payload),
    status: "pending",
    idempotencyKey: job.idempotencyKey,
    attemptCount: 0,
    maxAttempts: job.maxAttempts ?? 3,
    nextAttemptAt: now,
    createdAt: now,
    updatedAt: now,
  });

  const auditKey = await sha256Hex(
    `queue_enqueued|${job.tenantId}|${job.idempotencyKey}`,
  );
  await logAutomation(ctx, {
    tenantId: job.tenantId,
    triggerType:
      job.type === "whatsapp_reminder" ? "reminder_due" : "whatsapp_inbound",
    entityType: "queue_job",
    entityId: jobId,
    action: "queue_enqueued",
    idempotencyKey: auditKey,
  });

  return { jobId, deduped: false };
}

export function backoffMs(attemptCount: number): number {
  return Math.min(2 ** attemptCount * 1_000, 300_000);
}