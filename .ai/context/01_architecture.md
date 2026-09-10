# Architecture Brief

> Condensed from `docs/architecture.md`. For full detail read the canonical file.

## Stack

- **Framework:** Next.js 16.3.4 (App Router), TypeScript strict, Tailwind v4, shadcn/ui
- **Database:** Supabase Postgres — RLS on every tenant table; Supabase Auth (email + password for pilot)
- **Server state:** TanStack Query v5 · **Client state:** Zustand · **Validation:** Zod
- **Messaging:** WhatsApp Business Cloud API (F6, not yet wired) · **Payments:** M-Pesa Daraja (deferred)
- **Scheduled jobs:** Supabase Edge Functions (F7, planned) · **Testing:** Vitest + Testing Library
- **CI:** GitHub Actions (`lint → typecheck → test → build`) · **Errors:** Sentry

## Request Lifecycle

```
Browser → src/proxy.ts (Next 16 proxy; session refresh + gate)
  → page / route handler
  → server component or route calls supabase.createClient() (cookies)
  → requireGarage() (src/lib/auth/permissions.server.ts) binds garage scope
  → Supabase query → RLS applies public.current_garage_id() server-side
  → JSON / UI
```

- `src/proxy.ts` redirects unauthenticated `/dashboard` and `/admin` to
  `/login`, and logged-in users away from `/login`. Static assets excluded.
- API routes use the default Node runtime (Edge is deprecated in Next 16).
- RLS is the tenant boundary: the server never "forgets" to scope — the policy
  does it at query time (verified, not assumed).

## Server File Map

| Area | Files |
|---|---|
| Supabase clients | `src/lib/supabase/{client,server,middleware}.ts`, `src/proxy.ts` |
| Auth / tenant | `src/lib/auth/permissions.server.ts` (`requireGarage`, `requireSuperAdmin`) |
| Logging / constants | `src/lib/logger.ts`, `src/lib/constants.ts` |
| API routes | `src/app/api/health/route.ts`, `src/app/api/whatsapp/webhook/route.ts` (stub) |
| Planned modules | `src/lib/whatsapp/`, `src/lib/queue/`, `src/lib/mpesa/`, `src/lib/validations/` (empty placeholders) |

## Build & Deploy

- Build: `npm run build` · Dev: `npm run dev` · Tests: `npm test` · Typecheck: `npm run typecheck`
- DB: `npm run db:migrate` / `db:reset` / `db:types` (Supabase CLI — not yet linked to a live project)
- CI: `.github/workflows/ci.yml` on push/PR to `main` (node 22, `npm ci`)

## Known Gaps (as of Sprint 01)

| Gap | Status |
|---|---|
| No live Supabase project / auth not exercised end-to-end (F1) | BLOCKED — needs URL/keys from Daniel |
| `src/types/database.ts` is a manual stub; regenerate via `db:types` | TODO (F2-b) |
| WhatsApp POST webhook handler is a stub; signature verification unwritten | TODO (F6) |
| Notification queue + encryption modules not yet extracted (P0 fixes gate them) | TODO (P0 gate) |