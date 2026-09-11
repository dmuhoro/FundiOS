# Sprint 03 Closeout — Evidence

**Date:** 2026-09-11
**Sprint:** Sprint 03 — 80/20 Execution: P0 Gate + Core Domain

---

## Gate test results

### P0 Bug 2 — Encryption key rotation
```
$ npx vitest run __tests__/encryption/key-rotation.test.ts

 Test Files  1 passed (1)
      Tests  5 passed (5)
```

**Key assertions proven:**
- v1-encrypted records decrypt correctly after key rotated to v2
- v2 records decrypt after subsequent rotation
- Unknown key_version throws `UnknownKeyVersionError` (never silently fails)
- Ciphertext locked to exact stored version, not active key
- Keys isolated per garage

### P0 Bug 1 — Cross-tenant queue isolation
```
$ npx vitest run __tests__/whatsapp/cross-tenant-queue.test.ts

 Test Files  1 passed (1)
      Tests  6 passed (6)
```

**Key assertions proven:**
- `enqueueJob` rejects calls with missing `garageId` / `eventType`
- `processGarageQueue` rejects calls with missing `garageId`
- Worker rejects job whose `garage_id` does not match worker context (defense-in-depth)
- `queue_tenant_mismatch_rejected` audit entry written when mismatch detected
- Scoped store: worker for garage A never sees garage B's jobs
- Idempotency key prevents duplicate pending jobs

---

## Full test suite

```
$ npm test

 Test Files  10 passed | 1 skipped (11)
      Tests  48 passed | 4 todo (52)
```

Skipped file: `__tests__/rls/tenant-isolation.test.ts` (requires running Postgres with auth context — deferred to F1).

---

## Lint

```
$ npm run lint

✖ 1 problem (0 errors, 1 warning)
```

Single warning: unused `TAG_LENGTH` constant in encryption module — removed in post-sprint patch commit.

---

## Typecheck

```
$ npm run typecheck

(no output — zero errors)
```

---

## Build

```
$ npm run build

ƒ Proxy (Middleware)
○  (Static)   prerendered as static content
ƒ  (Dynamic)  server-rendered on demand
```

No warnings, no errors.

---

## Commits pushed (each layer individually)
1. `fix(data):` key-versioned encryption with P0 Bug 2 gate tests
2. `feat(queue):` tenant-scoped notification queue with P0 Bug 1 gate tests
3. `feat(whatsapp):` signature verify, webhook parse, EN/SW templates, fail-closed POST handler
4. `feat(crm):` money, phone, Zod validations, domain services, reminders + colocated tests
5. `feat(api):` fail-closed CRM routes with db-unavailable guard + idempotency
6. `docs:` sprint 03 record, evidence, STATUS.md, CHANGELOG.md