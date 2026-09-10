# Code Standards Brief

> Condensed from `docs/code-standards.md`. Follow these when writing code.

## Types & TypeScript

- Strict mode; `tsc --noEmit` is authoritative (`npm run typecheck`).
- No `any` / `@ts-ignore` in committed code.
- DB types live in `src/types/database.ts` (mirror of `supabase/migrations/`);
  regenerate via `npm run db:types` against a live project, then re-export
  domain unions from `src/types/index.ts`.
- Nullable/optional columns are typed `null` (mirrors generated Supabase types).

## Module placement

- Real API logic lives in route files (`src/app/api/**/route.ts`).
- Shared/domain logic lives in `src/lib/**` as pure, testable modules with
  colocated `.test.ts` siblings (or under `__tests__/` for P0/security suites).
- Server-only modules use a `.server.ts` suffix (existing: `permissions.server.ts`).
- Components: PascalCase; hooks `use`-prefixed; shadcn/ui primitives in
  `src/components/ui/`.

## Validation (every external input)

- Zod on every webhook, form, and API payload — schemas live in
  `src/lib/validations/` (F3–F7 will add `lead`, `customer`, `vehicle`, `service`).

## Money

- Never raw float arithmetic on amounts. `amount_kes` / `budget_kes` are
  `NUMERIC(10,2)` in Postgres. Deterministic aggregation; `KES_FORMATTER`
  (Intl, `en-KE`) for display only (Constitution Art. IV.1).

## Logging & audits

- Use `src/lib/logger.ts` — structured JSON, PII redaction keys
  `phone, email, name, customer_name`. Never log raw payloads with PII.
- Every automated action writes `automation_logs` with a SHA-256
  `idempotency_key` before the side effect (Constitution Art. II.2).

## Migrations & seed

- `supabase/migrations/YYYYMMDDHHMMSS_*.sql` — sortable names, one migration
  per concern. Schema/seed changes get a dry-run against Postgres before merge.
- Seed lives in `supabase/seed.sql`; enums must match migration enums exactly.

## Tenant-scoping (non-negotiable)

- Every tenant-scoped table: `garage_id UUID NOT NULL REFERENCES tenants(id)`
  + `ALTER TABLE … ENABLE ROW LEVEL SECURITY` + policy
  `garage_id = public.current_garage_id()` (Art. III.1).
- RLS is verified at query time, not assumed — cross-tenant access is a P0.

## Tests

- Vitest + Testing Library; `__tests__/setup.ts` configures jsdom.
- Existing suites: `whatsapp/`, `encryption/`, `rls/` (P0 scaffolds are
  `it.todo` until the modules are extracted — they MUST pass before import).
- New domain logic ships with tests including the forbidden path.

## Commands

| Command | Purpose |
|---|---|
| `npm run dev` | dev server (port 3000) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm test` / `test:watch` / `test:ui` | Vitest |
| `npm run build` | production build |
| `npm run db:migrate` / `db:reset` / `db:types` | Supabase CLI |