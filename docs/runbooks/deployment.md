# Runbook: Deployment & Local Verification

> Applies to Next.js 16 + Supabase. Status: local layer is green and verified;
> live hosting is BLOCKED until the Supabase project + env vars exist.

## Environment (names only — `.env.local.example` is the doc)

| Variable | Where used |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | client + server + proxy |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | client + server + proxy |
| `SUPABASE_SERVICE_ROLE_KEY` | server-only (super admin paths); never client |
| `WHATSAPP_PHONE_NUMBER_ID` / `WHATSAPP_ACCESS_TOKEN` / `WHATSAPP_VERIFY_TOKEN` / `WHATSAPP_APP_SECRET` | F6 WhatsApp |
| `MPESA_*` | M-Pesa (deferred) |

## Local — every session (the "is it green" loop)

```bash
npm ci                     # clean install from lockfile
npm run lint               # 0 problems
npm run typecheck          # 0 errors (authoritative)
npm test                   # vitest, green
npm run build              # production build, warning-free
```

Reproduce the schema layer (see `supabase-local.md` for the full DB runbook).

## Deploy to Vercel (when Supabase project exists)

1. Create the Supabase project; copy URL + anon key + service role key.
2. Set all env vars in Vercel project (never commit values).
3. `vercel deploy --prod` (or connect the GitHub repo; CI runs
   lint → typecheck → test → build first).
4. Verify: `GET /api/health` → `{ status: "ok", service: "FundiOS", ts }`.
5. Record the live claim in `docs/evidence/` with exact steps + outputs.

## Rollback

- Vercel: redeploy the previous release (vercel CLI or dashboard).
- Supabase: restore from the project's backup point; then re-run migrations
  forward (`npm run db:migrate`). Never `db:reset` on a live DB without an
  explicit human-go decision.