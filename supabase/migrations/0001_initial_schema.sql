-- ============================================================
-- FundiOS initial schema
-- PRD v0.1 § 6 — single migration, applied via `npm run db:migrate`
-- ============================================================
-- EXTENSIONS
-- ============================================================
create extension if not exists "pgcrypto";

-- ============================================================
-- ENUMS
-- ============================================================
create type user_role as enum ('owner', 'mechanic', 'receptionist', 'super_admin');
create type lead_source as enum ('whatsapp', 'facebook', 'walk_in', 'referral', 'google', 'other');
create type lead_status as enum ('new', 'contacted', 'converted', 'lost');
create type service_status as enum ('pending', 'in_progress', 'completed', 'cancelled');
create type payment_method as enum ('cash', 'mpesa', 'card', 'invoice');
create type plan_tier as enum ('starter', 'growth', 'premium');
create type automation_trigger as enum (
  'whatsapp_inbound', 'lead_created', 'service_completed',
  'reminder_due', 'campaign_fired', 'agent_action'
);
create type automation_status as enum ('success', 'failed', 'skipped', 'pending');

-- ============================================================
-- TENANTS (garages)
-- ============================================================
create table tenants (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  slug            text not null unique,        -- e.g. "quickstop"
  phone           text,
  email           text,
  address         text,
  plan_tier       plan_tier not null default 'starter',
  wa_phone_id     text,                        -- WhatsApp phone number ID
  wa_access_token text,                        -- store encrypted in prod
  meta_verified   boolean not null default false,
  metadata        jsonb not null default '{}'::jsonb,  -- GMB checklist state (F10)
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- No RLS on tenants — only super_admin accesses this directly via service role

-- ============================================================
-- USERS (staff who log in)
-- ============================================================
create table users (
  id          uuid primary key references auth.users on delete cascade,
  garage_id   uuid references tenants(id) on delete cascade,
  name        text not null,
  phone       text,
  role        user_role not null default 'receptionist',
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table users enable row level security;

-- Helper: current caller's garage_id.
-- SECURITY DEFINER breaks the self-referential RLS recursion that occurs when
-- a policy on `users` (or any table) inline-subqueries `users`. Runs as the
-- table owner (postgres), bounded by auth.uid() — returns only the caller's
-- own membership, so RLS is never bypassed for other rows.
create or replace function public.current_garage_id()
returns uuid language sql stable security definer as $$
  select garage_id from users
  where id = auth.uid() and active = true
  limit 1;
$$;

-- Users can only read/write records in their own garage
create policy "users_tenant_isolation" on users
  using ( garage_id = public.current_garage_id() );

-- Super admin bypasses via service role — never via RLS exception

-- ============================================================
-- CUSTOMERS
-- ============================================================
create table customers (
  id          uuid primary key default gen_random_uuid(),
  garage_id   uuid not null references tenants(id) on delete cascade,
  name        text not null,
  phone       text not null,               -- +254 format
  email       text,
  notes       text,
  wa_opt_in   boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table customers enable row level security;

create policy "customers_tenant_isolation" on customers
  using ( garage_id = public.current_garage_id() );

create index customers_garage_id_idx on customers(garage_id);
create index customers_phone_idx on customers(garage_id, phone);

-- ============================================================
-- VEHICLES (one customer → many vehicles)
-- ============================================================
create table vehicles (
  id              uuid primary key default gen_random_uuid(),
  garage_id       uuid not null references tenants(id) on delete cascade,
  customer_id     uuid not null references customers(id) on delete cascade,
  make            text not null,            -- e.g. Toyota
  model           text not null,            -- e.g. Fielder
  year            integer,
  plate_number    text,
  color           text,
  mileage_km      integer,                  -- last recorded at service
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table vehicles enable row level security;

create policy "vehicles_tenant_isolation" on vehicles
  using ( garage_id = public.current_garage_id() );

create index vehicles_garage_id_idx on vehicles(garage_id);
create index vehicles_customer_id_idx on vehicles(customer_id);

-- ============================================================
-- SERVICES (work done on a vehicle)
-- ============================================================
create table services (
  id              uuid primary key default gen_random_uuid(),
  garage_id       uuid not null references tenants(id) on delete cascade,
  customer_id     uuid not null references customers(id),
  vehicle_id      uuid not null references vehicles(id),
  description     text not null,
  status          service_status not null default 'pending',
  amount_kes      numeric(10,2),
  paid            boolean not null default false,
  payment_method  payment_method,
  appointment_at  timestamptz,
  completed_at    timestamptz,
  next_service_km integer,                  -- mileage trigger for reminder
  next_service_at timestamptz,              -- date trigger for reminder
  reminder_sent   boolean not null default false,
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table services enable row level security;

create policy "services_tenant_isolation" on services
  using ( garage_id = public.current_garage_id() );

create index services_garage_id_idx on services(garage_id);
create index services_reminder_idx on services(garage_id, next_service_at, reminder_sent)
  where reminder_sent = false and next_service_at is not null;

-- ============================================================
-- LEADS (incoming inquiries)
-- ============================================================
create table leads (
  id              uuid primary key default gen_random_uuid(),
  garage_id       uuid not null references tenants(id) on delete cascade,
  name            text,
  phone           text not null,
  vehicle_make    text,
  vehicle_model   text,
  message         text,
  source          lead_source not null default 'whatsapp',
  status          lead_status not null default 'new',
  converted_to    uuid references customers(id),  -- set when lead → customer
  assigned_to     uuid references users(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table leads enable row level security;

create policy "leads_tenant_isolation" on leads
  using ( garage_id = public.current_garage_id() );

create index leads_garage_id_idx on leads(garage_id);
create index leads_status_idx on leads(garage_id, status);
create index leads_phone_idx on leads(garage_id, phone);

-- ============================================================
-- AUTOMATION LOGS (immutable audit trail)
-- ============================================================
create table automation_logs (
  id            uuid primary key default gen_random_uuid(),
  garage_id     uuid not null references tenants(id) on delete cascade,
  trigger_type  automation_trigger not null,
  entity_type   text,                        -- 'lead' | 'customer' | 'service'
  entity_id     uuid,
  action        text not null,               -- human-readable: "sent_welcome_message"
  payload       jsonb,                       -- what was sent / decided
  status        automation_status not null default 'pending',
  error_message text,
  idempotency_key text unique,               -- SHA-256, prevents double-fire
  created_at    timestamptz not null default now()
);

alter table automation_logs enable row level security;

create policy "automation_logs_tenant_isolation" on automation_logs
  using ( garage_id = public.current_garage_id() );

create index automation_logs_garage_id_idx on automation_logs(garage_id);
create index automation_logs_entity_idx on automation_logs(entity_type, entity_id);

-- ============================================================
-- CAMPAIGNS (schema-ready, feature deferred)
-- ============================================================
create table campaigns (
  id          uuid primary key default gen_random_uuid(),
  garage_id   uuid not null references tenants(id) on delete cascade,
  name        text not null,
  type        text,
  status      text not null default 'draft',
  budget_kes  numeric(10,2),
  start_date  date,
  end_date    date,
  created_at  timestamptz not null default now()
);

alter table campaigns enable row level security;

create policy "campaigns_tenant_isolation" on campaigns
  using ( garage_id = public.current_garage_id() );

-- ============================================================
-- UPDATED_AT TRIGGER (apply to all mutable tables)
-- ============================================================
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at before update on tenants
  for each row execute function set_updated_at();
create trigger set_updated_at before update on users
  for each row execute function set_updated_at();
create trigger set_updated_at before update on customers
  for each row execute function set_updated_at();
create trigger set_updated_at before update on vehicles
  for each row execute function set_updated_at();
create trigger set_updated_at before update on services
  for each row execute function set_updated_at();
create trigger set_updated_at before update on leads
  for each row execute function set_updated_at();