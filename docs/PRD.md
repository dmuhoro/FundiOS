# FundiOS — Product Requirements Document
**Version:** 0.1 (Pilot)
**Build window:** 20 days
**Pilot tenant:** Quickstop Garage, Kiambu Road, Nairobi
**Target date:** Pilot demo to garage director

---

## Opencode context block
*Read this entire document before writing any code.*

You are the Lead Implementation Engineer for FundiOS, a multi-tenant
marketing operations SaaS for automobile garages in East Africa. You build
under the direction of a Principal Architect (Claude) and an Operator
(Daniel). You execute specs precisely. You do not invent scope, add
speculative features, or make architecture decisions without flagging them
first.

**Operating rules**
- Before writing code for any section, restate what you understood and flag
  ambiguities. Do not guess silently.
- RLS is mandatory on every table holding tenant data. No exceptions. Verify
  it — do not assume.
- No service-role keys in client-side code. Ever.
- Every webhook (WhatsApp, M-Pesa, Stripe) verifies its signature before
  processing any payload.
- Multi-tenancy is enforced by `garage_id` on every relevant table, from
  day one. A second garage must be onboardable by configuration only —
  never by code changes.
- Every automated action (message sent, lead captured, agent decision) is
  logged to `automation_logs` with a unique ID, timestamp, and enough
  context to replay or audit it.
- When in doubt about scope, implement the simpler path and flag the
  decision. Never silently expand scope.

**Output format for every task**
1. Plain-language restatement of what you understood
2. Files being created or changed
3. The full code
4. What was deliberately left out and why
5. Open questions or risks to flag back to the Architect

---

## 1. Product overview

FundiOS is a plug-and-play marketing operations OS for automobile garages
in East Africa. It replaces manual WhatsApp chaos, missed follow-ups, and
zero customer data with an automated system that captures leads, manages
customer and vehicle records, sends service reminders, and gives the garage
owner a live dashboard — all running without a dedicated marketing hire.

The product is designed to run with minimal human presence once deployed.
Every meaningful system action must be traceable, auditable, and reversible.
Agents may not take irreversible actions (delete data, refund payments, kill
campaigns) without explicit human confirmation.

**Core value proposition to the garage director:**
"When a customer messages you on WhatsApp, FundiOS responds instantly,
captures the lead, logs their vehicle, and reminds them when their next
service is due — without anyone on your team lifting a finger."

---

## 2. What is reused from Kay's Wellness Centre

The following patterns from Kay's are proven and are reused directly.
**Do not rebuild them from scratch.**

| Module | Reuse instruction |
|---|---|
| Multi-tenant middleware (`requireOrg()`) | Rename to `requireGarage()`. Same enforcement logic. |
| WhatsApp Cloud API integration | Same API, same webhook structure, same signature verification. Swap message copy only. |
| Async notification queue with exponential backoff + SHA-256 idempotency keys | Copy directly. |
| RBAC via `permissions.server.ts` | Same pattern. New roles: `owner`, `mechanic`, `receptionist`, `super_admin`. |
| Zod validation patterns | Apply on every webhook, form, and API payload. |
| Structured JSON logging with PII redaction | Copy directly. |
| Supabase Edge Functions cron pattern | Copy directly for reminder triggers. |
| Bilingual content patterns (English/Swahili) | Apply to all customer-facing WhatsApp messages. |

### P0 bugs — fix before extracting any Kay's code

Two unresolved security bugs exist in Kay's that must be fixed at source
before any code is pulled into FundiOS. Do not carry these across.

**Bug 1 — Cross-tenant WhatsApp queue worker exposure**
The fix added an optional parameter that no production caller uses. The
vulnerability is still live. The queue worker must scope every job to its
`tenant_id` and reject or log any job where the tenant scope is missing or
mismatched. Write a test that asserts garage A's WhatsApp jobs cannot be
processed in garage B's context.

**Bug 2 — Encryption key rotation**
Decryption always fetches the current active key instead of the key version
stored in the ciphertext. Fix: store `key_version` alongside every
encrypted value. Decryption must fetch the key matching `key_version`, not
the current active key. Write a test that proves historical records decrypt
correctly after a key rotation.

Both fixes must have passing tests before any Kay's module is imported into
FundiOS.

---

## 3. What is NOT in scope for the 20-day pilot

Defer these entirely. Do not build, do not scaffold, do not create
placeholder files.

- Meta Marketing API / Facebook Ads automation
- Agentic content calendar generation
- WhatsApp broadcast campaigns to customer segments
- Fleet management module
- Insurance panel integration
- Referral tracking module
- M-Pesa deposit collection at booking
- Self-serve garage onboarding flow
- Public marketing site
- Stripe subscription billing (invoice the pilot client manually)
- Native mobile app

If you find yourself about to build any of the above, stop and flag it.

---

