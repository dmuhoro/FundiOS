# 2026-09-11 — Sprint 05 closeout: Live Auth + Supabase Removal

## Command / Step

Green gate across the repo after the full Sprint 05 layer set.

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Plus targeted verification of the WhatsApp boundary and the deployment-env step:

```bash
CONVEX_TMPDIR=/home/daniel-muhoro/workspace/projects/fundios/.convex-tmp npx convex codegen
npx convex env list   # JWT_PRIVATE_KEY + JWKS present on dev deployment
npx vitest run __tests__/whatsapp/ convex/inbound.test.ts
```

## Observed Result

- Convex codegen: regenerates `convex/_generated/` cleanly (bundling no longer
  trips on `convex/.convex-tmp/` after removing the stray key-gen script).
- Convex env: `JWT_PRIVATE_KEY` and `JWKS` set; `CONVEX_SITE_URL` is built-in
  (manual set rejected by Convex CLI as expected).
- Lint: 0 problems. Typecheck: 0 errors.
- Tests: **61 passed / 13 files / 0 todos**, including:
  - `convex/isolation.test.ts` — 7/7 (anonymous denied, per-garage scoping,
    cross-tenant denied, lead dedupe, deactivated member, integer money,
    scoped+idempotent audit)
  - `convex/inbound.test.ts` — 2/2 (cross-tenant lead independence + idempotent
    re-delivery; wa-phone resolution)
  - `__tests__/whatsapp/convex-runtime.test.ts` — 4/4 (Convex-runtime boundary:
    authentic signature accepted; wrong-secret/tamper/malformed rejected;
    inbound normalized; status-only acked; malformed refused pre-write)
  - legacy `src/lib/whatsapp` suites still green (signature 4, parse 4, templates 4)
- Build: succeeds. All routes dynamic — the Convex Auth provider tree cannot be
  statically prerendered under Next 16/Turbopack.
- Supabase: `rg -rn "supabase" src package.json convex` → no matches in code;
  deps removed from `package.json` + lockfile.

## Verdict

PASS

## Residual risk (honest)

- WhatsApp/M-Pesa/Brianna'sOS inputs are not yet configured anywhere — the
  webhook is verified and fail-closed but cannot deliver a live reply until
  Sprint 06 sets `WHATSAPP_*` creds on Convex.
- `middleware.ts` deprecation warning (Next 16) is tracked, not a blocker.
- JWT signing keys exist only on the dev deployment and gitignored
  `/.convex-tmp/` — not committed (verified via `git check-ignore`).