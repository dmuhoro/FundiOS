# Sprint 05 — Live Auth + Supabase Removal

**Status:** COMPLETE
**Dates:** 2026-09-11
**Docs:** ADR-002 · decisions D7 · `docs/evidence/sprint-05/closeout.md`

## Goal

Make Log-In real (Convex Auth password provider + JWT signing, session-gated
routes, login/sign-up UI), move the WhatsApp webhook into Convex (the true
runtime boundary), and delete every remaining Supabase dependency so the
backend is Convex-only end to end.

## Build order delivered

1. **JWT keys** — `JWT_PRIVATE_KEY` + `JWKS` generated (JOSE, P-256) and set on
   the Convex dev deployment via `npx convex env set NAME --from-file`. Site URL
   is built-in on Convex (`CONVEX_SITE_URL` cannot be overridden).
2. **Convex Auth in the app** — `src/middleware.ts`
   (`convexAuthNextjsMiddleware`, public: `/login`, `/sign-up`, `/api/auth(.*)`),
   `src/app/providers.tsx` (`ConvexAuthNextjsProvider`), login + sign-up pages,
   dashboard shell + `dashboard-nav` sign-out, overview page reading
   `api.members.myProfile`, `src/lib/convex.ts` client api re-export.
3. **WhatsApp webhook → Convex HTTP action** — `convex/http.ts` routes
   `GET`/`POST /api/whatsapp/webhook` to `convex/whatsapp.ts`:
   signature-verified (WebCrypto HMAC-SHA256, constant-time compare), zod
   envelope parsing, fail-closed codes (`invalid_signature` / `malformed_json`
   / `no_message` ack / `unknown_wa_number`), tenant resolved via
   `tenants.getByWaPhoneId` (`by_wa_phone` index), lead captured idempotently
   via `leads.createInbound` (dedupe on normalized phone within tenant, audited
   with an idempotency key).
4. **Supabase removal** — uninstalled `@supabase/ssr` + `@supabase/supabase-js`;
   deleted `src/lib/supabase/*`, `src/proxy.ts`,
   `src/lib/auth/permissions.server.ts`, the 4 legacy CRM API routes,
   `src/types/database.ts`, the legacy Next.js webhook route,
   `src/lib/whatsapp/garage-lookup.ts`, and the `db:*` npm scripts.
   `.env.local.example` + `AGENTS.md` updated to Convex-only.
5. **Build fixes** — the Convex Auth provider tree cannot be statically
   prerendered under Next 16/Turbopack; marked the app, root page, not-found
   and dashboard routes `force-dynamic` (they are session-dependent anyway) and
   added a custom `src/app/not-found.tsx`.

## Verification

Full green across the repo: lint 0 problems · typecheck 0 errors · **61 tests
passing (13 files, 0 todos)** · production build succeeds.

WhatsApp boundary proof:
- `__tests__/whatsapp/convex-runtime.test.ts` (4 tests) — proves the exact
  lib the HTTP action runs: authentic signature accepted, wrong-secret /
  tampered-body / malformed rejected, inbound normalized, status-only acked,
  malformed envelope refused before any lead write.
- `convex/inbound.test.ts` (2 tests) — same inbound phone creates independent
  leads per tenant; re-delivery is idempotent (same lead returned); wa-phone
  resolution is accurate and null for unbound numbers.

## Notes / deviations

- `src/lib/whatsapp/{signature,webhook,templates}.ts` are retained: pure,
  Node-side, still covered by their own tests. The canonical parser/signature
  used in production now lives in `convex/lib/whatsapp.ts` (edge-safe) — the
  boundary tests prove that runtime rather than the Node variants.
- `WHATSAPP_*` / `MPESA_*` values remain empty everywhere — Sprint 06 sets the
  real creds on Convex; code is fail-closed until then.
- Next 16 warns `middleware.ts` is deprecated in favour of `proxy.ts`; Convex
  Auth's Next.js integration is used as-is for now (functional; migration is a
  housekeeping item, not a blocker).
- The JWT key material lives in gitignored `/.convex-tmp/` and on the Convex
  deployment only — never committed.