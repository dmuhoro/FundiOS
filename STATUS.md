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

### Fully working (verified)
- Migration + seed apply cleanly to Postgres (dry-run against throwaway DB)
- RLS read/write/anonymous isolation proven end-to-end
- Scaffold builds, lints, typechecks

### Stubbed / next (in build order — largest/highest-value first)
1. [ ] **F1** — Live Supabase project: auth flow + real `requireGarage()` usage in dashboard layout + RBAC end-to-end. BLOCKED on a live Supabase project (Daniel creates project + provides URL/keys).
2. [ ] **F3/F4/F5** — CRM: customer/vehicle/service CRUD routes (`src/app/api/...` + `src/lib/validations/`) and pages.
3. [ ] **F2-b** — Auto-generate `src/types/database.ts` from the live project (`npm run db:types`).
4. [ ] **F6** — WhatsApp webhook implementation: signature verification (constant-time), inbound → lead, auto-reply, outbound queue (extract from Kay's AFTER P0 fixes proven by the scaffolded tests).
5. [ ] **F7** — Reminder Edge Function (daily cron).
6. [ ] **F8** — Dashboard KPIs + real-time activity feed.
7. [ ] **F9** — Super admin tenant view + onboard form.
8. [ ] **F10** — GMB checklist UI persisted in `tenants.metadata`.
9. [ ] **P0 extraction gate** — implement the two P0 test suites against the extracted queue + encryption modules; they must pass before any Kay's module ships here.
10. [ ] Live credential unblocks (WhatsApp tokens, M-Pesa keys) — Daniel-side.

## Daniel's action items
- [ ] Create the Supabase project (or local `supabase start`) for FundiOS; provide `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` (+ service role key server-side) so F1/F2-b can land.
- [ ] After that, provide WhatsApp Business Cloud credentials (`WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_VERIFY_TOKEN`, `WHATSAPP_APP_SECRET`) to unblock F6 live verification.
- [ ] M-Pesa Daraja keys for the pilot (`MPESA_CONSUMER_KEY`, `MPESA_CONSUMER_SECRET`, etc.) — needed when service payments go live (deferred from scaffolding).

## Last updated
2026-09-10 — Sprint 01 complete: scaffold, schema + verified RLS, seed, CI, green build/test/lint/typecheck. First commit of the repository; pushed to GitHub.