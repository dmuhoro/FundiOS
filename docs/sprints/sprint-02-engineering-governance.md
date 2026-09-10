# Sprint 02 — Engineering Governance & Context Layer

**Dates:** 2026-09-10 (same session as Sprint 01 delivery)
**Scope:** Stand up the engineering context infrastructure that enables any
agent/session to boot with a coherent, honest model of the codebase — matching
the ecosystem convention (KWC / ShrinkMedia / TraderOS).
**Status:** COMPLETE

## Directive received

Operator asked to set up "all the engineering folders that exist in the other
projects" and "all the files that will enable elite outputs" — then to execute
the governance layer cleanly: sequential layers, evidence, green checks, one
concern per commit, push to GitHub.

## What was built (layer by layer)

### Layer 1 — `.ai/` context set
- `.ai/VERSION` = 1.0.0.
- `.ai/agents/` — `architect-agent.md` (absolute laws + decision framework),
  `auditor-agent.md` (verification protocol with exact commands), `builder-agent.md`
  (mission, responsibilities, Never list). FundiOS-scoped: `garage_id`, RLS,
  execution-safety.
- `.ai/context/` — 13 briefs (00–12) mirroring `docs/`, condensed + pointers only:
  index, architecture, system-map, domain-model, code-standards, db-contracts,
  decisions, release-readiness, security, security-subsystems, roadmap,
  workflow-rules, evidence. Each explicitly defers to its canonical doc.

### Layer 2 — `docs/adr/`
- `README.md` (index + linking convention + template).
- `ADR-001-rls-recursion-fix.md` — promotes the Sprint 01 RAID (PRD's inline
  subselect → infinite RLS recursion) into the first formal ADR:
  context / decision (SECURITY DEFINER `public.current_garage_id()`) /
  consequence / evidence.

### Layer 3 — Constitution relocation + canonical docs
- `git mv CONSTITUTION.md docs/engineering/CONSTITUTION.md` (preserves history;
  ecosystem convention). References updated in `AGENTS.md`, `README.md`.
- Canonical docs written, each matched to the actual code/schema:
  `architecture.md`, `code-standards.md`, `db-contracts.md`, `decisions.md`
  (D1–D6), `security.md`, `security-subsystems.md` (queue/encryption/webhook
  **spec** — explicitly NOT yet implemented), `release-readiness.md`,
  `sprint-cross-reference.md`.

### Layer 4 — runbooks, releases, evidence indexes
- `docs/runbooks/` — `README.md`, `deployment.md`, `supabase-local.md`
  (incl. the RLS proof procedure), `whatsapp-webhook.md` (GET verified, POST F6 plan).
- `docs/releases/README.md` — v0.1.0-pilot IN PROGRESS.
- `docs/evidence/README.md` — conventions + index (sprint-01 → PASS).

### Layer 5 — reference updates + records
- `AGENTS.md`: boot reads → `docs/engineering/CONSTITUTION.md` + `.ai/context/00_index.md`.
- `README.md`: docs links, agent-context section, repo structure.
- `STATUS.md`: Sprint 02 state recorded; `CHANGELOG.md`: entry added.

## Honesty guardrails kept

- `docs/security-subsystems.md` and brief `09` carry a banner that the queue /
  encryption / webhook modules **do not exist yet** — they are gated specs.
- `STATUS.md` remains the single authoritative live/stubbed/blocked list.
- No runtime code was touched; live/stubbed status for F1–F10 is unchanged.
- No capability was claimed without a citation (base: `docs/evidence/sprint-01/closeout.md` + the green re-run this sprint).

## Evidence
- `docs/evidence/sprint-02/closeout.md` — the command re-run proving lint /
  typecheck / test / build remained green after the docs layer landed.

## Scope guards
- Docs/context only — no feature code (that is F1–F10, per STATUS.md).
- No Kay's modules extracted (P0 gate still pending by design).

## Remaining / next sprint
- F1 (blocked on live Supabase project) → F2-b → F3/F4/F5 CRM → F6 WhatsApp
  capture (P0 gate first) → F7 reminders → F8 dashboard → F9 admin → F10 GMB.

## Sign-off
Sprint 02 verified green on 2026-09-10. Each piece committed individually;
pushed to GitHub.