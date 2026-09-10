# Evidence Log — FundiOS

> Machine-readable record of verifications. Every entry cites the exact
> command/test/step and the observed result. A PASS requires evidence — never
> narrative (Constitution Art. VI.3).

## Conventions

- Sprint-driven work: `sprint-NN/closeout.md` (the sprint's verification dump).
- Event/topic verifications: `YYYY-MM-DD_<topic>.md`.
- Format:

```markdown
# <Date> — <Topic>

## Command / Step
<exact command or manual step>

## Observed Result
<output, screenshot ref, or PASS/FAIL>

## Verdict
PASS / FAIL / BLOCKED
```

## Index

| Date | Topic | File | Verdict |
|------|-------|------|---------|
| 2026-09-10 | Sprint 01 — Foundation & Scaffold closeout (scaffold, RLS proof, seed, build/lint/typecheck/test) | `sprint-01/closeout.md` | PASS |
| 2026-09-10 | Sprint 02 — Governance & context layer (this scaffold: `.ai/`, `docs/adr|engineering|evidence|releases|runbooks`, canonical docs; green re-run) | `sprint-02/closeout.md` | PASS |

## Required evidence — pilot-readiness (future)

- RLS isolation automated suite green (superset of the manual proof)
- P0 extraction tests green (queue cross-tenant scope · key-versioned decryption)
- F1 auth end-to-end · F6 WhatsApp live delivery · F7 reminder fire
- Deployment (Vercel + Supabase) with real env
- Each as a dated file with exact commands + observed result.