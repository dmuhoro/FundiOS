# 2026-09-11 — Sprint 06 closeout: Durable Automation + WhatsApp Outbound

## Command / Step

Green gate across the repo after the full Sprint 06 layer set.

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Targeted proof of the durable path:

```bash
npx vitest run convex/queue.test.ts __tests__/whatsapp/sender.test.ts
```

`processQueue` end-to-end tests inject a fake Graph API transport via
`setTransportForTests` (guarded to `NODE_ENV === "test"`) and set
`WHATSAPP_ACCESS_TOKEN` for the duration of the action, so a real HTTP client is
never hit.

## Observed Result

- Lint: 0 problems. Typecheck: 0 errors.
- Tests: **72 passed / 15 files / 0 todos**.
  - `convex/queue.test.ts` (6) — enqueue dedupe by idempotency key;
    `claimJob` pending→processing w/ attempt increment + stale-claim refusal;
    `finalizeJob` → dispatched + `whatsapp_sent` audit; `failJob`
    retrying→retrying→failed at 3-attempt cap + `whatsapp_retry` /
    `whatsapp_send_failed` audits; `processQueue` happy path (200 transport ⇒
    dispatched, 0 failed, job terminal) and failure path (500 transport ⇒
    retrying, `lastError: http_500`).
  - `__tests__/whatsapp/sender.test.ts` (5) — `not_configured` for missing
    token and missing phoneNumberId, correct Graph payload + `ok:true` via
    injected transport, `http_429`, `transport_error`.
  - Sprint 05 suite still green: `convex/isolation.test.ts`,
    `convex/inbound.test.ts`, `__tests__/whatsapp/convex-runtime.test.ts`,
    `src/lib/whatsapp/*` unit suites.
- Build: succeeds; all routes render dynamic.

## Decisions locked in this sprint

- **Check-then-insert idempotency** (Convex 1.45 has no unique indexes) for
  `automationQueue` by idempotency key, mirroring `leads.createInbound` and
  `logAutomation`.
- **Exponential backoff** `min(2^n s, 5 min)`, hard cap `maxAttempts = 3` →
  `failed` + audit.
- **Fail-closed sender**: missing `WHATSAPP_ACCESS_TOKEN` or phoneNumberId
  returns `not_configured` and the job retries rather than silently dropping.
- **`api.*` cron references** required by the Convex cron runtime (direct
  imports fail push).

## Verification that enforcement sits at the real boundary

The sender is the only place that issues the outbound HTTP call; `processQueue`
is the only caller; the webhook and reminder sweep reach it exclusively through
`enqueueJob` with tenant-scoped, idempotency-keyed jobs. Same-tenant claim
refusal, cap-to-failed, and audit rows are asserted by tests rather than implied.