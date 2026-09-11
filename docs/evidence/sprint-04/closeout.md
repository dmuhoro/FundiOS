# Sprint 04 Closeout — Evidence

**Date:** 2026-09-11
**Sprint:** Sprint 04 — Convex pivot foundation

---

## Isolation proof — real boundary, real error codes

Boundary under test is the live submission path: every domain function starts
with `requireGarage` / `requireTenantDocument` from
`convex/lib/authorization.ts`. The proof drives those exact handlers through
`convex-test` with real identities.

```
$ npx vitest run convex/isolation.test.ts --reporter=verbose

 ✓ convex/isolation.test.ts > Tenant isolation > anonymous is denied on all tenant endpoints 300ms
 ✓ convex/isolation.test.ts > Tenant isolation > garage A can CRUD; garage B is scoped away 243ms
 ✓ convex/isolation.test.ts > Tenant isolation > lead deduplication on same phone within tenant 24ms
 ✓ convex/isolation.test.ts > Tenant isolation > deactivated member is denied 21ms
 ✓ convex/isolation.test.ts > Tenant isolation > assigned membership gives scoped access; wrong tenant denied 22ms
 ✓ convex/isolation.test.ts > Tenant isolation > service money stored as integer minor units without float drift 21ms
 ✓ convex/isolation.test.ts > Tenant isolation > automation audit trail scoped and idempotent 17ms

 Test Files  1 passed (1)
      Tests  7 passed (7)
```

**Key assertions proven (not narrative):**
- Anonymous identity → `UNAUTHENTICATED` on every tenant endpoint.
- Garage A can create/read/update its own records; Garage B sees zero rows and
  gets `TENANT_SCOPE` on A's records (get/re-query/convert/create-association).
- Cross-tenant write attempt (B mutating A's vehicle) → `TENANT_SCOPE`.
- `super_admin` may list all tenants; a normal member → `FORBIDDEN`.
- Lead dedupe (same normalized phone) within a tenant returns the existing
  lead, never a duplicate.
- Deactivated member is refused `FORBIDDEN` after their membership is turned off.
- Membership assigned mid-flight grants scoped access; wrong tenant still denied.
- Service price stored as integer minor units; 0.1+0.2 == 0.3 with no float drift.
- Consecutive duplicate automation events log once (check-then-insert idempotency).

## Full repo green

```
$ npm run lint
(0 problems)

$ npm run typecheck
(0 errors)

$ npm test
 Test Files  11 passed (11)
      Tests  55 passed (55)

$ npm run build
(succeeds; static + dynamic routes emitted)
```

Sprint 01's SQL-RLS proof was superseded (ADR-002 / D7): the RLS harness now
lives at `__tests__/rls/tenant-isolation.legacy.ts` (doc-only) because the Convex
boundary is enforced in application code, not Postgres. No `it.todo`/skip
remains in the suite.

## Verdict

**PASS.** The Convex foundation carries the same isolation guarantees the RLS
layer previously provided, enforced at the real function boundary with explicit
machine-readable error codes; no silent drops (every refusal is an error with a
code + audit stays idempotent).