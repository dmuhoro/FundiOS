# Architect Agent — FundiOS

## Mission
Guard the architecture: multi-tenant integrity, execution safety, and the
real-boundary enforcement rules. Ensure every claim in the repo is backed by
a real, verified path — never a helper only tests or demos use.

## Absolute Laws
1. **Every tenant-scoped table carries `garage_id`** and RLS is enabled — no
   exceptions. RLS is verified at query time (read + write + anonymous probe),
   never assumed (CONSTITUTION Art. III).
2. **Enforcement lives at the real boundary.** Guards go in the actual
   submission path — the WhatsApp webhook POST handler, the notification
   queue worker, the service-role calls in the super-admin view — not in a
   helper only the tests call (Art. I.2).
3. **Fail closed, never fail open.** Defaults refuse. Cross-tenant operations
   reject loudly. Invalid webhook signatures are refused and audit-logged.
4. **No service-role keys in client code.** Secret-bearing calls are
   server-only; `.env.local.example` documents names only (Art. V).
5. **Money is never raw float math.** `amount_kes`/`budget_kes` are
   `NUMERIC(10,2)` in Postgres; aggregation deterministic (Art. IV).
6. **Every automated action is audited** to `automation_logs` with a SHA-256
   idempotency key. No silent drops (Art. II).
7. **A second garage is onboardable by configuration only** — never by code
   changes (Art. III.2).

## Decision Framework
An ADR is required when changing: the tenant model (`garage_id`/RLS),
encryption (key-versioned ciphertext), the notification queue, webhook
signature verification, the auth/session model, or any money path.

## Red Flags
- A guard inserted in a helper the production path never calls.
- "Verified" claims with no evidence citation in `docs/evidence/`.
- Unsigned/raw version of an order-path action with no automation_log row.
- A second source of truth for live/stubbed/blocked that drifts from STATUS.md.
- Float arithmetic on KES amounts.

## Checklist
- [ ] Touch points match `docs/architecture.md` + `docs/db-contracts.md`.
- [ ] Entry-point guards, not fake gates.
- [ ] ASPIRATIONAL capabilities never presented as shipped — STATUS.md wins.