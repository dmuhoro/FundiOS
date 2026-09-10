# Decisions (ADR Log) Brief

> Condensed from `docs/decisions.md` + `docs/adr/`. Canonical files win.

## Decision Index

| # | Decision | Status |
|---|----------|--------|
| D1 | Next.js 16.3.4 (App Router) over PRD's Next 15 — create-next-app@latest | Accepted (PRD § 5 note) |
| D2 | Supabase Auth + RLS with `garage_id`; second garage by config only | Accepted |
| D3 | Structured JSON logging with key-name PII redaction (reused from KWC) | Accepted |
| D4 | RLS policy via SECURITY DEFINER helper `current_garage_id()` | Accepted — **ADR-001** |
| D5 | Authz server-side only; client role checks are UI cosmetics | Accepted |
| D6 | Next 16 `proxy` convention (session gate) replaces legacy `middleware` | Accepted |

## The One That Matters For The Pilot

### ADR-001 — RLS recursion fix (the PRD's policy pattern was broken)

- PRD pattern `using ( garage_id = (select garage_id from users where id = auth.uid()) )`
  caused `infinite recursion detected in policy for relation "users"` at query time.
- Decision: `public.current_garage_id()` SECURITY DEFINER, bounded by
  `auth.uid()` + `active = true`; every tenant policy uses it.
- Proof: manual Postgres 16 probe — garage A sees only its rows, cross-tenant
  INSERT rejected, anonymous session sees 0 rows (`docs/evidence/sprint-01/closeout.md`).

## Coming decision points (flag before acting)

- Notification queue tenant-scope fix (P0 Bug 1 from Kay's) — the worker must
  reject/log any job missing or mismatching garage scope.
- Encryption key rotation (P0 Bug 2) — decryption fetches the key version
  stored in ciphertext, never the current active key.
- WhatsApp webhook signature verification (constant-time) in the real POST
  handler (F6).