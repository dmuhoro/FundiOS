/**
 * P0 Bug Test: Cross-tenant WhatsApp queue worker isolation
 *
 * Asserts that a WhatsApp job queued for garage A cannot be processed
 * in the context of garage B.
 *
 * DO NOT extract the queue module from Kay's until this suite passes
 * against the real queue path (PRD § 2, P0 Bug 1).
 */
import { describe, it } from "vitest";

describe("WhatsApp queue — cross-tenant isolation", () => {
  it.todo("rejects a job whose garage_id does not match the worker context");
  it.todo("logs a tenant_mismatch error to automation_logs when mismatch detected");
});