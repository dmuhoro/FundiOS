# Decisions — FundiOS

> Decision log (D1–D6). Formal ADRs live in `docs/adr/`. When a decision
> carries a formal ADR, it links it. Format per entry:
> Context / Decision / Consequence / Status.

## D1 — Next.js 16.3.4 (App Router) over PRD's Next.js 15
**Context:** PRD § 4 specifies Next.js 15; `create-next-app@latest` author scaffolds Next.js 16.3.4 (Turbopack), and Next 16 deprecates `middleware` (→ `proxy`) and Edge runtime for API routes.
**Decision:** Use Next.js 16.3.4 with the `proxy` convention and default Node runtime; PRD § 5 note records the deviation.
**Consequence:** Warning-free builds; codemod applied (`middleware` → `proxy`). No Edge runtime.
**Status:** Accepted (PRD § 5, Sprint 01).

## D2 — Supabase Auth + RLS with `garage_id`; second garage by config only
**Context:** Multi-tenant by design; RLS mandatory; a second garage must be onboardable without code changes.
**Decision:** Supabase Auth (email + password) for sessions; every tenant-scoped table carries `garage_id` with RLS; onboarding stays config/data-only.
**Consequence:** The tenant boundary is enforced by the database at query time, not trusted to the app. Cross-tenant access is a P0.
**Status:** Accepted.

## D3 — Structured JSON logging with key-name PII redaction (reuse from Kay's)
**Context:** Logs must be greppable, parseable, and free of PII.
**Decision:** `src/lib/logger.ts` emits structured JSON; redacts keys `phone, email, name, customer_name`.
**Consequence:** Traceable audit trail without leaking customer data.
**Status:** Accepted (implemented Sprint 01).

## D4 — RLS policy pattern → SECURITY DEFINER helper `public.current_garage_id()`
**Context:** The PRD's inline-subselect policy caused `infinite recursion detected in policy for relation "users"` at query time (verified on Postgres 16).
**Decision:** Single `SECURITY DEFINER` helper bounded by `auth.uid()` + `active = true`; every tenant policy uses it.
**Consequence:** RLS isolation proven end-to-end (read/write/anonymous); the keystone is now one function.
**Status:** Accepted — **formalized as ADR-001** (docs/adr/ADR-001-rls-recursion-fix.md).

## D5 — Authorization server-side only; client role checks are UI cosmetics
**Context:** Anyone can craft API calls; client checks are not security.
**Decision:** `requireGarage()` / `requireSuperAdmin()` run server-side in every protected path; `super_admin` reaches cross-tenant data via the service role only, never RLS exceptions.
**Consequence:** The client is never a trust boundary.
**Status:** Accepted.

## D6 — Next 16 `proxy` convention replaces legacy `middleware` for the session gate
**Context:** Next.js 16 deprecates `middleware`; the session gate must live at the edge of the app.
**Decision:** `src/proxy.ts` (proxy export + same matcher) refreshes the session and gates `/dashboard` + `/admin`.
**Consequence:** Build warning-free; the session gate covers all protected routes.
**Status:** Accepted (Sprint 01).

## Open decision points (flag before acting)
- Notification queue tenant-scope enforcement (P0 Bug 1 from Kay's) — worker must reject/log any job with missing or mismatched `garage_id`.
- Encryption key-versioned decryption (P0 Bug 2 from Kay's) — decrypt with the version stored in the ciphertext, never the active key.
- WhatsApp webhook constant-time signature verification in the real POST handler (F6).

---

*Last updated: 2026-09-10 (Sprint 02).*