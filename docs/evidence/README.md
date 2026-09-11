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
| 2026-09-11 | Sprint 03 — 80/20 execution (P0 gate suites on real module paths, signature-verified webhook, CRM cores) | `sprint-03/closeout.md` | PASS |
| 2026-09-11 | Sprint 04 — Convex pivot foundation (function-boundary isolation proof 7/7, full suite 55/55, 0 todos) | `sprint-04/closeout.md` | PASS |
| 2026-09-11 | Sprint 05 — Live auth + Supabase removal (Convex Auth UI + JWT keys, WhatsApp HTTP action boundary proof, Supabase fully removed; 61/61, 0 todos, build green) | `sprint-05/closeout.md` | PASS |
| 2026-09-11 | Sprint 06 — Durable automation + WhatsApp outbound (idempotency-keyed `automationQueue`, claim/backoff/cap state machine, injectable sender, 5s dispatcher + reminder crons, audits; 72/72, 0 todos, build green) | `sprint-06/closeout.md` | PASS |
| 2026-09-11 | Sprint 07 — Live product + operator console (branded FundiOS landing at Convex-site root, dashboard KPIs + activity feed, super admin, GMB checklist, Brianna'sOS connector v1; 110/110, 0 todos, deployed; live curl: landing 200, webhook 403-as-intended) | `sprint-07/closeout.md` | PASS |
| 2026-09-11 | Live FundiOS site — landing 200 + title, webhook route alive (403 not 404) | `sprint-07/fundios-live-site-verified.md` | PASS |
| 2026-09-11 | Sprint 08 — Acquisition funnel (UTM-attributed `/c/<slug>` capture → tenant-scoped leads + campaign attribution, marketing console, shared capture lib; 128/128, 0 todos, deployed; live curl: GET form 200, POST capture 200) | `sprint-08/closeout.md` | PASS |

## Required evidence — pilot-readiness (future)

- RLS isolation automated suite green (superset of the manual proof)
- P0 extraction tests green (queue cross-tenant scope · key-versioned decryption)
- F1 auth end-to-end · F6 WhatsApp live delivery · F7 reminder fire
- Deployment (Vercel + Supabase) with real env
- Each as a dated file with exact commands + observed result.