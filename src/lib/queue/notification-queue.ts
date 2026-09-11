import crypto from "node:crypto";

export class QueueScopeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "QueueScopeError";
  }
}

export type QueueStatus = "pending" | "dispatched" | "failed";

export interface QueueJobRecord {
  id: string;
  garageId: string;
  eventType: string;
  idempotencyKey: string;
  payload: Record<string, unknown> | null;
  status: QueueStatus;
  retryCount: number;
  maxRetries: number;
  nextRetryAt: string | null;
  lastError: string | null;
  createdAt: string;
}

export interface QueueStore {
  create(job: {
    garageId: string;
    eventType: string;
    idempotencyKey: string;
    payload: Record<string, unknown> | null;
    maxRetries: number;
    createdAt?: string;
  }): Promise<{ id: string; status: "queued" | "duplicate" }>;
  fetchPending(input: { garageId: string; limit: number; now: string }): Promise<QueueJobRecord[]>;
  markDispatched(id: string): Promise<void>;
  markRetry(id: string, input: { nextRetryAt: string; error: string }): Promise<void>;
  markFailed(id: string, error: string): Promise<void>;
}

export interface QueueDispatchResult {
  success: boolean;
  error?: string;
}

export type QueueDispatch = (
  job: QueueJobRecord,
) => QueueDispatchResult | Promise<QueueDispatchResult>;

export interface QueueAuditEntry {
  garageId: string;
  action: "queue_tenant_mismatch_rejected";
  entityId: string;
  reason: string;
  idempotencyKey: string;
  severity: "error";
}

export type AuditWriter = (entry: QueueAuditEntry) => void | Promise<void>;

export function createIdempotencyKey(
  garageId: string,
  eventType: string,
  payload?: Record<string, unknown> | null,
): string {
  const canonical = payload ? JSON.stringify(payload, Object.keys(payload).sort()) : "";
  return crypto
    .createHash("sha256")
    .update(`${garageId}:${eventType}:${canonical}`)
    .digest("hex");
}

export async function enqueueJob(input: {
  store: QueueStore;
  garageId: string;
  eventType: string;
  payload?: Record<string, unknown> | null;
  maxRetries?: number;
  idempotencyKey?: string;
  createdAt?: string;
}): Promise<{ id: string | null; status: "queued" | "already_pending" }> {
  const { store, garageId, eventType, payload = null, maxRetries = 3, createdAt } = input;

  if (!garageId) {
    throw new QueueScopeError("enqueueJob requires a garage scope (garageId)");
  }
  if (!eventType) {
    throw new QueueScopeError("enqueueJob requires an eventType");
  }

  const idempotencyKey = input.idempotencyKey ?? createIdempotencyKey(garageId, eventType, payload);
  const result = await store.create({
    garageId,
    eventType,
    payload,
    maxRetries,
    idempotencyKey,
    createdAt,
  });

  return { id: result.id, status: result.status === "duplicate" ? "already_pending" : "queued" };
}

export async function processGarageQueue(input: {
  store: QueueStore;
  garageId: string;
  dispatch?: QueueDispatch;
  batchSize?: number;
  audit?: AuditWriter;
  now?: string;
}): Promise<{ processed: number; failed: number; mismatches: number }> {
  const { store, garageId, batchSize = 10, now = new Date().toISOString() } = input;
  const dispatch: QueueDispatch = input.dispatch ?? (() => ({ success: true }));
  const audit: AuditWriter = input.audit ?? (() => undefined);

  if (!garageId) {
    throw new QueueScopeError("processGarageQueue requires a garage scope (garageId)");
  }

  const rows = await store.fetchPending({ garageId, limit: batchSize, now });

  let processed = 0;
  let failed = 0;
  let mismatches = 0;

  for (const job of rows) {
    if (job.garageId !== garageId) {
      mismatches++;
      const reason = `job.garage_id=${job.garageId} does not match worker garage_id=${garageId}`;
      await audit({
        garageId,
        action: "queue_tenant_mismatch_rejected",
        entityId: job.id,
        reason,
        idempotencyKey: job.idempotencyKey,
        severity: "error",
      });
      await store.markFailed(job.id, reason);
      failed++;
      continue;
    }

    try {
      const result = await dispatch(job);
      if (result.success) {
        await store.markDispatched(job.id);
        processed++;
      } else {
        throw new Error(result.error || "Dispatch returned failure");
      }
    } catch (err) {
      const message = (err as Error).message;
      const exhausted = job.retryCount + 1 >= job.maxRetries;
      if (exhausted) {
        await store.markFailed(job.id, message);
      } else {
        const backoffMs = 1000 * 2 ** job.retryCount;
        const nextRetryAt = new Date(Date.parse(now) + backoffMs).toISOString();
        await store.markRetry(job.id, { nextRetryAt, error: message });
      }
      failed++;
    }
  }

  return { processed, failed, mismatches };
}

export function createMemoryQueueStore(seed: QueueJobRecord[] = []): QueueStore {
  let nextId = seed.length + 1;
  const rows: QueueJobRecord[] = [...seed];

  const findById = (id: string): QueueJobRecord | undefined => rows.find((r) => r.id === id);

  return {
    async create(job) {
      const existing = rows.find((r) => r.idempotencyKey === job.idempotencyKey);
      if (existing) {
        return { id: existing.id, status: "duplicate" };
      }
      const id = `q${nextId++}`;
      rows.push({
        ...job,
        id,
        status: "pending",
        retryCount: 0,
        nextRetryAt: null,
        lastError: null,
        createdAt: job.createdAt ?? new Date().toISOString(),
      });
      return { id, status: "queued" };
    },

    async fetchPending({ garageId, limit, now }) {
      return rows
        .filter(
          (r) =>
            r.status === "pending" &&
            r.garageId === garageId &&
            (r.nextRetryAt === null || r.nextRetryAt <= now),
        )
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
        .slice(0, limit);
    },

    async markDispatched(id) {
      const row = findById(id);
      if (row) row.status = "dispatched";
    },

    async markRetry(id, { nextRetryAt, error }) {
      const row = findById(id);
      if (row) {
        row.status = "pending";
        row.retryCount += 1;
        row.nextRetryAt = nextRetryAt;
        row.lastError = error;
      }
    },

    async markFailed(id, error) {
      const row = findById(id);
      if (row) {
        row.status = "failed";
        row.lastError = error;
      }
    },
  };
}