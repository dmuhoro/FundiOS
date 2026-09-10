# Security — FundiOS

> Canonical security model. Condensed for agents in `.ai/context/08_security.md`.
> Subsystem specs (queue/encryption/webhook) in `docs/security-subsystems.md`.

## 1. The invariants (must never break)

1. **Tenant isolation is a P0.** Every tenant-scoped row bound by `garage_id` +
   RLS policy `public.current_garage_id()` — verified at query time, not assumed.
   Cross-tenant read/write/delete = P0 in any environment (Constitution Art. III).
2. **No service-role keys in client code.** Secret-bearing calls are server-only;
   `.env.*` example files document names only (Art. V.1).
3. **Webhooks verify signatures before processing.** Invalid signatures are
   refused + audit-logged, never silently dropped (Art. V.2).
4. **Zod on every external input** — webhooks, forms, API payloads (Art. V.5).
5. **Every automated action is audited** to `automation_logs` with a SHA-256
   idempotency key (Art. II.2). No silent drops (Art. I.6).

## 2. Auth flow

1. Supabase Auth — email + password (pilot). Browser + server clients in
   `src/lib/supabase/`.
2. `src/proxy.ts` (Next 16 proxy) refreshes the session and gates `/dashboard`
   + `/admin` → `/login`; authenticated users at `/login` → `/dashboard/overview`.
3. Server paths call `requireGarage()` (`permissions.server.ts`): resolves the
   session user → `garage_id` + `role`; redirects to `/login` if unauthenticated;
   throws if no garage association.
4. `requireSuperAdmin()` gates `/admin`: role `super_admin` checked server-side;
   non-super admins redirect to `/dashboard/overview`.

## 3. Tenant isolation mechanics

- Every tenant policy: `using ( garage_id = public.current_garage_id() )`.
- `public.current_garage_id()` is SECURITY DEFINER (owner = postgres), bounded
  by `auth.uid()` + `active = true` (ADR-001). RLS is never bypassed for other rows.
- `tenants` table: RLS off by design; only super_admin via service role,
  server-side, never an RLS exception (Art. III.3).
- Proof of isolation lives in `docs/evidence/sprint-01/closeout.md` (read both
  directions + write fail-closed + anonymous zero-rows).

## 4. Secrets

- Secrets live in environment variables only. `.env.local.example` lists names.
- No hardcoded tokens; `wa_access_token` on `tenants` is encrypted in prod.
- Service role key: server-side only, never referenced in client code.
- CI never receives real secrets.

## 5. Webhooks (F6 — planned, only GET verified today)

- GET: Meta verification handshake — echoes `hub.challenge` only when
  `hub.verify_token` matches (implemented in `src/app/api/whatsapp/webhook/route.ts`).
- POST plan: constant-time `X-Hub-Signature-256` (HMAC-SHA256 over the raw body
  with `WHATSAPP_APP_SECRET`) BEFORE parsing; mismatch → 403 + `automation_logs`
  row. Never silently drop. Inbound scope resolved from phone-number id, never
  caller-supplied garage. Heavy work queued (< 500ms response).

## 6. Validation & logging

- Zod on every external input; schemas in `src/lib/validations/` (F3–F7).
- `logger.ts` redacts `phone, email, name, customer_name`; never log plaintext PII.

## 7. Ops discipline

- Green before push: typecheck, lint, tests, migration dry-run, build.
- M-Pesa callbacks (future): callback-secret auth, matched by CheckoutRequestID,
  idempotent by unique key — same doctrine as webhooks above.