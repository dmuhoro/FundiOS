# STATUS — single source of truth

Read this first, every session. Update it at the end of every sprint before moving on.

## Mission
Take FundiOS from empty repo to a production-ready, end-to-end functioning
multi-tenant garage marketing OS within the 20-day pilot window.

## v1 / pilot target (defined scope — do NOT silently expand this)
- Multi-tenant foundation with verified RLS isolation
- Auth + RBAC (owner / mechanic / receptionist / super_admin)
- CRM — customers, vehicles, service history
- Lead capture & management incl. convert-to-customer
- WhatsApp Business Cloud API — signature-verified webhook, auto-reply, outbound queue
- Dashboard — 7 KPIs + real-time activity feed
- Service reminders (daily Edge Function)
- Super admin tenant view
- GMB optimisation checklist (manual ops task, UI only)
- CI green on every merge; core logic covered by tests

Explicitly OUT of pilot scope (PRD § 3): Meta Ads automation, agentic content,
broadcasts, fleet, insurance, referral tracking, M-Pesa STK at booking,
self-serve onboarding, marketing site, Stripe billing, native mobile app.

## Current state (as of last sprint update)

### Sprint 01 — "Foundation & Scaffold" COMPLETE (2026-09-10) — live skeleton
The repo is a working, building, tested scaffold. Every layer of the pilot
foundation is in place and verified where the environment allows:

- **Next.js 16.3.4 (App Router) + TypeScript strict + Tailwind v4 + shadcn/ui**
  (button, card, badge, input, label, select, dialog, dropdown-menu, table,
  tabs, toast, tooltip, separator, skeleton, avatar). `src/` layout with
  `(auth)/login`, `(dashboard)/*`, `(admin)/tenants`, `api/health`,
  `api/whatsapp/webhook`.
- **Auth/tenant routing surfacing**: `src/lib/supabase/{client,server,middleware}.ts`,
  `src/proxy.ts` (session gate for `/dashboard` + `/admin`, redirects to
  `/login`), `src/lib/auth/permissions.server.ts` with `requireGarage()` and
  `requireSuperAdmin()`.
- **Structured JSON logger with PII redaction** (`src/lib/logger.ts`);
  domain constants (`src/lib/constants.ts`).
- **Full DB schema** (`supabase/migrations/0001_initial_schema.sql`):
  8 enums, 8 tables (tenants, users, customers, vehicles, services, leads,
  automation_logs, campaigns), 6 `set_updated_at` triggers, RLS on all 7
  tenant tables. **RLS verified against live Postgres 16, not assumed** —
  seed two tenants + two users, non-superuser role, simulated JWT: garage A
  sees only its own rows, cross-tenant INSERT rejected, anonymous session
  sees zero rows. **RAID: the PRD's inline-subselect RLS pattern caused
  infinite recursion on `users`; fixed via `public.current_garage_id()`
  (SECURITY DEFINER).**
- **Seed data** (`supabase/seed.sql`): Quickstop Garage tenant, owner login,
  15 customers, 20 vehicles, 30 services across 6 months, 8 leads (dry-run
  clean on Postgres 16).
- **Typed Database stub** (`src/types/database.ts`) mirroring the migration —
  regenerable via `npm run db:types` (swap-in generated types).
- **Testing infra**: vitest + jsdom + Testing Library; P0 bug test scaffolds
  (cross-tenant queue isolation, key rotation) + RLS isolation test scaffold
  incorporating the completed manual proof. 3 files skipped / 9 todos by
  design — they become live when the queue/encryption modules are extracted.
- **API stubs**: `GET /api/health` (JSON ok), WhatsApp webhook GET verify +
  POST awaiting F6 implementation. Next.js 16 conventions applied (proxy,
  no Edge runtime) so the build is warning-free.
- **CI** (`.github/workflows/ci.yml`): lint → typecheck → test → build on
  every push/PR to main.
- **Green**: `npm run lint` 0 problems · `npm run typecheck` 0 errors ·
  `npm test` passes · `npm run build` succeeds warning-free.
- `.env.local.example` documents all secrets by name (nothing committed).

### Sprint 02 — "Engineering Governance & Context Layer" COMPLETE (2026-09-10) — docs-only
The engineering context infrastructure is now in place — this is what enables
any agent/session to boot with a coherent, honest model of the codebase:

