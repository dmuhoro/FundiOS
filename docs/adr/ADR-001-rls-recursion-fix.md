# ADR-001: RLS policy pattern → SECURITY DEFINER helper `public.current_garage_id()`

**Date:** 2026-09-10 · **Status:** Accepted · **Supersedes:** PRD § 6 policy pattern

## Context

The PRD's multi-tenant RLS pattern used an inline subselect:

```sql
create policy "users_tenant_isolation" on users
  using ( garage_id = (select garage_id from users where id = auth.uid()) );
```

Verified against live Postgres 16 (non-superuser role, simulated JWT), every
tenant query failed with:

```
ERROR:  infinite recursion detected in policy for relation "users"
```

The policy on `users` inline-subqueries `users`, which is itself RLS-protected —
Postgres refuses to re-enter the policy. The pattern also propagated to every
other tenant table that needed a user lookup.

Second-order consequence of the broken pattern: a "fixed by adding an optional
parameter no production caller uses" style patch would leave the isolation
claim false — exactly the class of bug FundiOS must never carry (Constitution
Art. I.1).

## Decision

Introduce a single SECURITY DEFINER helper owned by `postgres`, bounded by
`auth.uid()`, and use it in every tenant policy:

```sql
create or replace function public.current_garage_id()
returns uuid language sql stable security definer as $$
  select garage_id from users
  where id = auth.uid() and active = true
  limit 1;
$$;

create policy "users_tenant_isolation" on users
  using ( garage_id = public.current_garage_id() );
```

- Runs as the table owner (postgres), so RLS is not re-entered for the
  self-referential lookup.
- Returns only the caller's **own** membership (`auth.uid()` +
  `active = true`), so RLS is never bypassed for other rows.
- Applied identically to all 7 tenant tables (`users`, `customers`, `vehicles`,
  `services`, `leads`, `automation_logs`, `campaigns`).

## Consequence

- **Positive:** RLS isolation proven end-to-end — garage A reads only its rows,
  cross-tenant INSERT rejected (`new row violates row-level security policy`),
  anonymous session sees 0 rows everywhere. Full proof in
  `docs/evidence/sprint-01/closeout.md`.
- **Negative:** one more database function to maintain; the RFC freedom of the
  PRD's inline pattern is removed (in favor of one keystone helper).
- **Watch item:** `current_garage_id()` returns `NULL` for a user with
  `active = false` or no garage — policies then match nothing (fail closed),
  and `requireGarage()` throws for garage-less users. Intended behavior.

## Evidence / Links

- `supabase/migrations/0001_initial_schema.sql` — the function + policies
- `docs/evidence/sprint-01/closeout.md` — reproduction of the recursion bug,
  the fix, and the post-fix isolation matrix
- RAID note recorded in `docs/PRD.md` § 6