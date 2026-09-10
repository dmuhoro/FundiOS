# Release Readiness — FundiOS

> Go/no-go for the pilot. `STATUS.md` is the authoritative live/stubbed/blocked
> list; this doc grades readiness against the pilot target. Update at every
> pilot checkpoint with cited evidence.

## Pilot target (20-day window — Quickstop Garage)

Lead capture (WhatsApp) · customer/vehicle/service CRM · service reminders ·
7-KPI dashboard + real-time feed · super admin view · GMB checklist.
Multi-tenant isolation proven by test. **Second garage onboardable by config only.**

## Go/No-Go status

### PASS — with evidence

| Item | Evidence |
|---|---|
| Scaffold builds, lints, typechecks, tests green | `docs/evidence/sprint-01/closeout.md` (commands + outputs) |
| Migration + seed apply clean to Postgres 16 | same |
| RLS isolation proven (read / write / anonymous) | same |
| CI green on main | `.github/workflows/ci.yml` |

### NOT VERIFIED / BLOCKED

| # | Item | Severity / blocker |
|---|------|--------------------|
| 1 | Live auth + real `requireGarage()` + RBAC (F1) | BLOCKED — needs live Supabase project (URL/keys from Daniel) |
| 2 | Generated `src/types/database.ts` (`npm run db:types`) | BLOCKED on #1 |
| 3 | WhatsApp live capture + delivery (F6) | BLOCKED — needs WhatsApp Cloud credentials |
| 4 | P0 extraction gate green on real modules | TODO — scaffolds are `it.todo` |
| 5 | CRM CRUD (F3–F5) · reminders (F7) · dashboard (F8) · admin (F9) · GMB (F10) | PENDING, in build order |
| 6 | M-Pesa service payments | DESCoped for pilot (manual logging) |

## Pilot gate (all must hold before demo)

1. RLS isolation **automated** suite green (superset of the manual proof)
2. P0 extraction tests green (queue scope + key-versioned decryption)
3. Webhook signature verification live + tested
4. Every automated action leaves an idempotency-keyed `automation_logs` row
5. STATUS.md claims match code (auditor protocol re-run)
6. Dashboard KPIs match the DB (F8)

## Descoped deliberately (PRD § 3 — do NOT silently re-include)

Meta Ads automation · agentic content · broadcasts · fleet · insurance ·
referral tracking · M-Pesa STK at booking · self-serve onboarding · marketing
site · Stripe billing · native mobile app.

## Riskiest unknowns

- Cross-tenant WhatsApp queue isolation (Kay's P0 Bug 1) — gate test must pass.
- Key-versioned encryption (Kay's P0 Bug 2) — gate test must pass.
- Live WhatsApp delivery with real credentials (owner-held).