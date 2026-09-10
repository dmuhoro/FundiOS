# Roadmap Brief

> Current execution state. Canonical: `STATUS.md` (authoritative) + `docs/release-readiness.md`.

## Overarching Goal

Take FundiOS from scaffold to a **production-ready, end-to-end multi-tenant
garage marketing OS** within the 20-day pilot window — first tenant Quickstop
Garage, second garage onboardable by configuration only.

## Layer Status

| Layer | Work | Status |
|---|---|---|
| 0 | Governance + context folders (`.ai/`, `docs/adr|engineering|evidence|releases|runbooks`, canonical docs) | THIS SPRINT (sprint-02) |
| 1 | Foundation & Scaffold — schema + verified RLS + seed + CI + tests | DONE (sprint-01) |
| 2 | F1 auth + live Supabase project | BLOCKED — needs URL/keys from Daniel |
| 3 | F2-b generated `src/types/database.ts` | BLOCKED on layer 2 |
| 4 | F3/F4/F5 CRM — customers, vehicles, services | PENDING |
| 5 | F6 WhatsApp capture + auto-reply + outbound queue | PENDING (P0 gate first) |
| 6 | F7 service reminders (Edge Function cron) | PENDING |
| 7 | F8 dashboard — 7 KPIs + real-time feed | PENDING |
| 8 | F9 super admin tenant view + onboard form | PENDING |
| 9 | F10 GMB checklist (persisted in `tenants.metadata`) | PENDING |
| 10 | P0 extraction gate — queue isolation + key rotation tests pass on real modules | PENDING (scaffolds are `it.todo`) |

## Completion Criteria (Pilot-Ready)

1. All green: `npm run lint` 0 · `npm run typecheck` 0 · `npm test` · `npm run build`
2. RLS isolation automated suite green (cross-tenant read/write/delete refused, super_admin via service role)
3. P0 extraction tests green (queue scope + key-versioned decryption)
4. F6 live: signature-verified webhook → lead → auto-reply → audit, with real WhatsApp credentials
5. F7 reminder fires for due services; F8 KPIs match the DB; F9 super admin sees tenant list
6. Every automated action has an idempotency-keyed `automation_logs` row
7. STATUS.md / evidence claims match code (auditor protocol re-run)

## Blockers (owner-held, deferred by owner)

Live Supabase project · WhatsApp Cloud credentials · M-Pesa Daraja keys.
See `STATUS.md` "Daniel's action items".

## Non-Goals (deliberately descoped — PRD § 3)

Meta Ads automation · agentic content · broadcasts · fleet · insurance ·
referral tracking · M-Pesa STK at booking · self-serve onboarding · marketing
site · Stripe billing · native mobile app.