# Release Readiness Brief

> Condensed from `docs/release-readiness.md` + `STATUS.md`. STATUS.md is the
> authoritative live/stubbed/blocked list; this brief is the go/no-go framing.

## Pilot target (20-day window, Quickstop Garage)

Lead capture (WhatsApp), customer/vehicle/service CRM, service reminders,
7-KPI dashboard, super admin view, GMB checklist — with multi-tenant
isolation proven by test (PRD § 2, 7).

## PASS so far (evidence cited)

- Migration + seed apply clean to Postgres 16; RLS read/write/anonymous
  isolation proven end-to-end — `docs/evidence/sprint-01/closeout.md`
- Build, lint, typecheck, test green (`npm run build/lint/typecheck/test`)
- CI green on main

## NOT VERIFIED / BLOCKED (owner-held items)

| # | Item | Severity |
|---|------|----------|
| 1 | Live Supabase project — auth flow + real `requireGarage()` + RBAC (F1) | BLOCKED — needs project URL/keys from Daniel |
| 2 | Auto-generated `src/types/database.ts` (`npm run db:types`) | BLOCKED on #1 |
| 3 | WhatsApp live capture + delivery (F6) | BLOCKED — needs WhatsApp Cloud credentials |
| 4 | M-Pesa service payments (planned, deferred) | BLOCKED — needs Daraja keys |
| 5 | P0 extraction gate: queue isolation + key rotation suites pass against real modules | TODO — scaffolds are `it.todo` |

## Descoped for pilot (PRD § 3 — do NOT silently re-include)

Meta Ads automation · agentic content · broadcasts · fleet · insurance ·
referral tracking · M-Pesa STK at booking · self-serve onboarding · marketing
site · Stripe billing · native mobile app.

## Gate before any pilot demo

1. RLS isolation automated suite green (not only the manual proof)
2. P0 extraction tests green (queue scope + key-versioned decryption)
3. Webhook signature verification live and tested
4. Every automated action leaves an idempotency-keyed `automation_logs` row
5. STATUS.md claims match code (auditor re-run)