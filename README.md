# FundiOS

**The marketing-operations OS for East African automobile garages.**

Fund iOS? No — **FundiOS** (Fleet + iOS) is a multi-tenant B2B SaaS that gives
any garage a professional marketing department without hiring one. A shop plugs
in its WhatsApp Business number, drops in its services, and FundiOS captures
leads, runs the CRM, sends personalized replies and service reminders, and
shows the owner what is working — all in one dashboard.

> **Live product (backend):** https://confident-weasel-372.eu-west-1.convex.site
> · **Pilot tenant:** Quickstop Garage, Kiambu Road, Nairobi
> · **Build window:** 20 days · **Status:** [STATUS.md](STATUS.md)

---

## What this build can do

- **Multi-tenant by construction.** Every table carries `tenantId` and Convex
  functions enforce scoping at query time. Cross-tenant access is
  architecturally impossible and proven by test — one codebase serves any
  number of garages, on-boarded by configuration.
- **WhatsApp Business inbound capture.** The webhook is a Convex HTTP action:
  Meta signatures are verified (HMAC-SHA256, constant-time compare) before any
  payload is parsed; messages are validated with Zod, matched to a garage via
  its `waPhoneId`, and created as leads — idempotently, so re-delivered
  webhooks never duplicate.
- **Instant, personalized auto-reply.** On every lead message, a greeting is
  queued with the lead's profile name in English or Swahili and dispatched
  through a durable outbound pipeline.
- **Durable automation queue.** Every outbound send is an idempotency-keyed
  job on a tenant-scoped queue with claim-based processing, exponential
  backoff, a hard failure cap, and a full audit trail on every transition.
- **Service reminders, on schedule.** A daily cron sweeps services due for
  a follow-up, and opted-in customers receive template messages (EN/SW)
  mentioning their vehicle make and model.
- **Live owner dashboard.** Session-gated app shell with email+password auth
  (Convex Auth), garage-scoped overview, and sign-out — the foundation for
  KPIs and the activity feed.
- **Fail-closed everywhere.** Unknown numbers, bad signatures, malformed JSON,
  and missing credentials all refuse explicitly with machine-readable codes —
  nothing is silently dropped, nothing fails open.

## Architecture

```
Next.js 16 (App Router, TypeScript strict, Tailwind v4, shadcn/ui)       [client]
        ▲
        │ Convex client
        ▼
Convex (single source of truth — schema, auth, queue, HTTP actions)     [backend]
  ├─ convex/schema.ts          tenant-scoped tables (tenants, customers,
  │                            vehicles, services, leads, automationQueue,
  │                            automationLogs) + secondary indexes
  ├─ convex/http.ts            WhatsApp webhook routing (GET verify / POST inbound)
  ├─ convex/whatsapp.ts        signature-verified inbound → lead + enqueued reply
  ├─ convex/queue.ts           durable queue (enqueue / claim / finalize / fail)
  ├─ convex/reminders.ts       daily reminder sweep
  ├─ convex/crons.ts           5s dispatcher + 08:00 EAT reminder cron
  └─ convex/isolation.ts       function-enforced tenant scoping
        ▲
        │ Meta Graph API
        ▼
WhatsApp Business Cloud (outbound text via injectable sender)
```

No Supabase. No raw SQL RLS to assume — isolation is verified at the function
boundary, by test, every run of the suite.

## Quickstart

```bash
npm install
cp .env.local.example .env.local   # add Convex + WhatsApp credentials
npm run dev:convex                 # Next.js on :3000 + Convex dev server
```

## Verification

```bash
npm run lint        # eslint — 0 problems
npm run typecheck   # tsc --noEmit — 0 errors
npm test            # vitest (incl. convex-test isolation + queue proof)
npm run build       # production build
```

## Docs

- [PRD](docs/PRD.md) — product requirements + RAID/deviation log
- [Constitution](docs/engineering/CONSTITUTION.md) — engineering governance
- [STATUS](STATUS.md) — what's live / stubbed / blocked
- [Decisions](docs/decisions.md) · [ADRs](docs/adr/) · [Runbooks](docs/runbooks/)
- [Changelog](CHANGELOG.md) · [Sprints](docs/sprints/) · [Evidence](docs/evidence/)

## Context for AI agents

- `.ai/context/00_index.md` — session routing map (00–12 briefs mirror `docs/`)
- `.ai/agents/` — architect / auditor / builder agent contracts
- `AGENTS.md` — repo rules, commands, and enforcement conventions
- `STATUS.md` — single source of truth for live / stubbed / blocked

## Repo structure

```
src/app/            # routes: (auth), (dashboard); force-dynamic (Convex Auth)
src/components/     # shadcn/ui + feature components
src/lib/            # domain + whatsapp (signature, webhook, templates), constants
convex/             # schema, auth config, http routes, queues, crons, jobs
__tests__/          # vitest suites (unit + Convex-runtime boundary proof)
docs/               # PRD, architecture, decisions/ADRs, runbooks, sprints, evidence
.ai/                # context briefs (00–12) + agent contracts
```

## Operator model

Built once, installed at multiple garages as a productised subscription.
Customer data + vehicle history + service patterns compound inside each
tenant — switching cost grows every month. Configuration-only onboarding for
any second garage (tenant scoping made an invariant, proven by test).