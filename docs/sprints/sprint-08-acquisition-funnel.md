# Sprint 08 — Acquisition Funnel: UTM-Attributed Capture Landing + Marketing Console

**Status:** COMPLETE
**Dates:** 2026-09-11
**Docs:** ADRs (constitution/architecture) · `docs/evidence/sprint-08/` (`closeout.md`)
· `docs/quickstop/field-audit.md` · `docs/strategy/founder-playbook.md`

## Goal

Turn the live product into an acquisition machine: give every garage a
UTM-attributed capture landing page as the front door for Facebook/Instagram/
TikTok/Google campaigns, route every submission into a tenant-scoped lead with
campaign attribution, and give the owner a marketing console that answers
"which source and which campaign bring the leads." Executed against the
field-audit template and founder playbook written in the same sprint.

## Build order delivered (each layer = its own commit)

1. **Strategy + field-intel layer (docs).** `docs/quickstop/field-audit.md` —
   Quickstop field-audit interview + workflow walk and numbers template (garage
   profile, workflows, leads-by-source, marketing spend, AI/Cloud checklist,
   top-5 inefficiencies, baseline KPIs). `docs/strategy/founder-playbook.md` —
   wedge thesis, software-enabled consultancy pricing tiers, SMMA cadence,
   four-part moat, agent doctrine, gated Alphabet portfolio
   (EasyTutor/Daftari/DentalOS/ClinicOS/AfroPay).
2. **Layer 3 — Attribution pipeline.** `convex/schema.ts` — `leads` gains
   `campaignKey` (optional `v.string()`); `src/lib/constants.ts` `LEAD_SOURCES`
   extended with `instagram` + `tiktok` (8 total). `convex/leads.ts` —
   `createInbound` widened source union, new args `campaignKey`, `message`,
   `trigger` (`whatsapp_inbound` | `campaign_fired`), audit keyed on trigger.
   `convex/tenants.ts` — `getBySlug` query (trim/lowecase slug, `by_slug` index).
   `convex/lib/leadCapture.ts` — shared `createInboundLead` (dedupe by
   normalized phone within tenant, audited, idempotency key from trigger).
   `convex/campaigns.ts` — `captureLandingLead` mutation (slug regex, Kenyan
   phone validation, unknown slug → FORBIDDEN, fail-closed). `convex/campaignHttp.ts`
   — `serveCapture` HTTP action at `/c/<slug>` (GET form / POST parse /
   malformed body → 400 / error-code mapping → 404/401/400 / success page).
   `convex/lib/campaign.ts` — pure edge-safe lib: `parseCaptureForm`, `resolveUtmCampaign`,
   `buildCapturePage`, `buildCaptureSuccessPage`, `CAPTURE_FIELD_LIMITS`.
   Routes wired in `convex/http.ts` (pathPrefix `/c/`, GET + POST).
3. **Layer 3 — Dashboard + Marketing console.** `convex/dashboard.ts` —
   `acquisition` query (leads by_source/by_campaign, converted + conversion
   rate, untracked count, recent 8 with masked phones). `src/app/(dashboard)/marketing/page.tsx`
   — KPI cards, source/campaign tables, recent leads. `dashboard-nav.tsx` —
   Marketing link gated on tenant membership.

## Proof

- `convex/campaigns.test.ts` (7) — attributed capture under resolved tenant,
  idempotent dedupe, phone normalization, fail-closed (unknown slug, bad slug,
  non-Kenyan phone), cross-tenant isolation.
- `convex/dashboard.test.ts` (6) — acquisition e2e: campaign-landing capture
  appears in owner funnel w/ campaign + source attribution and masked phone.
- `__tests__/campaign/capture-runtime.test.ts` (10) — `parseCaptureForm`
  accept/reject (oversized fields, unknown source), `resolveUtmCampaign`
  mapping, capture-page HTML escaping.
- Full gate: lint 0 problems · typecheck 0 errors · **128 passed / 23 files /
  0 todos** · build succeeds.
- Live prep: routes deployed via `npx convex dev --once`; landing page endpoints
  block updated with `/c/<slug>`; live curl evidence recorded in
  `docs/evidence/sprint-08/closeout.md`.

## Boundary notes

- `convex-test` has no HTTP-action runner, so `serveCapture` is proven by the
  pure-lib runtime tests + live fail-closed curl evidence (regex 404, unknown
  campaign 400, malformed 400). The live 200 happy path is test-proven in-repo
  but not claimed against the dev URL until a garage is onboarded (the dev
  deployment currently has no tenants).
- A module that exports `mutation`/`query` cannot also import `./_generated/api`
  and call back into itself — that self-referential type enum poisons the whole
  generated `api` type. The capture landing mutation therefore uses the shared
  `createInboundLead` helper and the HTTP action lives in its own module
  (`campaignHttp.ts`), mirroring the `whatsapp.ts` pattern.
- Live ad spend / pixel / lead-form connections remain credential-gated
  (Telegram/Facebook app access) — the funnel front door is live and tested;
  paid-traffic plumbing is a documented next step, not claimed.