- **`.ai/` context set** — VERSION 1.0.0; 3 agent contracts (architect, auditor,
  builder); 13 context briefs (00–12: index, architecture, system-map, domain-model,
  code-standards, db-contracts, decisions, release-readiness, security,
  security-subsystems, roadmap, workflow-rules, evidence). All are summaries +
  pointers to the canonical docs; never standalone truth.
- **`docs/adr/`** — ADR-001 (RLS recursion fix / SECURITY DEFINER helper);
  README with linking conventions.
- **`docs/engineering/CONSTITUTION.md`** — moved from repo root to match the
  ecosystem convention (`kays-wellness-centre`, `ShrinkMedia`, `TraderOS`).
- **Canonical docs**: `architecture.md`, `code-standards.md`, `db-contracts.md`,
  `decisions.md` (D1–D6), `security.md`, `security-subsystems.md`,
  `release-readiness.md`, `sprint-cross-reference.md`.
- **`docs/runbooks/`** — `deployment.md`, `supabase-local.md`, `whatsapp-webhook.md`.
- **`docs/releases/`** and **`docs/evidence/`** index READMEs.
- References updated: `AGENTS.md`, `README.md`. No runtime code changed.

### Sprint 03 — "80/20 Execution: P0 Gate + Core Domain" COMPLETE (2026-09-11) — domain modules + fail-closed wiring
The critical path was executed in six layers, each with isolated, passing tests
and individually committed to origin/main:

**Layer 1 — Key-versioned encryption (P0 gate proven)**
- `src/lib/encryption/encryption.ts` — AES-256-GCM with scrypt-derived keys,
  per-garage in-memory key store, key rotation. Unknown key version throws
  `UnknownKeyVersionError` (P0 Bug 2 — never silently fails).
- `__tests__/encryption/key-rotation.test.ts` — 5 tests green on the real
  decryption path: rotation preserves v1/v2 ciphertext, isolation by garage.

**Layer 2 — Tenant-scoped notification queue (P0 gate proven)**
- `src/lib/queue/notification-queue.ts` — `enqueueJob` requires `garageId`
  (throws `QueueScopeError` if missing); `processGarageQueue` enforces garage
  scope as defense-in-depth even if the store returns mismatched rows, recording
  `queue_tenant_mismatch_rejected` in the audit log. `createMemoryQueueStore`
  for tests and pilot operation.
- `__tests__/whatsapp/cross-tenant-queue.test.ts` — 6 tests green: scope
  rejection, mismatch audit, idempotency, scoped fetch isolation.

**Layer 3 — WhatsApp webhook core (fail-closed)**
- `src/lib/whatsapp/signature.ts` — constant-time HMAC-SHA256 verification via
  `crypto.timingSafeEqual`. `signPayload` for test fixtures.
- `src/lib/whatsapp/webhook.ts` — Zod-parsed Meta envelope; `parseWebhook`
  returns normalized `InboundMessage` or `{ok:false, code:"no_message"|"malformed_envelope"}`.
- `src/lib/whatsapp/templates.ts` — `buildLeadAutoReply`, `buildWelcomeBackReply`,
  `buildFollowUpReminder` with EN/SW language variants.
- `src/lib/whatsapp/garage-lookup.ts` — `resolveGarageByPhoneNumberId` queries
  `tenants.wa_phone_id`; returns `db_unavailable` when not configured.
- `src/lib/db-guard.ts` — `isDbConfigured()` (env-var presence check).
- `src/app/api/whatsapp/webhook/route.ts` — POST fully wired: signature verify
  → parse → resolve garage. Without DB configured → 503 `db_unavailable`
  (Meta retries, never silently dropped). Without durable queue (migration pending)
  → 503 `queue_not_ready` when garage resolves but queue table absent. Honest
  fail-closed on every rejection.
- Tests: `signature.test.ts` (4), `webhook-parse.test.ts` (4), `templates.test.ts` (4) — 12
  new tests green.

**Layer 4 — Domain cores (money, phone, validations, CRM, reminders)**
- `src/lib/money.ts` — `toMinorUnits` / `fromMinorUnits` / `sumMinorUnits` /
  `formatKES`. All aggregation uses integer minor units (no float drift).
