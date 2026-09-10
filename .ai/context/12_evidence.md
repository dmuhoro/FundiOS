# Evidence Brief

> How evidence is recorded and what already exists. Canonical: `docs/evidence/README.md`.

## Location & Convention

`docs/evidence/`
- Sprint-driven work: `sprint-NN/closeout.md` (existing: `sprint-01/closeout.md`)
- Event/topic verifications: `YYYY-MM-DD_<topic>.md`
- Each file: date · command/step · observed result · verdict.

## Existing Evidence

| Date | Topic | Verdict |
|---|---|---|
| 2026-09-10 | Sprint 01 foundation closeout (scaffold, RLS proof, build/test/lint/typecheck) | PASS — `docs/evidence/sprint-01/closeout.md` |

## Recording Rule (Constitution Art. VI.3)

A "PASS" requires a cited test or a cited manual verification step — the exact
command + observed output. Never narrative alone. New work this sprint lands in
`docs/evidence/sprint-02/closeout.md` when the layer is verified (this subfolder
will list the commands run to verify the governance scaffold + green checks).

## Evidence Required For Pilot-Readiness (future)

- RLS isolation automated suite green (superset of the manual proof)
- P0 extraction tests green (queue cross-tenant scope + key rotation)
- F1 auth flow end-to-end · F6 WhatsApp live delivery · F7 reminder fire
- Deployment (Vercel + Supabase) with real env
- Each recorded as a dated file with exact commands + observed result.