# Sprint Cross-Reference — FundiOS

> Index: sprint docs → features → evidence → current status. Single place to
> answer "what did we build, where is the proof, and what's next?".

## Sprint index

| Sprint | Doc | Focus | Evidence | Status |
|---|---|---|---|---|
| 01 | `docs/sprints/sprint-01-foundation-scaffold.md` | Foundation & Scaffold — schema, verified RLS, seed, tests, CI, auth surfaces | `docs/evidence/sprint-01/closeout.md` | COMPLETE (2026-09-10) |
| 02 | `docs/sprints/sprint-02-engineering-governance.md` | Engineering governance & context layer — `.ai/`, ADRs, runbooks, canonical docs | `docs/evidence/sprint-02/closeout.md` | COMPLETE (2026-09-10) |

## Feature → status map

| Feature | PRD § | Status | Notes |
|---|---|---|---|
| F1 Auth + tenant routing | §7 | Stubbed / BLOCKED | `requireGarage`, `requireSuperAdmin`, proxy gate exist; needs live Supabase |
| F2 DB + seed | §7 | DONE | Migration 0001 + seed verified |
| F2-b generated DB types | §7 | TODO | `npm run db:types` once project live |
| F3 Lead capture/mgmt | §7 | PENDING | validations planned in `src/lib/validations/` |
| F4 Customer + vehicle CRM | §7 | PENDING | |
| F5 Service records | §7 | PENDING | money = `numeric(10,2)` |
| F6 WhatsApp capture | §7 | PENDING | GET verify done; POST is the P0-gated F6 |
| F7 Reminders | §7 | PENDING | partial index ready; Edge Function planned |
| F8 Dashboard | §7 | PENDING | |
| F9 Super admin view | §7 | PENDING | service-role only |
| F10 GMB checklist | §7 | PENDING | persists in `tenants.metadata` |
| P0 extraction gate | PRD §2 | PENDING | scaffolds in `__tests__/` are `it.todo` |

## Cross-cutting doctrines (apply to every sprint)

- Fail closed; enforcement at the real boundary; no silent drops (Art. I).
- `garage_id` + RLS on every tenant table; verified at query time (Art. III).
- Automated actions audited with idempotency keys (Art. II).
- Docs guardrail: `src/` / `supabase/` / infra changes update STATUS + CHANGELOG.
- Evidence before "done": `docs/sprints/` + `docs/evidence/` per sprint.