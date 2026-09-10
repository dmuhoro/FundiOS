# Sprint 01 — Closeout Evidence

**Date:** 2026-09-10
**Sprint:** Foundation & Scaffold
**Repository:** `fundios` (new, independent)

This file records the actual verification outputs that back the sprint's
"COMPLETE" claim. Reproduce by running the same commands.

---

## 1. Prerequisites

```
node v22.22.1 · git 2.53.0 · gh CLI 2.96.0 · docker (throwaway Postgres 16)
```

## 2. Scaffold + dependency install

`create-next-app@latest fundios` → Next.js **16.3.4** (Turbopack), TS strict,
Tailwind v4, ESLint, App Router, `src/` dir, `@/*` alias.

Runtime deps (audited 0 vulnerabilities): @supabase/supabase-js, @supabase/ssr,
@tanstack/react-query, zustand, zod, date-fns, clsx, tailwind-merge,
lucide-react, class-variance-authority, 9 × @radix-ui/react-*, @sentry/nextjs,
recharts.

Dev deps: vitest 5, @vitejs/plugin-react, @testing-library/{react,jest-dom,user-event},
jsdom, @types/node ^22 (raised from ^20 to satisfy vitest 5 `peerOptional`).

shadcn init + add: button, card, badge, input, label, select, dialog,
dropdown-menu, table, tabs, toast, tooltip, separator, skeleton, avatar.

## 3. Schema + seed dry-run (throwaway Postgres 16)

Command sequence (Docker container `traderos-pg-test`, DB `fundios_check`):

```sql
create schema if not exists auth;
create table auth.users (id uuid primary key default gen_random_uuid(), email text unique,
  encrypted_password text, email_confirmed_at timestamptz);
create function auth.uid() returns uuid language sql stable as
  $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
```

Migration applied with `ON_ERROR_STOP=1`: clean (8 CREATE TYPE, 8 CREATE
TABLE, 6 ALTER TABLE ENABLE RLS, 7 CREATE POLICY, 6 CREATE TRIGGER... ).

RLS status verified:

```
    tablename    | rowsecurity
-----------------+-------------
 automation_logs | t
 campaigns       | t
 customers       | t
 leads           | t
 services        | t
 tenants         | f        <- by design: super_admin/service-role only
 users           | t
 vehicles        | t
```

**RAID — RLS recursion bug.** PRD pattern failed at query time, as the caller
(as `app_user`, non-superuser, garage A JWT):

```
ERROR:  infinite recursion detected in policy for relation "users"
```

Fixed via SECURITY DEFINER helper (`public.current_garage_id()`). Post-fix
proof, run as `app_user` with `request.jwt.claim.sub = 'garage A user id'`:

| Probe | Result |
|---|---|
| garage A SELECT customers | 1 row (`Alice Cust`) |
| garage A SELECT `name = 'Bob Cust'` (garage B row) | 0 rows |
| garage B SELECT customers | 1 row (`Bob Cust`) |
| garage B INSERT into garage A tenant | `ERROR: new row violates row-level security policy for table "customers"` |
| anonymous (no sub) SELECT customers / users | 0 rows / 0 rows |

Seed applied clean; counts:

```
 tenants | customers | vehicles | services | leads
---------+-----------+----------+----------+-------
       1 |        15 |       20 |       30 |     8
```

Seed enum fixes recorded: `'bank'`→`'card'`, `'booked'`→`'converted'`,
`'gmb'`→`'google'` (mismatched against migration enums).

## 4. Build / lint / typecheck / test

```
$ npm run lint       -> 0 problems
$ npm run typecheck  -> 0 errors
$ npm test           -> Test Files 3 skipped, Tests 9 todo (P0 scaffolds, by design)
$ npm run build      -> Compiled successfully, Route table:
                        ○ /            (redirect → /dashboard/overview)
                        ƒ /api/health
                        ƒ /api/whatsapp/webhook
                        ƒ Proxy (Middleware)
                       no deprecation warnings (proxy convention, no Edge runtime)
```

## 5. CI workflow

`.github/workflows/ci.yml`: install → lint → typecheck → test → build on
push/PR to `main`. (NPM ci requires committed lockfile — present.)

## 6. Deliverable tree (top level)

```
fundios/
├── .env.local.example / .env.local (ignored)
├── AGENTS.md  CHANGELOG.md  CONSTITUTION.md  STATUS.md  README.md
├── docs/  PRD.md  sprints/sprint-01-*.md  evidence/sprint-01/closeout.md
├── src/  app/ (routes + pages dirs)  components/ui/*  lib/*  proxy.ts  middleware.ts (lib)  types/*
├── supabase/  migrations/0001_initial_schema.sql  seed.sql
├── __tests__/  whatsapp/  encryption/  rls/
├── .github/workflows/ci.yml
└── package.json  vitest.config.ts  tsconfig.json  components.json
```

## 7. Known gaps (honesty over optimism)

- supabase CLI not initialized against a live project; `db:dry-run` / `db:types`
  unverified until Daniel provides a Supabase project (STATUS.md § action items).
- P0 test suites and feature tests are deliberate todos, not yet implemented.
- Next.js 16.3.4 was used (create-next-app@latest) though the PRD says Next 15 —
  functionally equivalent for this scope; conventions updated (proxy). Recorded in PRD § 5 note.