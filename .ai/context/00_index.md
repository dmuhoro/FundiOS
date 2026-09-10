# 00 — AI Context Index

## Purpose
The routing map for FundiOS agent sessions. Load this file at session start,
then pull the numbered context files you need. **`docs/` and `STATUS.md` are
the canonical sources; these files are condensed summaries — when in doubt,
read the source.**

## Authority Level
Operational — never overrides `docs/engineering/CONSTITUTION.md`, `AGENTS.md`,
or `STATUS.md` (the live/stubbed/blocked truth).

## Consumers
All AI agents (builder/auditor/architect), engineers, sessions on this repo.

## Dependencies
- `docs/PRD.md` — product spec + RAID log (source of truth for scope)
- `STATUS.md` — what's live / stubbed / blocked (authoritative state)
- `docs/engineering/CONSTITUTION.md` — highest-authority governance
- Root `AGENTS.md` — working rules and commands

## Source Documents
- `.ai/context/` mirrors `docs/` — summarize, never duplicate truth here.

## Update Rules
- Bump `.ai/VERSION` when the context set changes materially.
- Condense from `docs/` after each sprint; never edit `docs/` from here.
- If a summary contradicts `docs/` or `STATUS.md`, the source wins and the
  summary must be corrected.

---

## Boot Sequence
1. `00_index.md` → 2. `11_workflow-rules.md` → 3. `01_architecture.md` +
   `02_system-map.md` + `10_roadmap.md` → 4. task-specific files
   (03/04/05/06/07/08/09).

## Routing Table

| Task type | Follow |
|---|---|
| Architecture / ADR / dependency | `01`, `06`, `architect-agent` |
| Where code lives / route layout | `02` |
| Tenant-scoping / DB / RLS / money | `03`, `05`, `08` |
| Code conventions / tests / migrations | `04` |
| Queue / encryption / webhooks (extraction gate) | `09` |
| Auth / security / secrets | `08` |
| Release gate / evidence | `07`, `12` |
| Roadmap / scope / live-vs-stubbed | `10`, `STATUS.md` |
| What is allowed, how to act | `11` |