# CHANGELOG

All notable changes are documented here. Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versioning follows [SemVer](https://semver.org/). Each entry cites the sprint doc for evidence.

## [Unreleased]

### Sprint 02 — Engineering Governance & Context Layer (2026-09-10) — docs-only
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