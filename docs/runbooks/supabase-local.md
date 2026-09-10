# Runbook: Supabase Local — Migrations, Seed, Types, RLS Proof

> For a local/dev Postgres (Supabase CLI or a throwaway Postgres 16). This is
> how the Sprint 01 RLS proof was produced and can be re-run.

## Prereqs

- Postgres 16 reachable (e.g. Docker container) OR `supabase start` once a
  project config exists.
- `supabase/local` CLI linked (or use `psql` against the throwaway DB).

## 1. Apply migration

```bash
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/migrations/0001_initial_schema.sql
```

Expected: clean apply — 8 `CREATE TYPE`, 8 `CREATE TABLE`, 7 `ALTER TABLE …
ENABLE ROW LEVEL SECURITY`, 7 `CREATE POLICY`, 1 function `current_garage_id()`,
6 triggers.

## 2. Seed

```bash
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/seed.sql
```

Expected counts: `tenants=1, customers=15, vehicles=20, services=30, leads=8`.

## 3. Regenerate DB types

```bash
npm run db:types     # supabase gen types typescript --local > src/types/database.ts
npm run typecheck    # 0 errors after regeneration
```

(Current `src/types/database.ts` is a manual stub — swap in generated types.)

## 4. RLS isolation proof (the invariant gate)

Run as a non-superuser role `app_user` with a simulated JWT `sub`:
1. Set `request.jwt.claim.sub` to garage A's user id.
2. `SELECT count(*) FROM customers;` → only garage A rows.
3. Search by name of a garage B customer → 0 rows.
4. `INSERT` a row with garage B's `garage_id` → `new row violates
   row-level security policy` (fail closed).
5. No `sub` set (anonymous) → 0 rows on every tenant table.

Post-fix check (ADR-001):

```sql
select tablename, rowsecurity from pg_tables
where schemaname='public' order by tablename;
-- tenants=f (service-role only), all others=t
```

Record results in `docs/evidence/` (see `12_evidence.md` for the format).

## Pitfalls

- **RLS recursion:** any policy that inline-subqueries the RLS-protected
  `users` table breaks with `infinite recursion detected in policy`. Always use
  `public.current_garage_id()` (ADR-001).
- **Enum drift:** seed enums must exactly match migration enums; watch for
  renamed values (`bank→card`, `booked→converted`, `gmb→google`).
- **Live DB:** never `db:reset` against production — forward migrations only.