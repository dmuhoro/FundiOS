# Sprint 07 — Live Product + Operator Console

**Status:** COMPLETE
**Dates:** 2026-09-11
**Docs:** ADRs (constitution/architecture) · `docs/evidence/sprint-07/`
(`fundios-live-site-verified.md`, `closeout.md`) · `docs/briannaos-connector.md`

## Goal

Turn the deployed-but-invisible product into a live, branded FundiOS surface
and finish every outstanding Sprint 07 capability: dashboard KPIs + activity
feed, super admin onboarding/registry, the GMB launch checklist, and a
tested, contract-driven Brianna'sOS connector. Close the loop with docs,
evidence, a fully green gate, per-layer commits, a redeploy to the live URL,
and a tag + GitHub release.

## Build order delivered (each layer = its own commit)

1. **Layer 0 — FundiOS live site + branding.** `convex/lib/landing.ts`
   (self-contained HTML: product promise, capabilities, status, contact; doc
   links point to GitHub blob URLs), `convex/site.ts` (`serveLanding` HTTP
   action at `/`), route wired in `convex/http.ts`. Branding swept across
   layout/auth/README/login pages and HTML `<title>`s. Previously the live URL
   returned `no matching routes found`; now `GET /` returns a 200 FundiOS page.
2. **Layer 1 — Live-site evidence.** `docs/evidence/sprint-07/
   fundios-live-site-verified.md` records the redeploy + curl checks
   (landing 200; bare webhook GET 403-as-intended, not 404).
3. **Layer 2 — Sprint 07.1 Dashboard KPIs + activity feed.**
   `convex/dashboard.ts` — `overview` (8 KPIs) + `activityFeed` (merged,
   time-descending, masked phones); `overview/page.tsx` rewritten with KPI
   cards and a live feed (reactive Convex queries).
4. **Layer 3 — Sprint 07.2 Super admin.** `convex/tenants.ts` —
   `onboardTenant` (atomic tenant + operator, validated slug, no magic
   slugs/hand-over of an owned member) + `adminSummary`; `/dashboard/admin`
   onboarding form + tenant registry; nav link gated to `super_admin`.
5. **Layer 4 — Sprint 07.3 GMB checklist.** `gmbChecklists` table + `convex/gmb.ts`
   (tenant-scoped get/update, allowed-keys gate, INVALID_ARGS on unknown keys);
   `/dashboard/gmb` progress UI with 9 stable checklist items and per-item notes.
6. **Layer 5 — Sprint 07.4 Brianna'sOS connector.** `src/lib/briannaos/`
   contract v1 — 5 outbound / 4 inbound event catalogs, zod envelopes,
   HMAC-SHA256 sign + constant-time verify, injected-transport client,
   fail-closed `not_configured`; `docs/briannaos-connector.md` carries the
   hand-off checklist. Live wiring blocked on endpoint + secret (documented,
   not assumed).

## Proof

- `convex/dashboard.test.ts` (5) · `convex/tenants.test.ts` (8) ·
  `convex/gmb.test.ts` (5) · `__tests__/site/landing-runtime.test.ts` (4) ·
  `__tests__/briannaos/contract.test.ts` (6) + `client.test.ts` (10).
- Full gate: lint 0 problems · typecheck 0 errors · **110 passed / 21 files /
  0 todos** · build succeeds.
- Live: `npx convex dev --once` redeploy; `curl` → `200` FundiOS landing at
  `https://confident-weasel-372.eu-west-1.convex.site`; webhook route responds
  403 to a bare GET (intentional fail-closed) instead of 404.

## Boundary notes

- The Convex deplooyment slug (`confident-weasel-372`) cannot be renamed by
  Convex; the FundiOS brand lives in the page title, copy, and login/dashboard
  chrome. The URL at the "top" is the Convex-site URL, which is the landing
  surface; operators run the dashboard locally via `npm run dev:convex` and
  Convex Auth against this deployment.
- Brianna'sOS live round-trip is BLOCKED until `BRIANNAS_OS_ENDPOINT` +
  `BRIANNAS_OS_WEBHOOK_SECRET` and the agreed data-direction list arrive
  (Daniel action item). The connector is a tested socket — no claim of a live
  pipe. Same posture as WhatsApp/M-Pesa: fail-closed until creds land.
- `convex-test` has no HTTP-action runner, so the landing action is proven by
  pure-lib runtime tests + live curl evidence, not an in-repo HTTP harness.