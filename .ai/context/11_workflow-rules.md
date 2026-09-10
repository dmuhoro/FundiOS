# Workflow Rules Brief

> The rules governing agent execution. Canonical: `docs/engineering/CONSTITUTION.md`
> + root `AGENTS.md` + `docs/PRD.md`.

## Hard Rules

1. **Read first, every session** — `docs/PRD.md` and
   `docs/engineering/CONSTITUTION.md`; then `.ai/context/00_index.md` for routing
   and `STATUS.md` for live/stubbed/blocked (PRD / AGENTS.md).
2. **RLS verified at query time, not assumed** — every tenant table carries
   `garage_id`, RLS enabled, policy `public.current_garage_id()`; cross-tenant
   access is a P0 (Constitution Art. III).
3. **Enforcement at the real boundary** — guards go in the actual submission
   path (webhook POST handler, queue worker, service-role calls), never a
   helper only tests/demos use (Art. I.2).
4. **Fail closed, never fail open** — defaults refuse; invalid signatures and
   cross-tenant operations are refused + audited, never silently dropped (Art. I.3, I.6).
5. **Human-in-the-loop for irreversible actions** — delete, refund, campaign
   kill require explicit confirmation (Art. II.1).
6. **Every automated action audited** — `automation_logs` row with SHA-256
   idempotency key in the same transaction as the side effect (Art. II.2).
7. **No P0-carrying Kay's module imported until its gate tests pass** on the
   real path here (Art. III.4 + `09_security-subsystems.md`).
8. **Money is never raw float** — `NUMERIC(10,2)`, deterministic aggregation (Art. IV).
9. **Secrets never committed** — env vars only; `.env.local.example` = names only (Art. V).
10. **Green before push** — typecheck, lint, tests, migration dry-run, build (Art. VI.1).
11. **Tests include the forbidden path** — garage A vs garage B, key rotation,
    tampered signature (Art. VI.2).
12. **Docs guardrail** — any change under `src/`, `supabase/`, or infra updates
    `STATUS.md` + `CHANGELOG.md`; every sprint writes `docs/sprints/` +
    `docs/evidence/` before being done (AGENTS.md / Art. VI.3).
13. **Explicit, individually meaningful commits** — one concern per commit,
    SSH-signed where supported; never commit a secret (AGENTS.md / Art. VI).

## Execution-Safety Overrides

Say no early, loudly, if a plan is flawed (wrong insertion point, false gate,
scope contradiction) — propose the corrected version before executing
(Art. I.5). Honesty over optimism: closing one gap never means risk is complete
(Art. VI.8 → VII.4).

## Operating Rhythm

1. Boot: `00_index` → `11_workflow-rules` → `01_architecture` +
   `02_system-map` + `10_roadmap`; for tenant/money/security tasks also `08`.
2. Work sequentially in layers; finish one layer (code + tests + docs +
   evidence) before the next.
3. Commit each piece individually; update sprint doc + CHANGELOG + STATUS as you go.
4. Everything green before push. Loop until no tasks remain pending.