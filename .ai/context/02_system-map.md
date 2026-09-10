# System Map

> Where code lives. Condensed from `docs/architecture.md` §3, §7 and the actual tree.

## Source Root

```
src/
  app/
    page.tsx                  # redirect → /dashboard/overview
    (auth)/login/             # login (F1, awaiting live Supabase)
    (dashboard)/overview|leads|customers|vehicles|services (+ [id] detail dirs)
    (admin)/tenants/          # super_admin tenant view (F9)
    api/health/route.ts       # GET → { status: "ok", service: "FundiOS", ts }
    api/whatsapp/webhook/route.ts  # GET verify (works) + POST stub (F6)
  components/
    ui/*                      # 15 shadcn components (button…tooltip)
    dashboard|leads|customers|vehicles|services|whatsapp/   # feature shells
  lib/
    supabase/{client,server,middleware}.ts
    auth/permissions.server.ts        # requireGarage / requireSuperAdmin
    logger.ts                          # structured JSON + PII redaction
    constants.ts                       # enums, KES formatter, reminder window
    utils.ts                           # cn() etc.
    whatsapp/ mpesa/ queue/ validations/   # EMPTY placeholders (F3–F7)
  types/
    index.ts                   # domain unions (UserRole, LeadStatus, …)
    database.ts                # hand-written Database shape (mirror of migration)
  proxy.ts                     # session gate (Next 16 proxy convention)
```

## Tests

```
__tests__/
  setup.ts                     # vitest + jsdom + testing-library setup
  whatsapp/cross-tenant-queue.test.ts   # P0 Bug 1 scaffold (it.todo)
  encryption/key-rotation.test.ts       # P0 Bug 2 scaffold (it.todo)
  rls/tenant-isolation.test.ts          # RLS suite scaffold (manual proof documented)
```

## Supabase

```
supabase/
  migrations/0001_initial_schema.sql    # 8 enums, 8 tables, 7 RLS policies, 6 triggers
  seed.sql                              # Quickstop: 1 tenant, 1 owner, 15 cust, 20 veh, 30 svc, 8 leads
```

## Docs Map

```
docs/
  PRD.md               # product spec + RAID log (source of truth)
  architecture.md      # canonical architecture + request lifecycle
  code-standards.md    # conventions: TS strict, Zod, money, migrations, tests
  db-contracts.md      # every table: columns, RLS, writers, coupling risks
  decisions.md         # D1–D6 decision log
  security.md          # auth flow, tenant invariants, secrets, webhooks
  security-subsystems.md  # queue / encryption / webhook spec + extraction gate
  release-readiness.md # go/no-go for pilot
  sprint-cross-reference.md  # sprint → feature → evidence index
  adr/                 # ADR-001… (formal decisions)
  engineering/CONSTITUTION.md  # highest-authority governance
  evidence/            # sprint closeouts + dated verification logs
  releases/            # release notes
  runbooks/            # deployment, supabase-local, whatsapp-webhook
  sprints/             # per-sprint records
STATUS.md              # live / stubbed / blocked — AUTHORITATIVE
```

## Money Paths (planned; none live yet)

| Path | Target file | Notes |
|---|---|---|
| Service payment recorded | `src/lib/validations/` + service route (F5) | `amount_kes NUMERIC(10,2)` |
| M-Pesa (deferred) | `src/lib/mpesa/client.ts` | Out of pilot scope — stub only |

## Webhook Entrypoint

| File | Purpose |
|---|---|
| `src/app/api/whatsapp/webhook/route.ts` | GET verify challenge (implemented); POST inbound (F6, TODO — signature verify → parse → queue → audit) |