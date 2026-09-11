# CHANGELOG

All notable changes are documented here. Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versioning follows [SemVer](https://semver.org/). Each entry cites the sprint doc for evidence.

## [Unreleased]

### Sprint 07 — Live product + operator console COMPLETE (2026-09-11)
**The product is public: a branded FundiOS landing page served at the live Convex-site root (fixing `no matching routes found`), a dashboard that is a real operator console (8 KPIs + live activity feed, super admin onboarding/registry, GMB launch checklist), and Brianna'sOS connector v1 — a tested, contract-driven, fail-closed socket awaiting live credentials. Full-suite green (110/110, 0 todos), deployed, tagged v0.6.1.**

Added:
- `convex/lib/landing.ts` (self-contained FundiOS HTML — value prop, capabilities, status, contact; doc links to GitHub blob URLs) + `convex/site.ts` (`serveLanding` HTTP action at `/`) + route in `convex/http.ts`. Live-verified: GET / → 200 `FundiOS — Marketing Operations OS for Automobile Garages`; webhook GET → 403 (intentional, not 404).
- `convex/dashboard.ts`: `overview` (leads, 7d leads, customers + opt-in %, vehicles, open/completed services, reminders sent, whatsapp sent, queue backlog/failed) and `activityFeed` (merged, time-descending, masked phones). `src/app/(dashboard)/overview/page.tsx` rewritten: 8 KPI cards + live feed.
- `convex/tenants.ts`: `onboardTenant` (atomic tenant + operator creation; slug validated/uniqueness-checked; refuses slip/quickstop magic slugs; member-not-elsewhere-owned) + `adminSummary` (tenant registry + aggregate counters). `src/app/(dashboard)/admin/page.tsx`: onboarding form + registry table; `dashboard-nav.tsx` Admin link gated to `super_admin`.
- `convex/gmb.ts` + `gmbChecklists` in `convex/schema.ts`: tenant-scoped checklist state. `src/lib/constants.ts` `GMB_CHECKLIST_ITEMS` (9 stable items). `src/app/(dashboard)/gmb/page.tsx`: saved-progress UI + per-item notes.
- `src/lib/briannaos/{contract,signature,client}.ts` + `docs/briannaos-connector.md`: contract v1 — 5 outbound / 4 inbound event catalogs, zod envelopes, disjoint names, HMAC-SHA256 sign + constant-time verify, injected-transport client, fail-closed `not_configured`, `invalid_payload`/`http_<status>`/`transport_error` codes, `parseInboundEvent` throws on malformed envelopes. Config keys `BRIANNAS_OS_ENDPOINT` / `BRIANNAS_OS_WEBHOOK_SECRET` (names only) in `.env.local.example`.
- `docs/evidence/sprint-07/fundios-live-site-verified.md` (PASS).

Verified:
- `npm run lint` — 0 problems · `npm run typecheck` — 0 errors · `npm test` — **110 passed / 21 files / 0 todos** · `npm run build` — succeeds.
- `convex/dashboard.test.ts` (5) · `convex/tenants.test.ts` (8: atomic onboarding, slug dup/magic reject, roles — ordering etc.) · `convex/gmb.test.ts` (5: tenant isolation, unknown-key rejection, allowed-key gate) · `__tests__/site/landing-runtime.test.ts` (4) · `__tests__/briannaos/{contract,client}.test.ts` (16: disjoint catalogs, schema accept/reject, fail-closed unconfigured, signed URL+header, http/transport/invalid mapping, tamper rejection, envelope-throw).
- Live site redeployed via `npx convex dev --once`; GET / verified 200.

### Sprint 06 — Durable automation + WhatsApp outbound COMPLETE (2026-09-11)
**First fully durable notification path: every WhatsApp send is a tenant-scoped, idempotency-keyed job on `automationQueue`, dispatched by a 5s cron through an injectable-transport sender with exponential backoff and a hard 3-attempt cap; reminder sweep schedules template messages for due, opted-in customers. Every terminal state is audited. Full-suite green (72/72, 0 todos).**

Added:
- `convex/schema.ts`: `automationQueue` table — `status` (pending/processing/retrying/dispatched/failed), `attemptCount`, `maxAttempts`, `nextAttemptAt`, `idempotencyKey`, `lastError`; indexes `by_tenant`, `by_idempotency`, `by_due` (`[status, nextAttemptAt]`).
- `convex/lib/jobs.ts`: `enqueueJob` (check-then-insert dedupe on idempotency key + `queue_enqueued` audit) and `backoffMs` (2^n seconds, 5-minute cap).
- `convex/queue.ts`: `enqueue`, `dueJobs` (pending then retrying within batch), `claimJob` (pending/retrying → processing, increments attempts, refuses stale claims), `finalizeJob` (dispatched + `whatsapp_sent` audit), `failJob` (retrying w/ backoff < max, `failed` at cap + audit, explicit `whatsapp_retry`/`whatsapp_send_failed`), `processQueue` action (zod-validated payload, end-to-end dispatch via the sender, returns `{scanned, dispatched, failed}`).
- `convex/lib/whatsappSender.ts`: Meta Graph API text send (`WHATSAPP_BASE_URL`/`phoneNumberId/messages`), injectable `Transport`, fail-closed `not_configured` when creds absent, `http_<status>` / `transport_error` codes, `setTransportForTests` (guarded to `NODE_ENV==="test"`).
- `convex/crons.ts`: `whatsappDispatcher` (every 5s → `processQueue`) + `serviceReminderSweep` (0 8 * * * → `fireDueReminders`), both via `api.*` references.
- `convex/reminders.ts`: `fireDueReminders` — joins services→customers→vehicles per tenant, selects due (`nextServiceAt` ≤ now + `REMINDER_WINDOW_DAYS`) + `waOptIn` + not already reminded, enqueues `whatsapp_reminder` (idempotency key `reminder|<tenant>|<service>`), patches `reminderSent`. Returns `{enqueued}`.
- `convex/whatsapp.ts`: inbound webhook now enqueues `whatsapp_outbound` auto-reply (key `whatsapp_reply|<tenant>|<messageId>`); `convex/lib/whatsapp.ts` parser gains `profileName` (contact name used in the greeting); `buildLeadAutoReply`/`buildFollowUpReminder` imported from `@/lib/whatsapp/templates`.

Changed:
- `eslint.config.mjs`: `@typescript-eslint/no-unused-vars` relaxed for `^_`-prefixed args (test doubles).
- `convex/isolation.test.ts`: explicit `reduce<number>` (strict inference).

Removed:
- Inline `buildLeadAutoReply` copy from `convex/lib/whatsapp.ts` (single source of truth in `src/lib/whatsapp/templates.ts`).

Verified:
- `npm run lint` — 0 problems · `npm run typecheck` — 0 errors · `npm test` — **72 passed / 15 files / 0 todos** · `npm run build` — succeeds.
- `convex/queue.test.ts` (6): idempotent dedupe; claim state machine; finalize + `whatsapp_sent` audit; retry→cap→failed + audit; `processQueue` end-to-end happy path (fake transport → dispatched) and failure path (500 → retrying w/ `lastError`).
- `__tests__/whatsapp/sender.test.ts` (5): `not_configured` (token + phoneNumberId), correct Graph payload via injected transport, `http_429`, `transport_error`.

### Sprint 05 — Live Auth + Supabase removal COMPLETE (2026-09-11)
**Convex Auth wired end-to-end (password provider + JWT keys, middleware gating, login/signup UI, dashboard shell); WhatsApp webhook now a Convex HTTP action; all Supabase code removed from the build. Full-suite green (61/61, 0 todos).**

Added:
- `JWT_PRIVATE_KEY` + `JWKS` generated and set on Convex dev deployment.
- `src/middleware.ts`: `convexAuthNextjsMiddleware` gates all non-public routes; public `/login`, `/sign-up`, `/api/auth(.*)`.
- `src/app/providers.tsx`: `ConvexAuthNextjsProvider` wrapping the app.
- `src/app/(auth)/login/page.tsx`, `src/app/(auth)/sign-up/page.tsx`: email+password auth forms with error handling.
- `src/app/(auth)/layout.tsx`: centered auth layout.
- `src/components/dashboard-nav.tsx`: sign-out button.
- `src/app/(dashboard)/layout.tsx`: dashboard shell with nav.
- `src/app/(dashboard)/overview/page.tsx`: displays membership via `useQuery(api.members.myProfile)`.
- `src/lib/convex.ts`: re-exports `api` from `convex/_generated` for clean client imports.
- `convex/whatsapp.ts` + `convex/lib/whatsapp.ts` + `convex/lib/phone.ts`: WhatsApp HTTP action — GET verify + POST inbound. Signature verified via WebCrypto HMAC-SHA256 (constant-time compare); canonical zod envelope parser (`parseWhatsAppEnvelope`); fail-closed codes `invalid_signature` / `malformed_json` / `unknown_wa_number`; `buildLeadAutoReply` (EN/SW).
- `convex/schema.ts`: `by_wa_phone` index on `tenants`; `convex/tenants.ts` `getByWaPhoneId`; `convex/leads.ts` `getByPhone` + `createInbound` (dedupe on normalized phone within tenant, audited with idempotency key).
- `convex/inbound.test.ts` (cross-tenant independence + idempotent re-delivery + wa-phone resolution) and `__tests__/whatsapp/convex-runtime.test.ts` (boundary proof for the exact Convex-runtime lib).
- `src/app/not-found.tsx` (dynamic) + `force-dynamic` on `/` and root layout (Provider tree cannot be statically prerendered under Next 16/Turbopack; auth-reliant routes are session-dependent by nature).

Changed:
- `src/app/layout.tsx`: wraps children with `<Providers>` (Convex Auth).
- HTTP routes moved from string form to `http.route({ path, method, handler })` (Convex 1.45 `httpRouter` object API).
- `STATUS.md`: Sprint 05 progress; F1 + webhook layer + Supabase removal done.
- `.env.local.example`: legacy Supabase section removed; `CONVEX_SITE_URL` documented as built-in.

Removed:
- **Supabase entirely**: deps `@supabase/ssr` + `@supabase/supabase-js` uninstalled; `src/lib/supabase/*`, `src/proxy.ts`, `src/lib/auth/permissions.server.ts`, `src/app/api/{leads,customers,vehicles,services}/route.ts`, `src/types/database.ts`, `src/app/api/whatsapp/webhook/route.ts`, `src/lib/whatsapp/garage-lookup.ts`, `db:*` npm scripts. `AGENTS.md` command/conventions updated to Convex-only. Pure `src/lib/whatsapp/{signature,webhook,templates}.ts` retained (tested) until the queue layer consumes them.

Verified:
- `npm run lint` — 0 problems · `npm run typecheck` — 0 errors · `npm test` — **61 passed / 13 files / 0 todos** · `npm run build` — succeeds (all routes dynamic).

### Sprint 04 — Convex Pivot Foundation COMPLETE (2026-09-11)
**Backend replaced at the architecture level: Supabase → Convex (ADR-002 / D7); isolation proof moved from SQL-RLS to the Convex function boundary. Full-suite green (55/55, 0 todos).**

Added:
- `convex/schema.ts`: tenants, members, customers, vehicles, services, leads, automationLogs, campaigns + Convex Auth tables. **No unique indexes** (Convex 1.45 removed them) → idempotency via check-then-insert.
- `convex/auth.ts` / `convex/auth.config.ts` / `convex/http.ts`: Password provider (`@convex-dev/auth`) with HTTP routes.
- `convex/lib/authorization.ts`: boundary enforcement `requireMember` / `requireGarage` / `requireActiveMemberOf` / `requireSuperAdmin` / `requireTenantDocument`; typed error payloads (`UNAUTHENTICATED` / `FORBIDDEN` / `TENANT_SCOPE` / `NOT_FOUND`).
- `convex/lib/automation.ts`: `sha256Hex` + idempotent `logAutomation`.
- Domain functions: `convex/{tenants,members,customers,vehicles,services,leads}.ts`.
- `convex/isolation.test.ts`: 7-test boundary proof (`convex-test`): anonymous denied, garage A/B scoping, cross-tenant denial, lead dedupe, deactivated member, integer minor-unit money, scoped+idempotent audit.
- `docs/sprints/sprint-04-convex-foundation.md`, `docs/evidence/sprint-04/closeout.md`.

Changed:
- `__tests__/rls/tenant-isolation.test.ts` → `__tests__/rls/tenant-isolation.legacy.ts` (doc-only; Sprint 01 RLS proof superseded by ADR-002 — no `it.todo` remains).
- `eslint.config.mjs`: ignore `convex/_generated/**` + `convex/.convex-tmp/**`.
- `.gitignore`: ignore `convex/.convex-tmp/`.
- `STATUS.md`: Sprint 04 complete; CLI link done; next = F1 (live auth).

Fixed:
- `requireActiveMemberOf` unwrapping (returned `{ member }` from `requireGarage`), anonymous must throw `UNAUTHENTICATED` not `FORBIDDEN`, `requireTenantDocument` generic, test null-safety + `tenantId`/`tenant` naming. All were typechecks; suite now 0 lint warnings, 0 type errors.

Verified:
- `npm run lint` — 0 problems · `npm run typecheck` — 0 errors · `npm test` — 55 passed / 11 files / 0 todos · `npm run build` — succeeds. Evidence: `docs/evidence/sprint-04/closeout.md`.

### Sprint 04 prep — Convex pivot (2026-09-11)
**Backend replaced at the architecture level: Supabase → Convex (ADR-002 / D7). Full-stack hosting moves to Convex Deployment — no Vercel. SDK foundation begins once the CLI project link is in place.**

Added:
- **ADR-002** (`docs/adr/ADR-002-convex-backend.md`): Supabase → Convex decision, consequences for the tenant-isolation boundary (SQL RLS → function-enforced authorization), auth model, data-model migration; ADR-001 marked Superseded for the Convex path.
- **Decision D7** (`docs/decisions.md`): records the pivot, PRD §4 deviation, isolation-proof requirement.

Installed:
- `convex@1.45.0`, `@convex-dev/auth@0.0.95`, `@auth/core@0.41.3`, `convex-test@0.0.57` (dev), `concurrently` (dev).

Changed:
- `package.json` scripts: `dev:convex`, `convex:codegen`, `convex:deploy`.
- `.env.local.example`: `NEXT_PUBLIC_CONVEX_URL`, `CONVEX_SITE_URL`, `ADMIN_KEY`, `CONVEX_CLI_ACCESS_TOKEN` (+ legacy Supabase vars marked for removal in Sprint 05).
- `docs/runbooks/deployment.md`: Convex full-stack deployment path; Vercel instructions retired; env via `npx convex env set`.
- `STATUS.md`: Sprint 04 plan in build order; Daniel action items for the one-time CLI link.

Fixed:
- Pre-existing lint warning (`unused create param` in `__tests__/whatsapp/cross-tenant-queue.test.ts`) — cleared to 0 problems.

Verified:
- `npm run lint` — 0 problems · `npm run typecheck` — 0 errors · `npm test` — 48 passing, 4 RLS todos (deferred) · `npm run build` — succeeds.

### Sprint 03 — 80/20 Execution: P0 Gate + Core Domain (2026-09-11)
**The critical execution path from "scaffold" to "real module logic with passing gate tests": the two P0 extraction-gate suites now pass on the real module paths, the WhatsApp webhook is signature-verified and fail-closed, and the CRM domain cores are pure, tested, and wired to fail-closed API routes.**

Added:
- **Encryption** (`src/lib/encryption/encryption.ts`): AES-256-GCM, scrypt-derived per-garage keys, key rotation. Unknown key version throws — silent decryption failures eliminated (P0 Bug 2).
- **Queue** (`src/lib/queue/notification-queue.ts`): `enqueueJob`/`processGarageQueue` require explicit garage scope; `queue_tenant_mismatch_rejected` audit entry on scope mismatch; idempotency keys; in-memory store for pilot/tests (P0 Bug 1).
- **P0 gate tests** passing on real paths: `__tests__/encryption/key-rotation.test.ts` (5), `__tests__/whatsapp/cross-tenant-queue.test.ts` (6).
- **WhatsApp core**: `signature.ts` (constant-time HMAC-SHA256), `webhook.ts` (Zod-envelope → normalized inbound message), `templates.ts` (EN/SW lead auto-reply, welcome-back, follow-up reminder), `garage-lookup.ts` (`tenants.wa_phone_id` resolver with `db_unavailable`).
- **Webhook POST** (`src/app/api/whatsapp/webhook/route.ts`): signature verify → parse → resolve garage. DB absent → 503 `db_unavailable`; durable queue absent → 503 `queue_not_ready`. No silent drops.
- **Domain cores**: `money.ts` (integer minor-unit arithmetic), `phone.ts` (+254 normalization), `validations/{lead,customer,vehicle,service}.ts` (Zod), `crm/leads.ts` (capture/convert/flow guards), `crm/services.ts` (deterministic summaries), `reminders/select-due.ts` (due-window candidates).
- **Fail-closed routes**: `src/app/api/{leads,customers,vehicles,services}/route.ts` — GET list + POST with Zod parse, idempotency via `automation_logs`, audit write, explicit 503/401/403.
- **Colocated tests** (25): money, phone, leads, services, select-due.

Verified:
- `npm run lint` — 0 errors · `npm run typecheck` — 0 errors
- `npm test` — 48 passing, 4 RLS todos (deferred) · `npm run build` — succeeds
- Evidence: `docs/evidence/sprint-03/closeout.md`; sprint record: `docs/sprints/sprint-03-8020-execution.md`.
**The engineering context infrastructure that lets any agent/session boot with a coherent model of the codebase.**

Added:
- **`.ai/` context set**: VERSION 1.0.0; 3 agent contracts (`architect-agent`, `auditor-agent`, `builder-agent`); 13 context briefs (`00_index` → `12_evidence`) mirroring `docs/`.
- **`docs/adr/`**: ADR-001 (RLS recursion fix via SECURITY DEFINER helper `public.current_garage_id()`) + README with conventions.
- **`docs/engineering/CONSTITUTION.md`**: moved from repo root (ecosystem convention), references updated in `AGENTS.md`/`README.md`.
- **Canonical docs**: `architecture.md`, `code-standards.md`, `db-contracts.md`, `decisions.md` (D1–D6), `security.md`, `security-subsystems.md`, `release-readiness.md`, `sprint-cross-reference.md`.
- **`docs/runbooks/`**: `deployment.md`, `supabase-local.md` (incl. RLS proof procedure), `whatsapp-webhook.md`.
- **`docs/releases/` + `docs/evidence/` index READMEs**; evidence conventions documented.

Verified (no runtime code changed):
- `npm run lint` — 0 problems · `npm run typecheck` — 0 errors
- `npm test` — green · `npm run build` — succeeds

### Sprint 01 — Foundation & Scaffold (2026-09-10)
**Next.js 16.3.4 (App Router) + TypeScript strict + Tailwind v4 + shadcn/ui scaffold.**

Added:
- **Scaffold**: Next.js 16 App Router + TS strict, Tailwind v4 + shadcn/ui (15 components), `src/` layout with `(auth)`, `(dashboard)`, `(admin)`, `api/health`, `api/whatsapp/webhook`.
- **Dependencies**: Supabase (client + SSR), TanStack Query v5, Zustand, Zod, date-fns, clsx + tailwind-merge, lucide-react, CVA, Radix primitives, Sentry, Recharts; dev: Vitest + Testing Library + jsdom.
- **Auth / tenant routing**: `src/lib/supabase/{client,server,middleware}.ts`, `src/proxy.ts` (session gate on `/dashboard` + `/admin`), `src/lib/auth/permissions.server.ts` (`requireGarage`, `requireSuperAdmin`).
- **Logging / constants**: structured JSON logger with PII redaction; domain constants (lead/service statuses, KES formatter, reminder window).
- **Database schema** `supabase/migrations/0001_initial_schema.sql`: 8 enums, 8 tables, 6 triggers, RLS on all 7 tenant tables. RLS verified against Postgres 16 (read / write / anonymous isolation proven). Fixed RLS recursion bug in the PRD pattern via `public.current_garage_id()` SECURITY DEFINER helper (see `docs/evidence/sprint-01/`).
- **Seed** `supabase/seed.sql`: Quickstop Garage (1 tenant, 1 owner, 15 customers, 20 vehicles, 30 services, 8 leads) — dry-run clean.
- **Types**: `src/types/database.ts` typed stub mirroring the migration (swap-in via `npm run db:types`); shared domain types in `src/types/index.ts`.
- **Webhook stubs**: WhatsApp GET verify + POST awaiting F6.
- **Testing**: vitest + jsdom setup; P0 test scaffolds (cross-tenant queue isolation, key rotation) + RLS isolation scaffold documenting the completed manual verification.
- **CI**: GitHub Actions — lint → typecheck → test → build on push/PR to main.
- **Tooling scripts**: `test`, `test:watch`, `typecheck`, `db:migrate`, `db:types`, `db:reset`.
- **Governance docs**: `docs/PRD.md` (source of truth + RAID log), `CONSTITUTION.md`, `AGENTS.md`, `STATUS.md`, this changelog, `.env.local.example`.

Fixed:
- PRD RLS pattern infinite recursion (`users` policy self-reference) — replaced with SECURITY DEFINER helper; proven after fix.
- `@types/node` pinned `^20` conflicting with vitest 5 peer dep — bumped to `^22`.
- Seed enum mismatches against migration enums (`bank` → `card`, `booked` → `converted`, `gmb` → `google`).
- Next.js 16 deprecations handled so build is warning-free (`middleware` → `proxy` via official codemod; Edge runtime on `/api/health` removed).

Verified:
- `npm run lint` — 0 problems
- `npm run typecheck` — 0 errors
- `npm test` — green (3 scaffolds deliberately skipped / 9 todos)
- `npm run build` — success, warning-free
- Migration + seed dry-run — clean on Postgres 16 (throwaway DB)

Next up (F1+): live Supabase auth, CRM CRUD, WhatsApp capture — see `STATUS.md`.