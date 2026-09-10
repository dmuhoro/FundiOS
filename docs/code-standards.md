# Code Standards — FundiOS

> Canonical engineering conventions. Condensed for agents in
> `.ai/context/04_code-standards.md`. TypeScript strict; `tsc` is authoritative.

## 1. TypeScript

- Strict mode; `npm run typecheck` (`tsc --noEmit`) must be 0 errors.
- No `any` / `@ts-ignore` in committed code.
- DB types: `src/types/database.ts` mirrors `supabase/migrations/`; regenerate
  via `npm run db:types` against a live project; domain unions re-exported from
  `src/types/index.ts`.
- Nullable/optional columns typed `null`, not `string | undefined` (mirrors
  generated Supabase types).

## 2. Module placement

- **Real API logic lives in the route files** (`src/app/api/**/route.ts`).
- **Shared/domain logic lives in `src/lib/`** as pure, testable modules with
  colocated `.test.ts` siblings.
- Server-only modules carry a `.server.ts` suffix (existing:
  `permissions.server.ts`).
- Components: PascalCase file names; hooks `use`-prefixed; shadcn/ui primitives
  stay in `src/components/ui/`; feature components in `src/components/<area>/`.

## 3. Validation (every external input)

Zod on every webhook, form, and API payload. Schemas land in
`src/lib/validations/` (`lead`, `customer`, `vehicle`, `service` — F3–F7).

## 4. Money

- Never raw float arithmetic on amounts. `amount_kes` / `budget_kes` are
  `NUMERIC(10,2)` in Postgres; aggregation deterministic.
- Formatting is display-only via `KES_FORMATTER` (`Intl`, `en-KE`) in
  `src/lib/constants.ts` (Constitution Art. IV).

## 5. Logging & audit

- Log through `src/lib/logger.ts` — structured JSON, PII redaction keys:
  `phone`, `email`, `name`, `customer_name`. No plaintext PII, ever.
- Every automated action (message sent, lead captured, agent decision) writes
  an `automation_logs` row with a SHA-256 `idempotency_key` **before** the side
  effect (Constitution Art. II.2). Rejections carry reason + audit + state.

## 6. Multi-tenancy (non-negotiable)

- Every tenant-scoped table: `garage_id UUID NOT NULL REFERENCES tenants(id)`
  + `ENABLE ROW LEVEL SECURITY` + policy `garage_id = public.current_garage_id()`.
- RLS is **verified at query time, not assumed** (see `runbooks/supabase-local.md`
  for the proof). Cross-tenant access = P0.
- A second garage is onboardable by configuration only — never by code changes.
- Tenant-scoping changes require same-commit `docs/db-contracts.md` updates.

## 7. Migrations & seed

- `supabase/migrations/YYYYMMDDHHMMSS_*.sql` — sortable names, one concern per
  migration. New enum values must match migration enum domains exactly.
- Schema/seed changes get a dry-run against Postgres before merge; record the
  result in `docs/evidence/`.

## 8. Tests

- Vitest + Testing Library; `__tests__/setup.ts` configures jsdom + `@` alias.
- Suite layout: `__tests__/whatsapp/`, `__tests__/encryption/`, `__tests__/rls/`
  hold the P0/security suites; feature modules use colocated `.test.ts`.
- New logic ships with tests including the **forbidden path** (garage A vs B,
  key rotation, tampered signature) — never weakened (Art. VI).
- Scripts: `test`, `test:watch`, `test:ui`.

## 9. Commands

| Command | Purpose |
|---|---|
| `npm run dev` | dev server (port 3000) |
| `npm run typecheck` | `tsc --noEmit` — authoritative |
| `npm run lint` | ESLint |
| `npm test` / `test:watch` / `test:ui` | Vitest |
| `npm run build` | production build |
| `npm run db:migrate` / `db:reset` / `db:types` | Supabase CLI |

## 10. Process

- Green before push: typecheck, lint, tests, migration dry-run, build.
- Every sprint: `docs/sprints/` + `docs/evidence/` + `STATUS.md` + `CHANGELOG.md`
  updated before the sprint is done.
- Commits explicit and individually meaningful; never commit secrets.