- `src/lib/phone.ts` — `normalizePhone` (KE → +254), `samePhone`, `isValidKenyanPhone`.
- `src/lib/validations/{lead,customer,vehicle,service}.ts` — Zod schemas with
  phone normalization transform on create; validation catches bad input at the
  API boundary before it reaches the database.
- `src/lib/crm/leads.ts` — `planLeadCapture` (dedup decision), `canTransition`
  (lead status flow), `convertLead` (lead → customer with `already_converted` guard).
- `src/lib/crm/services.ts` — `summarizeServices` deterministic totals via
  minor-unit arithmetic; status counts.
- `src/lib/reminders/select-due.ts` — `selectReminderCandidates` filters
  services due within window, `wa_opt_in=true`, `reminder_sent=false`. Builds
  messages via `buildFollowUpReminder`.
- Colocated tests: `money.test.ts` (4), `phone.test.ts` (4), `leads.test.ts` (6),
  `services.test.ts` (3), `select-due.test.ts` (8) — 25 tests green.

**Layer 5 — Fail-closed CRM API routes**
- `src/app/api/{leads,customers,vehicles,services}/route.ts` — GET (list, limit 50,
  RLS-scoped) + POST (Zod parse → idempotency check via `automation_logs` →
  insert → audit log). All four routes: `isDbConfigured()` guard returns 503;
  session check returns 401; garage lookup from `users` table returns 403 if
  missing. Honest fail-closed; no silent drops.

**Layer 6 — Evidence + full green**
- Lint 0 errors, typecheck 0 errors, 48 tests passing, build succeeds.
- `docs/sprints/sprint-03-*.md` + `docs/evidence/sprint-03/` created.

### Fully working (verified)
- Migration + seed apply cleanly to Postgres (dry-run against throwaway DB)
- RLS read/write/anonymous isolation proven end-to-end
- P0 gate tests passing on real module paths (encryption + queue)
- WhatsApp signature verify, webhook parse, templates (EN/SW)
- Money arithmetic verified float-safe (0.1+0.2 = 0.3)
- CRM domain cores with colocated tests (leads capture/convert, service summaries, reminder candidates)
- Fail-closed API routes (leads, customers, vehicles, services) with idempotency
- Green: lint · typecheck · test (48 passing, 4 RLS todos) · build

### Sprint 04 — "Convex Pivot Foundation" COMPLETE (2026-09-11) — backend replaced, proof moved
Supabase → Convex at the architecture level (ADR-002 / D7); Convex full-stack hosting (no Vercel). Convex data model in `convex/schema.ts` (no unique indexes in Convex 1.45 → check-then-insert idempotency), Password auth via `convex/http.ts`, tenant enforcement at the **function boundary** (`requireGarage`/`requireActiveMemberOf`/`requireSuperAdmin`/`requireTenantDocument` in `convex/lib/authorization.ts`), automation audit in `convex/lib/automation.ts`. Domain functions for tenants/members/customers/vehicles/services/leads (capture + dedupe + convert). Isolation proof moved from SQL-RLS to `convex/isolation.test.ts` (7 tests via `convex-test`); Sprint 01 RLS harness retained as `__tests__/rls/tenant-isolation.legacy.ts` (doc-only).
- Error codes machine-readable: `UNAUTHENTICATED` · `FORBIDDEN` · `TENANT_SCOPE` · `NOT_FOUND`
- Green: lint 0 · typecheck 0 · test **55 passed / 11 files / 0 todos** · build succeeds
- One-time Convex CLI link DONE (`dmuhoro:fundios:dev` → confident-weasel-372)

### Stubbed / next (in build order — largest/highest-value first)
1. [x] **F1** — Live auth flow: Convex Auth email+password, session UI, `requireGarage()` on dashboard layout, RBAC end-to-end (replaces Supabase Auth; ADR-002). ✅ JWT keys set on Convex, middleware + root provider, login/signup UI, dashboard shell + overview with membership query.
2. [ ] **F6 (remaining)** — Convex-backed queue adapter + scheduler replacing the in-memory queue store (`src/lib/queue/notification-queue.ts`); webhook POST enqueue live.
3. [ ] **F7** — Reminder cron (`convex/scheduler.ts` / scheduled mutation) using `selectReminderCandidates` core; `automation_logs` idempotency on send.
4. [ ] **F8** — Dashboard KPIs + real-time activity feed (Convex reactive queries).
5. [ ] **F9** — Super admin tenant view + onboard form.
6. [ ] **F10** — GMB checklist UI persisted in `tenants.metadata`.
7. [x] **Sprint 05 (remainder)** — WhatsApp webhook as Convex HTTP action (live); Supabase deps + legacy API routes removed from the build; `dev:convex` canonical. (Open items: Sprint 05 docs/evidence finalization + push.)

