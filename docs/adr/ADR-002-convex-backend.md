# ADR-002: Replace Supabase backend with Convex

**Date:** 2026-09-11 · **Status:** Accepted

## Context

FundiOS was designed on the PRD's stack: Supabase (Postgres + RLS + Auth + Edge Functions).
Daniel exhausted the Supabase free-tier project limit on 2026-09-11 and created a Convex
project (`confident-weasel-372`) as the replacement. This is a genuine stack fork, not a
drop-in substitution, and must be recorded here per the linking convention.

## Decision

Replace the Supabase backend (Postgres, Supabase Auth, Edge Functions) with Convex
for all persistent data, authentication, server-side mutations, and scheduled jobs.
The Next.js frontend and WhatsApp webhook (Next.js API route) remain unchanged in
framework; the data path shifts from `@supabase/ssr` / `@supabase/supabase-js` to
Convex client hooks (`useQuery`/`useMutation`) and Convex server actions.

## Consequence

1. **Multi-tenant isolation shifts from SQL RLS to function-enforced authorization.**
   Every Convex query/mutation asserts the caller's identity and verifies the target
   garage matches their membership *at the function boundary* — the real boundary
   per CONSTITUTION Art. I. An isolation test suite (garage A cannot read/write garage B,
   anonymous denied) must prove this, mirroring the RLS proof in Sprint 01.
   ADR-001 is superseded for the Convex path; the SECURITY DEFINER pattern is no longer
   the enforcement mechanism.
2. **Built-in capabilities gained.** Convex provides reactive realtime (F8 dashboard
   activity feed) and scheduled cron (F7 reminders) without separate infrastructure.
   The Postgres `notification_queue` table (F6) may be replaced by Convex
   scheduling / delayed mutations.
3. **Auth model:** Convex Auth with the `Password` provider (email + password, matching
   PRD F1).
4. **Data model migration:** all tables (tenants, users, customers, vehicles, services,
   leads, automation_logs, campaigns) translate to Convex documents with a typed
   `schema.ts` and Convex validators (`v`) replacing SQL DDL. Money remains stored as
   integer minor units (NUMERIC → Convex number stored as integer invariants).
5. **Supabase dependencies** remain temporarily in `package.json` to avoid breaking
   the current commit while old route files are still referenced; they will be removed
   in the same sprint that deletes the Supabase API wiring (Sprint 04/05).
6. **PRD §4 Tech Stack** deviation recorded in `docs/decisions.md` as decision D7.

## Evidence

- Convex project created and deployment URL confirmed by Daniel: `https://confident-weasel-372.eu-west-1.convex.cloud/`
- ADR-001 RLS proof no longer applies to the live data path.
- Convex Auth Password provider docs: `labs.convex.dev/auth/config/passwords`
- `convex-test` package (0.0.57) available for in-memory isolation testing.

## Links

- `docs/decisions.md` — D7
- `docs/PRD.md` §4 — deviation note
- `docs/sprints/sprint-cross-reference.md` — Sprint 04
- `STATUS.md` — Convex pivot
- `AGENTS.md` — Constitution Art. I (enforcement at the real boundary)