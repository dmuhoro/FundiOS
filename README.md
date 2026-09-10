# FundiOS

Multi-tenant marketing operations OS for automobile garages in East Africa.
A plug-and-play system that gives any garage a professional, automated
marketing department without hiring one — lead capture, customer & vehicle
CRM, WhatsApp automation, service reminders, and a live owner dashboard.

**Pilot tenant:** Quickstop Garage, Kiambu Road, Nairobi
**Build window:** 20 days · **Status:** see [STATUS.md](STATUS.md)

## Stack
- Next.js 16 (App Router) + TypeScript strict + Tailwind v4 + shadcn/ui
- Supabase (Postgres + Auth + Realtime), RLS on every tenant table
- TanStack Query v5, Zustand, Zod, date-fns
- WhatsApp Business Cloud API, M-Pesa Daraja (pilot: manual logging)
- Vitest + Testing Library · GitHub Actions CI

## Quickstart
```bash
npm install
cp .env.local.example .env.local   # fill in Supabase + WhatsApp credentials
npm run dev                        # http://localhost:3000
```

## Verification
```bash
npm run lint        # eslint, 0 problems
npm run typecheck   # tsc --noEmit, 0 errors
npm test            # vitest
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

## Repo structure
```
src/app/            # routes: (auth), (dashboard), (admin), api/*
src/components/     # shadcn/ui + feature components
src/lib/            # supabase, auth, whatsapp, mpesa, queue, logger, constants
src/types/          # domain types + database types
supabase/           # migrations + seed
__tests__/          # vitest suites (incl. P0 bug scaffolds)
docs/               # PRD, architecture, decisions/ADRs, runbooks, sprints, evidence
.ai/                # context briefs (00-12) + agent contracts
```

## Operator model
Built once, installed at multiple garages as a productised subscription.
Customer data + vehicle history + service patterns compound inside each
tenant — switching cost grows every month. Configuration-only onboarding for
garage #2 and beyond.