## 4. Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router), TypeScript strict mode |
| Styling | Tailwind CSS v4, shadcn/ui |
| Database | Supabase (Postgres), RLS mandatory |
| Auth | Supabase Auth (email + password for pilot) |
| State | Zustand |
| Server state / data fetching | TanStack Query v5 |
| Validation | Zod on every external input |
| Messaging | WhatsApp Business Cloud API |
| Payments | M-Pesa Daraja API (service payments) |
| Scheduled jobs | Supabase Edge Functions |
| Deployment | Vercel (frontend) + Supabase (backend) |
| CI | GitHub Actions |
| Error tracking | Sentry |
| Testing | Vitest + Testing Library |

---

## 5. Project structure

```
fundios/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx            # requireGarage() enforced here
│   │   ├── overview/
│   │   │   └── page.tsx          # KPI dashboard
│   │   ├── leads/
│   │   │   ├── page.tsx          # lead list + status
│   │   │   └── [id]/page.tsx
│   │   ├── customers/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx     # customer + their vehicles
│   │   ├── vehicles/
│   │   │   └── [id]/page.tsx
│   │   └── services/
│   │       ├── page.tsx
│   │       └── [id]/page.tsx
│   ├── (admin)/                  # Daniel's super_admin view
│   │   ├── layout.tsx            # requireSuperAdmin() enforced here
│   │   └── tenants/
│   │       └── page.tsx
│   ├── api/
│   │   ├── whatsapp/
│   │   │   └── webhook/
│   │   │       └── route.ts      # signature-verified entry point
│   │   └── health/
│   │       └── route.ts
│   └── layout.tsx
├── components/
│   ├── ui/                       # shadcn generated components
│   ├── dashboard/
│   │   ├── kpi-card.tsx
│   │   ├── lead-feed.tsx
│   │   └── activity-log.tsx
│   ├── leads/
│   │   ├── lead-table.tsx
│   │   └── lead-detail.tsx
│   ├── customers/
│   │   ├── customer-table.tsx
│   │   └── customer-profile.tsx
│   └── whatsapp/
│       └── message-preview.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts             # browser client
│   │   ├── server.ts             # server client (cookies)
│   │   └── middleware.ts         # session refresh
│   ├── whatsapp/
│   │   ├── client.ts             # send messages
│   │   ├── webhook.ts            # parse + verify inbound
│   │   └── templates.ts         # message templates EN/SW
│   ├── mpesa/
│   │   └── client.ts
│   ├── queue/
│   │   └── notification-queue.ts # with idempotency + backoff
│   ├── auth/
│   │   ├── permissions.server.ts
│   │   └── middleware.ts
│   ├── validations/
│   │   ├── lead.ts
│   │   ├── customer.ts
│   │   ├── vehicle.ts
│   │   └── service.ts
│   ├── logger.ts                 # structured JSON + PII redaction
│   ├── utils.ts
│   └── constants.ts
├── proxy.ts                      # Next.js proxy — auth + tenant routing
├── supabase/
│   ├── migrations/
│   │   └── 0001_initial_schema.sql
│   └── seed.sql                  # Quickstop seed data
├── types/
│   └── index.ts                  # shared TypeScript types
├── __tests__/
│   ├── whatsapp/
│   │   └── cross-tenant-queue.test.ts   # P0 bug test
│   └── encryption/
│       └── key-rotation.test.ts          # P0 bug test
├── .env.local.example
├── .env.test
└── vitest.config.ts
```

> Note: the scaffold runs Next.js **16.3.4** (create-next-app@latest). The
> `middleware` convention is deprecated there; the session gate lives in
> `src/proxy.ts` with the `proxy` export (same matcher config). Edge runtime
> is deprecated too — API routes use the default Node runtime.

---

## 6. Database schema

Write this as a single migration file:
`supabase/migrations/0001_initial_schema.sql`

### Full SQL

```sql
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
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  slug          text not null unique,        -- e.g. "quickstop"
  phone         text,
  email         text,
  address       text,
  plan_tier     plan_tier not null default 'starter',
  wa_phone_id   text,                        -- WhatsApp phone number ID
  wa_access_token text,                      -- store encrypted in prod
  meta_verified boolean not null default false,
  metadata      jsonb not null default '{}'::jsonb,  -- GMB checklist state (F10)
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
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
create table customers ( ... );  -- see migration file for full DDL
create policy "customers_tenant_isolation" on customers
  using ( garage_id = public.current_garage_id() );

-- ============================================================
-- VEHICLES, SERVICES, LEADS, AUTOMATION_LOGS, CAMPAIGNS
-- Same garage_id + RLS pattern. See the migration file.
-- ============================================================

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
```

