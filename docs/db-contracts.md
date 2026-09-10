# DB Contracts — FundiOS

> Canonical database contracts: every table, its columns, RLS status, writers,
> and coupling risks. Condensed for agents in `.ai/context/05_db-contracts.md`.
> Migration: `supabase/migrations/0001_initial_schema.sql` (seed: `supabase/seed.sql`).

## 1. Global conventions

- Tenant column: **`garage_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE`**
  on every tenant-scoped table. `tenants` is unscoped (no RLS) and reached only
  by `super_admin` via the service role.
- RLS: `ENABLE ROW LEVEL SECURITY` + policy `using ( garage_id = public.current_garage_id() )`
  on all 7 tenant tables. `current_garage_id()` is SECURITY DEFINER, bounded by
  `auth.uid()` + `active = true` (ADR-001).
- Automatic `updated_at` via `set_updated_at()` trigger on `tenants`, `users`,
  `customers`, `vehicles`, `services`, `leads`. `automation_logs` has no
  trigger — it is append-only.
- Types: regenerate `src/types/database.ts` with `npm run db:types`.

## 2. Enums

`user_role` (`owner | mechanic | receptionist | super_admin`)
`lead_source` (`whatsapp | facebook | walk_in | referral | google | other`)
`lead_status` (`new | contacted | converted | lost`)
`service_status` (`pending | in_progress | completed | cancelled`)
`payment_method` (`cash | mpesa | card | invoice`)
`plan_tier` (`starter | growth | premium`)
`automation_trigger` (`whatsapp_inbound | lead_created | service_completed | reminder_due | campaign_fired | agent_action`)
`automation_status` (`success | failed | skipped | pending`)

## 3. Table contracts

### tenants (tenant root — NO RLS)
- `id uuid PK default gen_random_uuid()`, `name text NOT NULL`, `slug text NOT NULL UNIQUE`,
  `phone`, `email`, `address`, `plan_tier default 'starter'`, `wa_phone_id`,
  `wa_access_token` (**encrypt in prod**), `meta_verified boolean default false`,
  `metadata jsonb default '{}'` (GMB checklist state, F10), `created_at`, `updated_at`.
- Access: super_admin via service role only. Never through an RLS policy.

### users
- `id uuid PK → auth.users`, `garage_id → tenants` (nullable: super_admin may be org-less),
  `name NOT NULL`, `phone`, `role default 'receptionist'`, `active default true`,
  `created_at`, `updated_at`. RLS: `garage_id = current_garage_id()`.

### customers
- `garage_id NOT NULL`, `name NOT NULL`, `phone NOT NULL` (+254), `email`, `notes`,
  `wa_opt_in default false`, timestamps. RLS. Indexes: `(garage_id)`,
  `(garage_id, phone)`.

### vehicles
- `garage_id NOT NULL`, `customer_id NOT NULL → customers`, `make NOT NULL`, `model NOT NULL`,
  `year`, `plate_number`, `color`, `mileage_km` (last recorded at service), `notes`,
  timestamps. RLS. Indexes: `(garage_id)`, `(customer_id)`. One customer → many vehicles.

### services
- `garage_id NOT NULL`, `customer_id NOT NULL → customers`, `vehicle_id NOT NULL → vehicles`,
  `description NOT NULL`, `status default 'pending'`, `amount_kes numeric(10,2)`,
  `paid boolean default false`, `payment_method`, `appointment_at`, `completed_at`,
  `next_service_km`, `next_service_at`, `reminder_sent boolean default false`, `notes`, timestamps.
- RLS. Partial index `(garage_id, next_service_at, reminder_sent)
  WHERE reminder_sent = false AND next_service_at IS NOT NULL` — the F7 reminder target.

### leads
- `garage_id NOT NULL`, `name`, `phone NOT NULL`, `vehicle_make`, `vehicle_model`,
  `message`, `source default 'whatsapp'`, `status default 'new'`,
  `converted_to → customers`, `assigned_to → users`, timestamps. RLS.
  Indexes: `(garage_id)`, `(garage_id, status)`, `(garage_id, phone)`.

### automation_logs (immutable audit trail)
- `garage_id NOT NULL`, `trigger_type automation_trigger NOT NULL`, `entity_type`, `entity_id`,
  `action text NOT NULL` (human-readable, e.g. `sent_welcome_message`),
  `payload jsonb`, `status automation_status default 'pending'`, `error_message`,
  `idempotency_key text UNIQUE` (SHA-256 — prevents double-fire), `created_at`.
- RLS. Indexes: `(garage_id)`, `(entity_type, entity_id)`. No update trigger.

### campaigns (schema-ready — feature DEFERRED)
- `garage_id NOT NULL`, `name NOT NULL`, `type`, `status default 'draft'`,
  `budget_kes numeric(10,2)`, `start_date`, `end_date`, `created_at`. RLS.
- No writers yet — do not build UI/logic for it in the pilot (PRD § 3).

## 4. Writers (who writes what)

| Table | Writers | Risk |
|---|---|---|
| `users` | seed; Supabase Auth (F1) | LOW |
| `customers` | seed; CRM (F4); **lead conversion (F3)** | MEDIUM — conversion writes leads+customers |
| `vehicles` | seed; CRM (F4) | LOW |
| `services` | seed; CRM (F5) | MEDIUM — FK chains to customer+vehicle |
| `leads` | seed; webhook (F6); manual (F3) | MEDIUM |
| `automation_logs` | every automation subsystem | **HIGH** — one immutable audit path |
| `campaigns` | none yet | deferred |

## 5. Guardrails

- New table ⇒ `garage_id` + RLS + index, migration dry-run verified.
- A tenant-scoping change ⇒ same-commit `docs/db-contracts.md` update.
- Money columns stay `NUMERIC(10,2)`; no float arithmetic (Art. IV).
- `automation_logs.idempotency_key` is UNIQUE — replays never duplicate.