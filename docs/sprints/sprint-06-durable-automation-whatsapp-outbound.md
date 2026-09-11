# Sprint 06 — Durable Automation + WhatsApp Outbound

**Status:** COMPLETE
**Dates:** 2026-09-11
**Docs:** ADR-002 · decisions D7 · `docs/evidence/sprint-06/closeout.md`

## Goal

Make the notification path durable and observable: replace the in-memory queue
by replacing the webhook's synchronous reply with an idempotency-keyed job on a
tenant-scoped Convex table, dispatch jobs through a real Graph API sender on a
5-second cron, and schedule the customer reminder sweep daily — with every
terminal state audited to `automation_logs`.

## Build order delivered

1. **`automationQueue` schema** — `convex/schema.ts` adds the table with
   `status` (pending/processing/retrying/dispatched/failed),
   `attemptCount`, `maxAttempts`, `nextAttemptAt`, `idempotencyKey`,
   `lastError`; indexes `by_tenant`, `by_idempotency`, `by_due
   ([status, nextAttemptAt])`.
2. **`convex/lib/jobs.ts`** — `enqueueJob` (check-then-insert dedupe +
   `queue_enqueued` audit) and `backoffMs` (2^n seconds, 5-minute cap).
3. **`convex/queue.ts`** — `enqueue`, `dueJobs` (pending then retrying in one
   batch), `claimJob` (pending/retrying → processing, increments attempts,
   refuses stale claims), `finalizeJob` (dispatched + `whatsapp_sent` audit),
   `failJob` (retrying with backoff, `failed` at cap + audits), and the
   `processQueue` action which validates each payload with zod, sends via the
   sender, and finalizes or fails — returning `{scanned, dispatched, failed}`.
4. **`convex/lib/whatsappSender.ts`** — Meta Graph API text send to
   `{WHATSAPP_BASE_URL}/{phoneNumberId}/messages`, injectable `Transport`
   (test-only setter guarded by `NODE_ENV === "test"`), fail-closed
   `not_configured` when creds are absent, `http_<status>`/`transport_error`
   error codes.
5. **`convex/crons.ts`** — `whatsappDispatcher` (every 5s → `processQueue`) +
   `serviceReminderSweep` (0 8 * * * → `fireDueReminders`), both through
   `api.*` references (direct function imports get instrumented and fail
   `npx convex push` — not a `functionReference`).
6. **`convex/reminders.ts`** — `fireDueReminders`: per tenant, joins
   services → customers → vehicles, selects services that are due
   (`nextServiceAt` ≤ now + `REMINDER_WINDOW_DAYS`), opted in (`waOptIn`), and
   not already reminded; enqueues `whatsapp_reminder` (key
   `reminder|<tenant>|<service>`), patches `reminderSent`.
7. **Webhook wiring** — `convex/whatsapp.ts` now enqueues the personalized
   `whatsapp_outbound` auto-reply immediately on inbound
   (key `whatsapp_reply|<tenant>|<messageId>`); the parser gained `profileName`
   so the greeting is personalized; `buildLeadAutoReply` / `buildFollowUpReminder`
   are imported from `src/lib/whatsapp/templates.ts` (single source of truth;
   the duplicated copy in `convex/lib/whatsapp.ts` was removed).

## Proof

- `convex/queue.test.ts` — 6 tests: idempotent dedupe; claim
  transition/attempt-count; finalize + `whatsapp_sent` audit; retry→retry→failed
  at cap + audits; `processQueue` end-to-end happy path (injected 200 transport
  → `dispatched`, 0 failed) and failure path (injected 500 → `retrying` with
  `lastError: http_500`).
- `__tests__/whatsapp/sender.test.ts` — 5 tests: `not_configured` (no token,
  no phoneNumberId), correct Graph payload via injected transport, `http_429`,
  `transport_error`.
- Full gate: lint 0 problems · typecheck 0 errors · **72 passed / 15 files /
  0 todos** · build succeeds.

## Boundary notes

- WhatsApp + M-Pesa credentials are not yet set on the deployment, so outbound
  send is fail-closed (`not_configured`); jobs retry until creds are set. This is
  the intended default — not a misconfiguration error.
- `processQueue` requires a fifth cron arg `{}` because typed `interval()`/`cron()`
  functions declare arguments.