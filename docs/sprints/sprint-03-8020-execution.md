# Sprint 03 — 80/20 Execution: P0 Gate + Core Domain
**Date:** 2026-09-11
**Objective:** Execute the previously-scoped 80/20 compressed engineering directive: P0 extraction gate (queue + encryption), WhatsApp webhook core, CRM + reminder domain cores, and fail-closed API wiring — all tested, green, committed individually, documented, and pushed to GitHub.

## What landed (layer-by-layer)

### Layer 1 — Key-versioned encryption (P0 Bug 2 gate)
| File | Purpose |
|---|---|
| `src/lib/encryption/encryption.ts` | AES-256-GCM, scrypt-derived keys, per-garage in-memory key store, rotation. Unknown key version throws `UnknownKeyVersionError` — never silently fails. |
| `__tests__/encryption/key-rotation.test.ts` | 5 tests: v1/v2 round-trip, cross-garage isolation, unknown version rejection. |

### Layer 2 — Tenant-scoped queue (P0 Bug 1 gate)
| File | Purpose |
|---|---|
| `src/lib/queue/notification-queue.ts` | `enqueueJob` requires `garageId` (throws `QueueScopeError`); `processGarageQueue` enforces scope as defense-in-depth; `createMemoryQueueStore` for pilot + tests. |
| `__tests__/whatsapp/cross-tenant-queue.test.ts` | 6 tests: scope rejection, mismatch audit logging, idempotency, scoped fetch isolation. |

### Layer 3 — WhatsApp core (fail-closed)
| File | Purpose |
|---|---|
| `src/lib/whatsapp/signature.ts` | `verifySignature` via `crypto.timingSafeEqual`; `signPayload` for test fixtures. |
| `src/lib/whatsapp/webhook.ts` | Zod-parsed Meta envelope; `parseWebhook` → normalized `InboundMessage` or `no_message` / `malformed_envelope`. |
| `src/lib/whatsapp/templates.ts` | `buildLeadAutoReply`, `buildWelcomeBackReply`, `buildFollowUpReminder` — EN/SW variants. |
| `src/lib/whatsapp/garage-lookup.ts` | `resolveGarageByPhoneNumberId` → queries `tenants.wa_phone_id`; returns `db_unavailable` when not configured. |
| `src/lib/db-guard.ts` | `isDbConfigured()` — env-var presence check (used by all fail-closed API routes). |
| `src/app/api/whatsapp/webhook/route.ts` | POST fully wired: verify → parse → resolve. No DB → 503 `db_unavailable`. No queue table → 503 `queue_not_ready`. Never silently dropped. |
| Tests (3 files, 12 tests) | `signature.test.ts`, `webhook-parse.test.ts`, `templates.test.ts`. |

### Layer 4 — Domain cores (money, phone, validations, CRM, reminders)
| File | Purpose |
|---|---|
| `src/lib/money.ts` | `toMinorUnits` / `fromMinorUnits` / `sumMinorUnits` / `formatKES` — integer arithmetic, no float drift. |
| `src/lib/phone.ts` | `normalizePhone` (+254 normalization), `samePhone`, `isValidKenyanPhone`. |
| `src/lib/validations/lead.ts` | `createLeadSchema` — phone transform, lead source/status enums. |
| `src/lib/validations/customer.ts` | `createCustomerSchema` — phone transform, name min-length, optional email. |
| `src/lib/validations/vehicle.ts` | `createVehicleSchema` — year/odometer integer ranges. |
| `src/lib/validations/service.ts` | `createServiceSchema` — datetime validation, nullable money, status enum. |
| `src/lib/crm/leads.ts` | `planLeadCapture` (dedup decision), `canTransition` (status flow), `convertLead` (lead → customer, `already_converted` guard). |
| `src/lib/crm/services.ts` | `summarizeServices` — deterministic totals via minor units, status counts. |
| `src/lib/reminders/select-due.ts` | `selectReminderCandidates` — filters due within window, `wa_opt_in`, not yet sent; builds messages via templates. |
| Tests (5 files, 25 tests) | `money.test.ts`, `phone.test.ts`, `leads.test.ts`, `services.test.ts`, `select-due.test.ts`. |

### Layer 5 — Fail-closed CRM API routes
| File | Purpose |
|---|---|
| `src/app/api/leads/route.ts` | GET (list 50, RLS-scoped) + POST (Zod → idempotency → insert → audit). |
| `src/app/api/customers/route.ts` | Same pattern as leads. |
| `src/app/api/vehicles/route.ts` | Same pattern; `garage_id` from server context (not client body). |
| `src/app/api/services/route.ts` | Same pattern; nullable fields handled. |

All four routes: `isDbConfigured()` guard (503), auth check (401), garage lookup (403). Honest fail-closed; no silent drops.

## Green checks (post-sprint)
| Check | Result |
|---|---|
| `npm run lint` | 0 errors, 1 warning (unused var, fixed in post-sprint patch) |
| `npm run typecheck` | 0 errors |
| `npm test` | 48 passing, 4 todo (RLS isolation — deliberate, requires live DB) |
| `npm run build` | Success, warning-free |

## What remains (referenced in STATUS.md)
- F1: Live Supabase project (blocked on credentials)
- F2-b: Auto-generate `src/types/database.ts`
- F6 remaining: Queue table migration + DB-backed adapter
- F7: Reminder Edge Function scaffold
- F8/F9/F10: Dashboard, super admin, GMB UI

## Evidence
Full test output committed to `docs/evidence/sprint-03/closeout.md`.