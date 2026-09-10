# Security Subsystems Brief

> Condensed from `docs/security-subsystems.md`. Canonical file wins on conflict.

**Status banner: none of these modules exist yet.** They are the extraction
SPEC (from Kay's) gated by the two P0 test suites whose scaffolds already live
in `__tests__/`. Do NOT treat any of it as shipped until the gate tests pass on
the real path (Constitution Art. I.1).

## Notification Queue (reuse from Kay's — P0 BUG 1 MUST be fixed first)

- Async outbound queue (WhatsApp sends, leads, reminders) with exponential
  backoff and SHA-256 idempotency keys (`automation_logs.idempotency_key`).
- **Kay's bug:** a cross-tenant queue worker exposure — an optional tenant
  scoping param that production callers never passed.
- **FundiOS requirement:** the worker MUST scope every job to its `garage_id`
  and reject + audit-log any job whose scope is missing or mismatched.
- **Gate:** `__tests__/whatsapp/cross-tenant-queue.test.ts` must pass against
  the extracted module before any queue code ships.

## Encryption (reuse from Kay's — P0 BUG 2 MUST be fixed first)

- AES-256-GCM, per-garage derived keys, **key versioned**.
- **Kay's bug:** decryption always fetched the current active key instead of
  the version stored in the ciphertext.
- **FundiOS requirement:** store `key_version` with every ciphertext; decrypt
  with the key matching that version. Old records decrypt after rotation;
  unknown versions throw — never silently return garbage.
- **Gate:** `__tests__/encryption/key-rotation.test.ts` must pass against the
  extracted module first. Where it applies: `tenants.wa_access_token`, PII on
  customers/leads in prod.

## WhatsApp Webhook (F6 — planned)

- GET verify handshake: implemented (`src/app/api/whatsapp/webhook/route.ts`).
- POST: TODO. Plan: constant-time `X-Hub-Signature-256` verification using the
  `WHATSAPP_APP_SECRET` BEFORE parsing; unverified payloads → 403 + audit row
  (never silent). Inbound → lead capture or "welcome back" for known customer;
  auto-reply EN/SW; everything through the queue; owner notified via real-time
  dashboard event.
- Scope resolution: inbound messages map to the garage by phone number id —
  NEVER trust a caller-supplied garage.

## Validation

- Zod on every external input. Schemas land in `src/lib/validations/`
  (`lead`, `customer`, `vehicle`, `service` with F3–F7).

## Active Today

- `src/lib/logger.ts` — structured JSON, PII redaction (`phone, email, name,
  customer_name`). Use it everywhere; never raw `console.log` with PII.
- Secrets policy: env-only, `.env.local.example` = names only, no service-role
  key in client code.

## Ownership & Ordering (Pareto)

Value ordering for the pilot: tenant isolation (done, keep proven) → P0
extraction gate → WhatsApp capture (F6) → reminders (F7) → CRM + dashboard.
Descoped items stay descoped until an explicit decision.