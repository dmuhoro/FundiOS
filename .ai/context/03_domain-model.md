# Domain Model

> Entities and their tenant-scoping verdicts. Condensed from `docs/db-contracts.md`.

## Tenant Root

**tenants** — NOT scoped (it IS the tenant root; RLS off by design). Columns:
`id UUID PK`, `name`, `slug UNIQUE`, `phone`, `email`, `address`,
`plan_tier`, `wa_phone_id`, `wa_access_token` (encrypt in prod), `meta_verified`,
`metadata JSONB` (GMB checklist state, F10), `created_at`, `updated_at`.
Access: super_admin via service role only — never via RLS exception.

## Tenant-Scoped Entities (garage_id + RLS on all)

| Entity | Table | Tenant col | Writers (current / planned) |
|---|---|---|---|
| Staff | `users` | `garage_id` | seed, Supabase Auth (F1) |
| Customers | `customers` | `garage_id` | seed, CRM (F4), lead conversion (F3) |
| Vehicles | `vehicles` | `garage_id` | seed, CRM (F4) |
| Service records | `services` | `garage_id` | seed, CRM (F5) |
| Leads | `leads` | `garage_id` | seed, webhook (F6), manual (F3) |
| Automation audit | `automation_logs` | `garage_id` | every automated action — **immutable** |
| Campaigns | `campaigns` | `garage_id` | schema-ready; feature DEFERRED (no writers yet) |

## Isolation Helper (the RLS keystone)

`public.current_garage_id()` — SECURITY DEFINER, owned by postgres, bounded by
`auth.uid()` + `active = true`; returns the caller's own `garage_id`. Every
tenant policy uses `garage_id = public.current_garage_id()`. This exists
because the PRD's inline subselect caused infinite RLS recursion (ADR-001).

## Money Model

- `services.amount_kes` + `campaigns.budget_kes` → `NUMERIC(10,2)`.
  **No float arithmetic on KES.** Deterministic aggregation only.
- Payment method enum: `cash | mpesa | card | invoice` (payments logged
  on the service row; no separate payments table in pilot schema).

## Idempotency & Audit

- `automation_logs.idempotency_key` text UNIQUE — SHA-256, prevents
  double-fire of any automated action. Every send / capture / agent decision
  must land here first (Constitution Art. II.2).

## Coupling Risks

| Table | Writer coupling | Risk |
|---|---|---|
| `leads` | webhook (F6) + manual (F3) + convert→`customers` | MEDIUM — conversion writes two tables |
| `services` | requires `customer_id` + `vehicle_id` | MEDIUM — FK chains |
| `automation_logs` | every automation subsystem | HIGH — single immutable audit path |

## Enum Domains

`user_role`, `lead_source`, `lead_status`, `service_status`, `payment_method`,
`plan_tier`, `automation_trigger`, `automation_status` — see `db-contracts.md` / `code-standards.md`.