> **RAID / deviation on the PRD's RLS pattern (recorded 2026-09-10, Sprint 01):**
> The PRD's original policy used an inline subselect
> `using ( garage_id = (select garage_id from users where id = auth.uid()) )`.
> Verified against Postgres this pattern causes **infinite recursion in
> policy for relation "users"** on every tenant query. Fixed in the shipped
> migration via `public.current_garage_id()` (SECURITY DEFINER). RLS
> isolation was then proven end-to-end (read + write + anonymous). The
> full conversation is in `docs/evidence/sprint-01/`.

---

## 7. Feature specifications — 20-day pilot scope

### F1 — Auth and tenant routing (Days 1–2)

Email + password via Supabase Auth; session scoped to `garage_id`;
`requireGarage()` and `requireSuperAdmin()` server helpers; proxy protects
`/dashboard/*` and `/admin/*`. Logging in as garage A exposes nothing of
garage B — proven by the RLS isolation test.

### F2 — Database and seed (Days 1–2)

Migration `0001_initial_schema.sql` + `supabase/seed.sql` seeding Quickstop
Garage: 1 tenant, 1 owner, 15 customers, 20 vehicles, 30 service records
across 6 months, 8 leads across statuses.

### F3 — Lead capture and management (Days 3–6)

Lead table UI, status flow, source filtering, manual entry, convert to
customer flow, duplicate detection (same phone within 30 days warns).

### F4 — Customer and vehicle records (Days 4–7)

Customer profile (name, phone, email, wa_opt_in, vehicles, service history,
total spent / visits / last visit), vehicle detail (history + next service
due), customer table with search and sort.

### F5 — Service records (Days 5–8)

Service form (customer + vehicle search, description, status, amount KES,
paid + method, appointment, next service due date/kilometres, notes),
service list with filters and revenue total.

### F6 — WhatsApp lead capture automation (Days 7–11)

Signature-verified webhook; inbound → lead created OR "welcome back"
personalised reply for known customers; auto-reply templates EN/SW;
everything queued through the notification queue with idempotency +
backoff; owner notified via real-time dashboard event.

### F7 — Service reminders (Days 9–13)

Daily Edge Function `send-service-reminders`: services due within 7 days,
`reminder_sent = false`, `wa_opt_in = true`; sends reminder, marks sent,
audits to `automation_logs`. One garage per invocation.

### F8 — Dashboard (Days 10–14)

Seven KPI cards (new leads / awaiting response / bookings / revenue /
due for service / return rate / active customers) + real-time activity
feed via Supabase real-time subscriptions. Numbers only, no charts.

### F9 — Super admin view (Days 14–16)

Server-rendered tenant list (plan tier, counts, last activity), onboard
tenant form, read-only drill-in. Service role only, never client-side.

### F10 — GMB optimisation checklist (Days 17–18)

Manual ops checklist rendered in dashboard sidebar, persisted in
`tenants.metadata`.

---

## 8. Environment variables

See `.env.local.example` committed in the repo root. All secrets are
environment-only; the example documents names only, never values.

---

## 9. Non-functional requirements

- Dashboard < 2s on 4G; webhook responds 200 in < 500ms (heavy work queued).
- WhatsApp outbound: 3 attempts, exponential backoff.
- Webhooks verify signatures before processing.
- PII redacted from logs.
- Every API route logs method, path, garage_id, duration, status.
- Every automation action audited to `automation_logs`.
- Cross-tenant queue isolation, key rotation, signature verification, lead
  conversion, RLS isolation all have tests.

---

## 10. Phase-by-phase 20-day build plan

| Days | Focus | Deliverable |
|---|---|---|
| 1–2 | Foundation | Project setup, schema, auth, tenant routing, RLS verified |
| 3–4 | CRM core | Customer + vehicle CRUD, service records |
| 5–6 | Lead management | Lead table, status flow, convert-to-customer |
| 7–9 | WhatsApp | Webhook, inbound auto-reply, outbound queue |
| 10–12 | Dashboard | KPI cards, real-time activity feed |
| 13–14 | Reminders | Edge Function, reminder templates |
| 15–16 | Admin view | Super admin tenant list, onboard flow |
| 17–18 | GMB + polish | Checklist UI, bug fixes, end-to-end test |
| 19–20 | Demo prep | Seed realistic Quickstop data, rehearse demo script |

---

## 11. Pilot demo script (for the garage director)

1. Open the dashboard — show KPI cards with today's numbers
2. Send a WhatsApp message from a personal phone to the garage's number
3. Show the lead appear live in the activity feed (real-time)
4. Show the auto-reply that landed on the test phone
5. Open the lead, convert it to a customer, add a vehicle
6. Create a service record, set next service date to 7 days from now
7. Show that a reminder will fire automatically on that date
8. Show the customer profile — their vehicle, service history, total spend
9. "This is running 24/7, without anyone on your team managing it."

---

*End of PRD v0.1 — reviewed and approved by Principal Architect (Claude).*
*DEV: keep this file as the source of truth; log scope deviations in the
sprint docs and this document's "RAID" notes.*