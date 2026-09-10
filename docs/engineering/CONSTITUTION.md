# Constitution — FundiOS (Marketing Operations System for Garages)

> Highest-authority engineering governance for this repository. Follows the
> same doctrine as the ecosystem's governing constitutions (ShrinkMedia /
> Kay's Wellness Centre / TraderOS / Brianna's OS) but scoped to a
> multi-tenant garage marketing OS. Where this document and another
> ecosystem document disagree, this repository's source of truth is this
> document; cross-project claims must be cited from their owning repo.

---

## Preamble

FundiOS is a multi-tenant marketing operations OS for automobile garages in
East Africa. It is infrastructure, not a service: a plug-and-play system
that gives any garage a professional marketing department without hiring
one. Its non-negotiable posture, inherited from the ecosystem, is
**execution safety** — a single silent failure in an order path, a webhook,
or a tenant boundary can lose money, customers, or trust. Every article
below makes "fail closed, never fail open" concrete for this product.

---

## Article I — Execution-Safety Guarantees

1. **Never let code claim a protection it does not actually provide.** An
   RLS policy that "applies" but breaks at query time, a pace check that
   does not run on the real send path, or a "verified" migration tested on a
   different path is worse than no protection. If a claim can pass while the
   real production path stays unguarded, the work is not done.
2. **Enforcement lives at the real boundary.** Before any "wire X into the
   order path" acceptance, read the actual code and find the true submission
   path — the WhatsApp webhook POST handler, the notification queue worker,
   the service-role calls in the super-admin view. Insert protection there,
   never in a helper only the tests or demo path use.
3. **Fail closed, never fail open.** Defaults refuse. Cross-tenant operations
   reject loudly. Webhooks with invalid signatures are refused and audited.
   When unsure, choose the conservative outcome.
4. **Proof must exercise the real path.** A unit test of a standalone
   function does not prove wiring. Tests must assert that the actual
   connector/cross-tenant submission is never called when a check refuses.
5. **Say no early, loudly.** If a plan inserts protection at the wrong point,
   proposes a gate that can be bypassed, or expands scope against its own
   constraints, say so explicitly and propose the corrected version before
   executing.
6. **No silent drops.** Rejections are explicit: the caller gets a clear
   reason, an audit record lands in `automation_logs`, and a metric/state
   change makes the outcome visible.

## Article II — Human-in-the-Loop Invariant

1. Agents never take irreversible actions (deleting data, refunding
   payments, killing campaigns) without explicit human confirmation.
2. All automated actions (messages sent, leads captured, agent decisions)
   are logged to `automation_logs` with an idempotency key, timestamp, and
   enough context to replay or audit.
3. The garage director's workflow is autonomous by design — but every
   meaningful system action remains traceable and reversible.

## Article III — Multi-Tenancy Integrity

1. Every tenant-scoped table carries `garage_id` and has RLS enabled — no
   exceptions. RLS is verified, not assumed (`pg_tables.rowsecurity` + an
   actual cross-tenant read/write probe).
2. A second garage must be onboardable by configuration only — never by
   code changes.
3. The `super_admin` role accesses any tenant's data through the service
   role only, server-side, and never through an RLS bypass.
4. All P0 fixes from Kay's carriage must land **before** any module is
   extracted: the WhatsApp queue worker requires an explicit non-optional
   tenant scope, and encryption decryption must fetch the key version stored
   in the ciphertext.

## Article IV — Money & Attribution Integrity

1. Money arithmetic is never raw float math. `amount_kes`, `budget_kes`
   use `NUMERIC` in Postgres; aggregation rounds deterministically.
2. Every report number is computed once, deterministically. Generators
   narrate numbers — they never calculate.
3. Metrics/log ingestion is idempotent, keyed by SHA-256 idempotency keys;
   retries never duplicate a send or a log row.

## Article V — Security

1. Secrets are never committed. `.env.local.example` documents names only.
2. Every webhook (WhatsApp, M-Pesa, Stripe) verifies its signature with
   constant-time comparison; unverified payloads are refused and
   audit-logged — never silently dropped.
3. Client-side code never references the service-role key.
4. PII fields (phone, name, email) are redacted from logs by the logger.
5. Zod validation on every external input — webhooks, forms, API payloads.

## Article VI — Testing & Evidence

1. Green before push: typecheck, lint, tests, migration dry-run, build.
2. New logic has adversarial tests — the forbidden path is tested (garage A
   reading garage B, key rotation, tampered signature), never weakened.
3. Every sprint writes `docs/sprints/` + `docs/evidence/` entries before
   being considered done, and updates STATUS.md + CHANGELOG.md.
4. "What's stubbed / what's live / what's blocked" claims are stated in
   STATUS.md and verified, not trusted.

## Article VII — Pareto Execution

1. Work sequentially in layers; finish one layer before starting the next.
2. Solve the 20% that delivers 80% of value (tenant isolation, lead capture,
   auto-reply, dashboard) before polishing the long tail.
3. Keep scope tight. One honest gap closed beats five half-verified claims.
4. Honesty over optimism: closing one gap never means "risk is complete" —
   record what remains.

## Ratification

Ratified 2026-09-10 (Sprint 01 — Foundation & Scaffold). Amends nothing;
codifies what the ecosystem already enforced, scoped to FundiOS.