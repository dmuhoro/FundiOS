# Security Brief

> Condensed from `docs/security.md` + `docs/security-subsystems.md`. The invariants that must never break.

## Auth Flow

1. Supabase Auth (email + password) via `@supabase/ssr` browser/server clients.
2. `src/proxy.ts` (Next 16 `proxy`) refreshes the session and gates
   `/dashboard` + `/admin` → `/login`; logged-in users at `/login` →
   `/dashboard/overview`. Static assets excluded.
3. Server components/routes call `requireGarage()` (`permissions.server.ts`)
   which resolves the session user → their `garage_id` + `role`. Throws if a
   user has no garage.
4. `requireSuperAdmin()` gates `/admin` — role `super_admin` check server-side;
   non-super admins redirect to `/dashboard/overview`.

## Tenant Isolation (THE invariant)

- Every tenant-scoped row is bound by `garage_id` + RLS policy
  `garage_id = public.current_garage_id()` (SECURITY DEFINER), applied at query
  time — not assumed, verified (ADR-001).
- Cross-tenant read or write = **P0 defect** in any environment.
- `tenants` table: RLS off by design; only super_admin via service role,
  server-side. No RLS bypass, ever (Art. III.3).

## Secrets

- No service-role keys in client code. Secrets in env vars; `.env.local.example`
  documents names only. Never commit `.env*` (only examples are tracked).

## Webhook security (F6 — planned, not yet implemented)

- GET = Meta verification handshake (`hub.verify_token`) — implemented.
- POST = plan: verify `X-Hub-Signature-256` with constant-time comparison
  before parsing; unverified payloads are refused and audit-logged to
  `automation_logs` — never silently dropped. Inbound messages must be scoped
  to the correct garage, never caller-supplied.

## Validation & logging

- Zod on every external input (webhooks, forms, API payloads).
- `logger.ts` redacts `phone, email, name, customer_name`. Never log plaintext PII.

## Automation audit

- Every automated action (message sent, lead captured, agent decision) →
  `automation_logs` row with SHA-256 idempotency key carried in the same
  transaction as the side effect. Rejections include reason + audit row (fail closed).

## Coming subsystems (see `09_security-subsystems.md` for the extraction gate)

- Notification queue — tenant scope mandatory (P0 Bug 1 from Kay's).
- Encryption — key-versioned ciphertext: decrypt with the version stored in the
  value, not the current active key (P0 Bug 2 from Kay's).