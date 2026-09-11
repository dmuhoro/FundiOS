# Sprint 04 — Convex Pivot Foundation

**Status:** COMPLETE
**Dates:** 2026-09-11
**Docs:** ADR-002 · decisions D7 · `docs/runbooks/deployment.md` (Convex full-stack hosting, no Vercel)

## Goal

Replace Supabase (Postgres + Supabase Auth + RLS) with Convex as the backend
and full-stack hosting target, per ADR-002 / D7, without degrading the
tenant-isolation guarantees that Sprint 01 proved via SQL RLS.

## Scope

- Convex data model translated from `supabase/migrations/0001_initial_schema.sql`
- Password auth (`@convex-dev/auth`) wired via `convex/http.ts`
- Tenant enforcement at the **function boundary** (no RLS on Convex tables):
  `requireGarage`, `requireMember`, `requireActiveMemberOf`,
  `requireSuperAdmin`, `requireTenantDocument`
- Automated isolation proof that replaces the Sprint 01 RLS suite
- Idempotent automation audit logging (Convex 1.45 has no unique indexes →
  check-then-insert on `automationLogs.by_idempotency`)

## Build order delivered

1. `convex/schema.ts` — tenants, members, customers, vehicles, services,
   leads, automationLogs, campaigns + Convex Auth tables (`authTables()`)
2. `convex/auth.config.ts` — e-mail domain → decimal site URL
3. `convex/auth.ts` / `convex/http.ts` — Password provider, HTTP routes
4. `convex/lib/authorization.ts` — boundary enforcement + typed error codes
   (`UNAUTHENTICATED` / `FORBIDDEN` / `TENANT_SCOPE` / `NOT_FOUND`)
5. `convex/lib/automation.ts` — `sha256Hex` + check-then-insert `logAutomation`
6. Domain functions — `tenants`, `members`, `customers`, `vehicles`,
   `services`, `leads` (capture + dedupe + convert)
7. `convex/isolation.test.ts` — 7-test boundary proof via `convex-test`

## Verification

Full green across the repo: lint 0 problems · typecheck 0 errors · **55 tests
passing (11 files, 0 todos)** · production build succeeds.

Isolation suite (`convex/isolation.test.ts`): 7 passing, covering anonymous
denial, per-garage CRUD scoping, cross-tenant denial, lead dedupe within a
tenant, deactivated-member denial, integer minor-unit money (no float drift),
and scoped + idempotent automation audit.

## Notes / deviations

- Supabase deps and API routes remain in `package.json` / `src/app/api`
  (Sprint 03 fail-closed routes) until Sprint 05 removes the wiring.
- `WHATSAPP_*` / `MPESA_*` env values are not yet present anywhere
  (`WHATSAPP_ACCESS_TOKEN`, `MPESA_CONSUMER_KEY`, `MPESA_CONSUMER_SECRET` are
  EMPTY in `.env.local`); needed at Sprint 06.
- JWT signing keys (`JWT_PRIVATE_KEY` / `JWKS`) are deferred to Sprint 05 when
  the real login UI arrives — tests use `convexTest.withIdentity`.