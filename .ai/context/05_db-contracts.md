# DB Contracts Brief

> Condensed from `docs/db-contracts.md`. Canonical file wins on conflict.

## Conventions

- Tenant column is **`garage_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE`**
  on every tenant-scoped table. `tenants` itself is unscoped (no RLS); only
  super_admin reaches it via service role.
- RLS is **enabled + policy'd on all 7 tenant tables**: `users`, `customers`,
  `vehicles`, `services`, `leads`, `automation_logs`, `campaigns`. Policy shape:
  `using ( garage_id = public.current_garage_id() )`.
- `public.current_garage_id()` — SECURITY DEFINER, bounded by `auth.uid()` +
  `active = true`, never bypasses isolation for other rows. See ADR-001.
- Enumerated domains: `user_role`, `lead_source`, `lead_status`,
  `service_status`, `payment_method`, `plan_tier`, `automation_trigger`,
  `automation_status` — defined in `0001_initial_schema.sql`.

## Table Contracts (columns of note)

| Table | Key columns | Distinct constraints / indexes | Notes |
|---|---|---|---|
| `tenants` | slug UNIQUE; `wa_access_token` (encrypt in prod); `metadata jsonb` | unique `slug` | No RLS — service-role only |
| `users` | id PK → `auth.users`; `garage_id` nullable (super_admin may be org-less); role default `receptionist` | `garage_id` FK | Policy: `garage_id = current_garage_id()` |
| `customers` | `phone` NOT NULL (+254); `wa_opt_in` default false | `(garage_id, phone)` index | RLS |
| `vehicles` | `customer_id` NOT NULL FK; plate/mileage | `garage_id`, `customer_id` indexes | one customer → many vehicles |
| `services` | `amount_kes numeric(10,2)`; `paid` + `payment_method`; `next_service_at`/`next_service_km`; `reminder_sent` | partial index `(garage_id, next_service_at, reminder_sent) WHERE reminder_sent=false AND next_service_at IS NOT NULL` | reminder query target (F7) |
| `leads` | `phone` NOT NULL; `status` default `new`; `converted_to → customers` | `(garage_id, status)`, `(garage_id, phone)` indexes | conversion link (F3) |
| `automation_logs` | `idempotency_key` UNIQUE; `trigger_type` enum; immutable (no update trigger) | unique `idempotency_key` | audit trail |
| `campaigns` | `budget_kes numeric(10,2)`; status default `draft` | — | schema-ready; feature deferred |

## Writers (who writes what — know before editing)

| Table | Writers | Risk |
|---|---|---|
| `customers` | seed, CRM routes (F4), lead conversion (F3) | conversion touches two tables |
| `services` | seed, CRM routes (F5) | avoids orphan FKs via customer+vehicle |
| `leads` | seed, webhook (F6), manual entry (F3) | MEDIUM |
| `automation_logs` | every automation path (queue, webhook, reminders) | HIGH — immutable single audit path |
| `campaigns` | none yet | deferred |

## Automatic timestamps

`set_updated_at()` trigger on `tenants`, `users`, `customers`, `vehicles`,
`services`, `leads`. `automation_logs` has NO update trigger — it is append-only.

## Guardrails

- A change to tenant scoping = a `docs/db-contracts.md` update in the same commit.
- New table = `garage_id` + RLS + index, and a **verified** dry-run.
- Super admin bypass is achieved with the service role only — never an RLS
  exception (Art. III.3).