# AGENTS.md — FundiOS

Read `docs/PRD.md` and `docs/engineering/CONSTITUTION.md` first, every session.
Read `STATUS.md` for the single source of truth of what's live / stubbed / blocked.
Read `.ai/context/00_index.md` for the agent routing map (context briefs 00–12 mirror `docs/`).

## Core principles (non-negotiable)
- Multi-tenant by design: every table `tenantId` + function-enforced scoping (Convex), second garage onboardable by config only.
- RLS verified at query time, not assumed. Cross-tenant access impossible, proven by test.
- P0 fixes from Kay's land before any module extraction (queue tenant scope; key-versioned encryption).
- Fail closed, never fail open. No silent drops. Enforcement at the real boundary (CONSTITUTION.md Art. I) — canonical: `docs/engineering/CONSTITUTION.md`.
- Every automated action audited to `automation_logs` with an idempotency key.
- Webhooks verify signatures before processing payloads.
- No service-role keys in client code. Secrets in env vars only (`.env.local.example` documents names only).
- Connectors before intelligence — reliable pipes beat cleverness on top.
- Vertical slices — one complete usable capability per sprint, largest/highest-value first.
- Human-in-the-loop for irreversible actions (delete, refund, campaign kill).

## Engineering conventions
- TypeScript; this repo runs with strict mode enabled — the typechecker is authoritative.
- No `any` / `@ts-ignore` in committed code.
- Money never raw float arithmetic on amounts; `NUMERIC(10,2)` in Postgres, deterministic aggregation.
- Zod validation on every external input (webhooks, forms, API payloads).
- Convex backends host the schema in `convex/schema.ts`; generated client types live in `convex/_generated/` (regenerate via `npm run convex:codegen`).
- Nullable/optional columns are typed `null`, not string | undefined.
- Real API logic lives in Convex functions (`convex/*.ts`); shared/domain logic lives in `src/lib/` as pure, testable modules with `.test.ts` siblings.
- Schema changes go in `convex/schema.ts` (Convex is the single source of truth; `supabase/migrations/` is archived history).

## Commands
- `npm run dev:convex` — full dev env (Next.js port 3000 + Convex dev server)
- `npm run typecheck` — `tsc --noEmit`
- `npm run lint` — `eslint`
- `npm test` — `vitest run`
- `npm run build` — production build
- `npm run convex:codegen` — regenerate `convex/_generated/` from `convex/schema.ts`
- `npm run convex:deploy` — push to the linked Convex deployment

## Process
- Every sprint gets a `docs/sprints/` entry and a `docs/evidence/` entry before it is done.
- Any code change under `src/`, `convex/`, or infra MUST update STATUS.md + CHANGELOG.md (docs-guardrail).
- Commits are explicit and individually meaningful (one concern per commit), SSH-signed where the environment supports it.
- Never commit secrets; `.env.local.example` documents names only.