## Sprint 05 — Live Auth + Supabase removal IN PROGRESS
Done this layer:
- JWT keys (`JWT_PRIVATE_KEY`/`JWKS`) generated and set on Convex dev deployment.
- `src/middleware.ts`: `convexAuthNextjsMiddleware` gates all non-public routes; public routes `/login`, `/sign-up`, `/api/auth(.*)`.
- `src/app/providers.tsx`: `ConvexAuthNextjsProvider` wrapping the app.
- `src/app/layout.tsx`: wraps children with `<Providers>`.
- Auth pages: `src/app/(auth)/login/page.tsx`, `src/app/(auth)/sign-up/page.tsx` (email+password, error handling, redirect to dashboard).
- `src/components/dashboard-nav.tsx`: sign-out button.
- `src/app/(dashboard)/layout.tsx`: dashboard shell with nav.
- `src/app/(dashboard)/overview/page.tsx`: displays membership via `useQuery(api.members.myProfile)`.
- `src/lib/convex.ts`: re-exports `api` from `convex/_generated` for clean `@/lib/convex` imports in client code.
- **WhatsApp webhook → Convex HTTP action** (`convex/http.ts` + `convex/whatsapp.ts`): GET verification + POST with WebCrypto HMAC-SHA256 signature (constant-time), fail-closed codes (`invalid_signature`/`malformed_json`/`unknown_wa_number`); tenant resolved via `tenants.getByWaPhoneId` (new `by_wa_phone` index); lead captured idempotently via `leads.createInbound`; legacy Next route + `garage-lookup.ts` deleted. Canonical parser/signature now live in `convex/lib/whatsapp.ts` (edge-safe), proven by `__tests__/whatsapp/convex-runtime.test.ts` + `convex/inbound.test.ts` (cross-tenant independence, re-delivery idempotency).
- **Supabase removed from the build**: deps (`@supabase/ssr`, `@supabase/supabase-js`) uninstalled; deleted `src/lib/supabase/*`, `src/proxy.ts`, `src/lib/auth/permissions.server.ts`, 4 legacy CRM API routes, `src/types/database.ts`, `db:*` scripts; `src/app/page.tsx` now force-dynamic + custom `src/app/not-found.tsx` (Provider tree can't be statically prerendered under Next 16/Turbopack); root layout marked `force-dynamic`.
- `.env.local.example` cleaned (no Supabase vars; `CONVEX_SITE_URL` documented as built-in).

Remaining in Sprint 05:
- Sprint 05 docs (`docs/sprints/`, `docs/evidence/`), STATUS/CHANGELOG finalization, commit layers, push to `main`.

## Daniel's action items
- [ ] Provide WhatsApp Business Cloud credentials (`WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_VERIFY_TOKEN`, `WHATSAPP_APP_SECRET`) when Sprint 06 (live WhatsApp) starts. **Note: current check — these are EMPTY in `.env.local`; they will be set via `npx convex env set` at Sprint 06.**
- [ ] Provide the **Brianna'sOS connecting-layer spec** (data moved, direction, auth, sync cadence, endpoints) — agent will define and build the whole connector; the business contract is the one open input.
- [ ] M-Pesa Daraja keys for the pilot (`MPESA_CONSUMER_KEY`, `MPESA_CONSUMER_SECRET`, etc.) — needed when service payments go live (deferred from scaffolding).

## Last updated
2026-09-11 — Sprint 05 in progress: auth wired; Supabase removed from the build; WhatsApp webhook live as Convex HTTP action (verified, fail-closed, idempotent inbound). Next: Sprint 05 docs/evidence + push, then Sprint 06 (queue/scheduler + live WhatsApp).