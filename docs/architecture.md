# Architecture — FundiOS

> Canonical system architecture. Condensed for agents in
> `.ai/context/01_architecture.md` and `02_system-map.md`.

## 1. Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.3.4 (App Router), TypeScript strict, `src/` layout, `@/*` alias |
| Styling | Tailwind CSS v4, shadcn/ui (15 components in `src/components/ui/`) |
| Database | Supabase Postgres — RLS on every tenant table; `NUMERIC(10,2)` money |
| Auth | Supabase Auth (email + password for pilot), `@supabase/ssr` |
| Server state | TanStack Query v5 · Client state: Zustand · Validation: Zod |
| Messaging | WhatsApp Business Cloud API (F6) — not yet wired |
| Payments | M-Pesa Daraja (deferred; pilot logs payments manually) |
| Scheduled jobs | Supabase Edge Functions (F7) |
| Error tracking | Sentry |
| Testing | Vitest + Testing Library (jsdom) |
| CI | GitHub Actions — lint → typecheck → test → build |
| Hosting | Vercel (frontend) + Supabase (backend) — planned, blocked on live project |

## 2. Request lifecycle

```
Browser
  → src/proxy.ts            (Next 16 proxy: session refresh + gate)
  → server component / route handler
  → supabase.createClient() (cookies-based server client)
  → requireGarage()         (resolves session user → garage_id + role)
  → Supabase query          (RLS applies public.current_garage_id() server-side)
  → JSON / UI
```

- `proxy.ts` gate: unauthenticated `/dashboard` and `/admin` → `/login`;
  authenticated `/login` → `/dashboard/overview`; static assets excluded.
- API routes use the default Node runtime (Edge is deprecated in Next 16).
- **Tenant boundary = RLS at query time.** The server gets the correct scope
  from the session; the policy makes cross-tenant access impossible architecturally.
- Webhooks: respond 200 fast (< 500ms); heavy work goes to the notification
  queue (PRD § NFR).

## 3. Source map

```
src/app/            (auth)/login · (dashboard)/overview|leads|customers|vehicles|services
                    (admin)/tenants · api/health · api/whatsapp/webhook
src/components/ui/  shadcn primitives
src/components/     dashboard|leads|customers|vehicles|services|whatsapp (feature shells)
src/lib/supabase/   client · server · middleware
src/lib/auth/       permissions.server.ts (requireGarage, requireSuperAdmin)
src/lib/logger.ts   structured JSON + PII redaction
src/lib/constants.ts
src/lib/            whatsapp/ mpesa/ queue/ validations/  (empty placeholders for F3–F7)
src/types/          index.ts (domain unions) · database.ts (mirror of migration)
src/proxy.ts        session gate (Next 16 proxy)
__tests__/          setup.ts · whatsapp/ · encryption/ · rls/  (P0 scaffolds)
supabase/migrations/0001_initial_schema.sql · seed.sql
```

## 4. Server file conventions

- Server-only modules use `.server.ts` (e.g. `permissions.server.ts`).
- Real API logic lives in route files; shared/domain logic in `src/lib/` as
  pure, testable modules with colocated `.test.ts` siblings.
- DB types mirror the migration in `src/types/database.ts`, regenerated via
  `npm run db:types` against a live project.

## 5. Money & audit surfaces

- Money: `services.amount_kes` / `campaigns.budget_kes` → `NUMERIC(10,2)`;
  deterministic aggregation; `Intl` for display only (Constitution Art. IV).
- Automation: every automated action (send, capture, agent decision) writes
  `automation_logs` with a SHA-256 idempotency key in the same transaction as
  the side effect (Art. II.2). No silent drops (Art. I.6).

## 6. Known gaps (as of Sprint 01/02)

| Gap | State |
|---|---|
| No live Supabase project; F1 auth not exercised end-to-end | BLOCKED (needs URL/keys) |
| `src/types/database.ts` is a manual stub | TODO F2-b |
| WhatsApp POST handler is a stub; signature verification unwritten | TODO F6 |
| Queue + encryption modules not extracted (P0 fixes gate them) | TODO (P0 gate) |
| CRM CRUD, reminders, dashboard, admin, GMB | PENDING F3–F10 |