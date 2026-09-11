/**
 * P0 Bug Test: Cross-tenant WhatsApp queue worker isolation
 *
 * Asserts that a WhatsApp job queued for garage A cannot be processed
 * in the context of garage B (PRD § 2, P0 Bug 1).
 *
 * The queue worker requires an explicit garage scope and refuses any job
 * whose garage_id does not match the worker context, recording the refusal
 * so the caller gets a clear reason and an audit trail.
 */
import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import {
  QueueScopeError,
  createIdempotencyKey,
  createMemoryQueueStore,
  enqueueJob,
  processGarageQueue,
  type QueueDispatch,
  type QueueJobRecord,
  type QueueStore,
} from "@/lib/queue/notification-queue";
import type { QueueAuditEntry } from "@/lib/queue/notification-queue";

const GARAGE_A = "garage-aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const GARAGE_B = "garage-bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

let dispatch: Mock<QueueDispatch>;

function makeJob(overrides: Partial<QueueJobRecord>): QueueJobRecord {
  return {
    id: overrides.id ?? "job-1",
    garageId: GARAGE_A,
    eventType: "lead_created",
    idempotencyKey: createIdempotencyKey(GARAGE_A, "lead_created"),
    payload: null,
    status: "pending",
    retryCount: 0,
    maxRetries: 3,
    nextRetryAt: null,
    lastError: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("WhatsApp queue — cross-tenant isolation (P0 gate)", () => {
  beforeEach(() => {
    dispatch = vi.fn<QueueDispatch>(() => ({ success: true }));
  });

  it("enqueueJob rejects calls that lack a garage scope", async () => {
    const store = createMemoryQueueStore();
    await expect(
      enqueueJob({ store, garageId: "", eventType: "lead_created" }),
    ).rejects.toThrow(QueueScopeError);
    await expect(
      enqueueJob({ store, garageId: GARAGE_A, eventType: "" }),
    ).rejects.toThrow(QueueScopeError);
  });

  it("processGarageQueue rejects calls that lack a garage scope", async () => {
    const store = createMemoryQueueStore();
    await expect(
      processGarageQueue({ store, garageId: "" }),
    ).rejects.toThrow(QueueScopeError);
  });

  it("rejects a job whose garage_id does not match the worker context", async () => {
    const buggyStore: QueueStore = {
      async create(job) {
        return { id: job.garageId.startsWith(GARAGE_B) ? "job-b" : "job-a", status: "queued" };
      },
      async fetchPending() {
        return [makeJob({ id: "job-a", garageId: GARAGE_A }), makeJob({ id: "job-b", garageId: GARAGE_B })];
      },
      async markDispatched() {},
      async markRetry() {},
      async markFailed() {},
    };

    const result = await processGarageQueue({
      store: buggyStore,
      garageId: GARAGE_A,
      dispatch,
      audit: () => undefined,
    });

    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(dispatch.mock.calls[0][0]).toMatchObject({ id: "job-a", garageId: GARAGE_A });
    expect(result).toEqual({ processed: 1, failed: 1, mismatches: 1 });
  });

  it("logs a tenant_mismatch error to automation_logs when mismatch detected", async () => {
    const audit = vi.fn();
    const buggyStore: QueueStore = {
      async create() {
        return { id: "job-b", status: "queued" };
      },
      async fetchPending() {
        return [makeJob({ id: "job-b", garageId: GARAGE_B, eventType: "msg_confirmation" })];
      },
      async markDispatched() {},
      async markRetry() {},
      async markFailed() {},
    };

    await processGarageQueue({ store: buggyStore, garageId: GARAGE_A, dispatch, audit });

    expect(dispatch).not.toHaveBeenCalled();
    expect(audit).toHaveBeenCalledTimes(1);
    const entry: QueueAuditEntry = audit.mock.calls[0][0];
    expect(entry.action).toBe("queue_tenant_mismatch_rejected");
    expect(entry.severity).toBe("error");
    expect(entry.garageId).toBe(GARAGE_A);
    expect(entry.entityId).toBe("job-b");
    expect(entry.reason).toContain(GARAGE_B);
    expect(entry.reason).toContain(GARAGE_A);
  });

  it("scoped store: a worker for garage A never sees garage B's jobs", async () => {
    const store = createMemoryQueueStore([
      makeJob({ id: "job-a", garageId: GARAGE_A }),
      makeJob({ id: "job-b", garageId: GARAGE_B }),
    ]);

    const result = await processGarageQueue({
      store,
      garageId: GARAGE_A,
      dispatch,
      audit: () => undefined,
    });

    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(dispatch.mock.calls[0][0]).toMatchObject({ garageId: GARAGE_A });
    expect(result).toEqual({ processed: 1, failed: 0, mismatches: 0 });
  });

  it("idempotency key prevents duplicate pending jobs for the same event", async () => {
    const store = createMemoryQueueStore();
    const first = await enqueueJob({ store, garageId: GARAGE_A, eventType: "lead_created" });
    const second = await enqueueJob({ store, garageId: GARAGE_A, eventType: "lead_created" });

    expect(first).toMatchObject({ status: "queued" });
    expect(second).toMatchObject({ status: "already_pending", id: first.id });

    const result = await processGarageQueue({ store, garageId: GARAGE_A, dispatch });
    expect(result).toEqual({ processed: 1, failed: 0, mismatches: 0 });
    expect(dispatch).toHaveBeenCalledTimes(1);
  });
});