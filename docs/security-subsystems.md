# Security Subsystems — FundiOS

> Canonical spec for the security/automation subsystems to be extracted or built.
> Condensed for agents in `.ai/context/09_security-subsystems.md`.

**Honesty banner:** none of the modules below exist yet. They are the reuse /
build SPEC, gated by the two P0 test suites whose scaffolds already live in
`__tests__/`. Do not treat any of it as shipped until the gate tests pass on
the real path (Constitution Art. I.1).

## 1. Notification queue (reuse from Kay's — P0 Bug 1 must be fixed first)

- Async outbound queue: WhatsApp sends, lead captures, reminders; exponential
  backoff; SHA-256 idempotency keys (`automation_logs.idempotency_key` UNIQUE).
- **Kay's bug:** cross-tenant queue worker exposure — an optional tenant scope
  param that production callers never passed.
- **FundiOS requirement:** the worker MUST scope every job to its `garage_id`
  and reject + audit-log (`tenant_mismatch`) any job whose scope is missing or
  mismatched. Fail closed.
- **Gate test:** `__tests__/whatsapp/cross-tenant-queue.test.ts` must pass
  against the extracted module before any queue code ships:
  - rejects a job whose `garage_id` ≠ worker context
  - logs `tenant_mismatch` to `automation_logs` on mismatch

## 2. Encryption (reuse from Kay's — P0 Bug 2 must be fixed first)

- AES-256-GCM, per-garage derived keys, **key-versioned**.
- **Kay's bug:** decryption fetched the current active key instead of the key
  version stored in the ciphertext.
- **FundiOS requirement:** `key_version` stored alongside every ciphertext;
  decryption fetches the key matching that version (never the active key).
  Old records decrypt after rotation; unknown versions throw — never silently
  return garbage.
- **Gate test:** `__tests__/encryption/key-rotation.test.ts`:
  - decrypts v1 records after rotation to v2
  - decrypts v2 records after rotation
  - throws on unknown `key_version`
- Applies to `tenants.wa_access_token` and PII on customers/leads in prod.

## 3. WhatsApp webhook (F6 — GET implemented, POST planned)

- Signature: constant-time `X-Hub-Signature-256` verify before parse (see
  `docs/security.md` §5 and `docs/runbooks/whatsapp-webhook.md`).
- Flow: verify → parse → resolve garage by phone-number id → known customer ?
  "welcome back" : create lead → enqueue reply (idempotency key) → audit to
  `automation_logs` → owner real-time event → 200 fast.
- Templates EN/SW in `src/lib/whatsapp/templates.ts`.

## 4. Validation

- Zod on every external input; `src/lib/validations/{lead,customer,vehicle,service}.ts`.

## 5. Active today

- `src/lib/logger.ts` — structured JSON, PII redaction (`phone, email, name,
  customer_name`). Always log through it.
- Secrets policy — env-only; `.env.local.example` names only; no service-role
  key in client code.
- `automation_logs` audit table (append-only) is the destination for the queue /
  webhook / reminder audit rows above.

## 6. Ordering (Pareto)

tenant isolation (proven — keep it that way) → P0 extraction gate → F6 WhatsApp
capture → F7 reminders → CRM + dashboard. Descoped items (PRD § 3) stay
descoped until an explicit decision.