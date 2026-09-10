# Sprint 01 — Foundation & Scaffold

**Dates:** 2026-09-10 (single session)
**Scope:** Bring FundiOS from zero to a verified, building, tested skeleton —
the complete foundation for the 20-day pilot build.
**Status:** COMPLETE

## Directive received
Scaffold FundiOS as a **separate, independent repository** (its own GitHub
repo, its own docs/status). Build the complete skeleton today, then continue
feature work in later sessions. The scaffolding script supplied (fundios-setup.sh)
was the starting contract; this sprint executed it and hardened it.

## What constitutes "skeleton alive"
1. Next.js + TS + Tailwind + shadcn project running with the full target structure
2. All foundational libs present (Supabase client/server/middleware, auth helpers, logger, constants)
3. Database schema migration + seed that APPLY and are VERIFIED (RLS proven, not assumed)
4. Testing infra + P0 bug test scaffolds in place
5. CI green; lint / typecheck / test / build all pass
6. Docs: PRD, Constitution, AGENTS, STATUS, CHANGELOG, sprint + evidence entries
7. Pushed to GitHub with individually meaningful commits

## Work performed (layer by layer)

### Layer 1 — Project scaffold
- `create-next-app@latest fundios` → Next.js 16.3.4, TS strict, Tailwind v4, ESLint, App Router, `src/`, `@/*` alias, no-git (git inited; kept).
- Dependencies: Supabase client/SSR, TanStack Query v5, Zustand, Zod, date-fns, clsx + tailwind-merge, lucide-react, CVA, 9 Radix primitives, Sentry, Recharts. Dev: Vitest, Vitest React plugin, Testing Library (react/jest-dom/user-event), jsdom, @types/node.
- **RAID:** `@types/node` was pinned `^20` by create-next-app while vitest 5 requires `^22 || >=24`. Bumped to `^22`.
- shadcn init + 15 components (button, card, badge, input, label, select, dialog, dropdown-menu, table, tabs, toast, tooltip, separator, skeleton, avatar).

### Layer 2 — Directory structure + foundational files
- All route dirs: `(auth)/login`, `(dashboard)/{overview,leads, customers, vehicles, services}` with `[id]` detail dirs, `(admin)/tenants`, `api/{health, whatsapp/webhook}`.
- Components dirs (dashboard, leads, customers, vehicles, services, whatsapp), lib dirs (supabase, whatsapp, mpesa, queue, auth, validations), types, `__tests__/{whatsapp, encryption, rls}`, `supabase/migrations`.
- globals.css (shadcn theme tokens + dark mode), root layout (Inter), root redirect to `/dashboard/overview`.
- Supabase browser/server/middleware clients; `src/proxy.ts` session gate (Next 16 `proxy` convention — codemod applied); auth helpers.
- `logger.ts` — structured JSON, PII redaction (phone/email/name/customer_name).
- `constants.ts` — lead/service enums, KES formatter, reminder window, unresponded threshold.
- `types/index.ts` domain types; `types/database.ts` DB-shaped stub.
- `.env.local.example` (names only) + `.gitignore` (+ `!` exceptions so examples stay tracked).

### Layer 3 — Database schema + verification (the critical layer)
- `supabase/migrations/0001_initial_schema.sql`: 8 enums, 8 tables, 6 `set_updated_at` triggers, RLS on every tenant table, `current_garage_id()` SECURITY DEFINER helper.
- **Raid / deviation — RLS recursion bug found & fixed.** The PRD's policy pattern
  `using ( garage_id = (select garage_id from users where id = auth.uid()) )`
  caused **`infinite recursion detected in policy for relation "users"`** at
  query time (policy on users self-references users). Every tenant policy that
  subqueries the RLS-protected `users` table breaks. Fix: SECURITY DEFINER
  helper `public.current_garage_id()` owned by postgres, bounded by
  `auth.uid()`, then `using ( garage_id = public.current_garage_id() )`.
- **Verified against live Postgres 16** (throwaway `fundios_check` DB):
  - migration applied clean: 8 types / 8 tables / 6 triggers / 7 policies
  - garage A user (simulated JWT sub, non-superuser role) sees exactly its 1 customer; 0 rows of garage B
  - garage B cannot read garage A's rows (both directions proven)
  - cross-tenant INSERT → `new row violates row-level security policy` (fail-closed)
  - anonymous session (no `sub`) → 0 rows everywhere
- `supabase/seed.sql`: Quickstop Garage tenant, owner login (`owner@quickstopgarage.co.ke` / `pilot-pass-2026`), 15 customers (+254), 20 vehicles (Fielder/Forester/Demio/X-Trail/Land Cruiser), 30 services across 6 months, 8 leads across statuses. Dry-run clean; counts verified.

### Layer 4 — Tests + CI + build hardening
- vitest.config.ts (jsdom, `@` alias), `__tests__/setup.ts`.
- P0 scaffolds: cross-tenant WhatsApp queue isolation; encryption key rotation — defined as todos to be implemented when modules are extracted from Kay's. RLS isolation scaffold documents the completed manual proof.
- Next 16 cleanups: `middleware.ts` → `proxy.ts` (official codemod); removed deprecated Edge runtime from `/api/health`. Build is warning-free.
- `.github/workflows/ci.yml` — lint → typecheck → test → build.

### Layer 5 — Docs + governance
- `docs/PRD.md` (authoritative PRD + RAID log), `CONSTITUTION.md`, `AGENTS.md`, `STATUS.md`, `CHANGELOG.md`.

## Evidence
- `docs/evidence/sprint-01/closeout.md` — full verification log (SQL outputs, RLS probe results, build output).
- Migration dry-run: clean. RLS isolation: proven. Lint 0 / typecheck 0 / tests pass / build OK.

## Scope guards
- No feature code shipped (F1–F10) this sprint — that is tomorrow's work. The scaffold is deliberately foundation-only.
- No extracted Kay's modules — P0 test suites gate that (their scaffolds exist here).
- No M-Pesa/WhatsApp live wiring — credentials aren't available; stubs + config only.

## Remaining / next sprint
- F1: live Supabase auth + RBAC (needs Supabase project from Daniel)
- F2-b: generate real `types/database.ts` once project is live
- F3/F4/F5: CRM routes + pages; F6 WhatsApp capture; F7 reminders; F8 dashboard; F9 admin; F10 GMB checklist
- P0 extraction gate: implement the two P0 test suites against extracted modules

## Sign-off
Sprint 01 verified green end-to-end on 2026-09-10. Pushed to GitHub as the repository's first commits.