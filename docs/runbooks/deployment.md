# Runbook: Deployment & Local Verification

> Applies to Next.js 16 + Convex (ADR-002). Local layer is green and verified;
> live hosting is via Convex Deployment (full-stack hosting serves the Next.js
> app — no Vercel). Supabase references remain only for legacy migrations.

## Environment (names only — `.env.local.example` is the doc)

| Variable | Where used |
|---|---|
| `NEXT_PUBLIC_CONVEX_URL` | client hooks + server (Convex backend URL, `…convex.cloud`) |
| `CONVEX_SITE_URL` | Convex hosting base (`…convex.site`); custom domain swaps in |
| `CONVEX_CLI_ACCESS_TOKEN` | CI / automation deploys (project → Settings → Access tokens) |
| `CONVEX_DEPLOYMENT` | CI automation: `https://…eu-west-1.convex.cloud` |
| `ADMIN_KEY` | test/drill super-admin key (in-process only) |
| `WHATSAPP_PHONE_NUMBER_ID` / `WHATSAPP_ACCESS_TOKEN` / `WHATSAPP_VERIFY_TOKEN` / `WHATSAPP_APP_SECRET` | F6 WhatsApp |
| `MPESA_*` | M-Pesa (deferred from pilot) |
| `NEXT_PUBLIC_SUPABASE_URL` / `ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` | legacy — removed in Sprint 05 |

Server-side secrets (`WHATSAPP_*`, `MPESA_*`, `CONVEX_CLI_ACCESS_TOKEN`) go through
`npx convex env set <NAME>` (never client/public). `NEXT_PUBLIC_*` vars are public
by design and also set via `npx convex env set`.

## Local — every session (the "is it green" loop)

```bash
npm ci                     # clean install from lockfile
npm run lint               # 0 problems
npm run typecheck          # 0 errors (authoritative)
npm test                   # vitest, green (includes convex-test in-memory isolation)
npm run build              # production build, warning-free
npm run convex:codegen     # regenerate _generated bindings after schema changes
```

## Deploy to Convex (replaces Vercel — full-stack hosting)

1. CLI session present: `npx convex whoami`-style checks run clean, project
   linked (`convex.json` present / deployment chosen on `npx convex dev`).
2. Set env: `npx convex env set WHATSAPP_PHONE_NUMBER_ID …` etc.
3. `npx convex deploy` — builds the Next.js app AND deploys all Convex functions
   to the backend; frontend is served from the site URL. Add a custom domain in
   project settings when ready.
4. Verify: `GET https://<site>/api/health` → `{ status: "ok", service: "FundiOS", ts }`,
   dashboard mounts with live data, WhatsApp webhook verification succeeds.
5. Record the live claim in `docs/evidence/` with exact steps + outputs.

## CI

`.github/workflows/ci.yml` runs lint → typecheck → test → build on every merge.
Add a deploy job on main using `CONVEX_CLI_ACCESS_TOKEN` + `CONVEX_DEPLOYMENT`
secrets when the first live deploy is cut.

## Rollback

- Code: `git revert` the targeted commits, then `npx convex deploy` the revert.
- Data: restore the deployment from Convex Deployment's snapshot feature
  (dashboard), or replay deterministic migrations forward. Never wipe a live
  database without an explicit human-go decision.