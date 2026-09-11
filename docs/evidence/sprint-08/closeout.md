# 2026-09-11 — Sprint 08 Closeout (Acquisition Funnel)

## Command / Step

Full gate:
```
npm run lint          # eslint
npm run typecheck     # tsc --noEmit
npm test              # vitest run
npm run build         # next build
npx convex dev --once # redeploy to dev deployment (confident-weasel-372)
```

Live checks against `https://confident-weasel-372.eu-west-1.convex.site`:
```
curl -sS https://confident-weasel-372.eu-west-1.convex.site/            # landing
curl -sS -o /dev/null -w '%{http_code}\n' https://confident-weasel-372.eu-west-1.convex.site/c/BAD_SLUG
curl -sS -X POST -H 'Content-Type: application/x-www-form-urlencoded' \
  --data 'phone=0712345678&name=John' \
  https://confident-weasel-372.eu-west-1.convex.site/c/quickstop
curl -sS -X POST -H 'Content-Type: application/json' \
  --data '{"name":"John"}' \
  https://confident-weasel-372.eu-west-1.convex.site/c/quickstop
```

## Observed Result

- `npm run lint` — 0 problems.
- `npm run typecheck` — 0 errors.
- `npm test` — **128 passed / 23 files / 0 todos**, no failures.
- `npm run build` — production build succeeds.
- Targeted suites: `convex/campaigns.test.ts` (7) · `convex/dashboard.test.ts`
  (6, incl. acquisition e2e) · `__tests__/campaign/capture-runtime.test.ts` (10).
- Git: two layered commits on `main` (`4350fcf` capture pipeline,
  `c537433` marketing console) + docs commits `f0cd123` (field audit) and
  `4c6e590` (founder playbook) + closeout; tag `v0.7.0` + GitHub release
  created; branch pushed.

## Live curl transcript

```
$ curl -sS -o /dev/null -w '%{http_code}\n' https://confident-weasel-372.eu-west-1.convex.site/   # landing
200
$ curl -sS https://confident-weasel-372.eu-west-1.convex.site/c/BAD_SLUG
Not found                                                                      # 404 — regex gate (route is live)
$ curl -sS -X POST -H 'Content-Type: application/x-www-form-urlencoded' \
    --data 'phone=0712345678&name=John' \
    https://confident-weasel-372.eu-west-1.convex.site/c/quickstop
{"error":"FORBIDDEN","message":"Unknown campaign"}                              # 400 — handler ran end-to-end, fail-closed (no tenant "quickstop" yet)
$ curl -sS -X POST -H 'Content-Type: application/json' \
    --data '{"name":"John"}' \
    https://confident-weasel-372.eu-west-1.convex.site/c/quickstop
{"error":"invalid_capture","message":"Invalid input: expected string, received undefined"}   # 400 — parseCaptureForm guarded
```

## Verdict

PASS — the capture route is deployed and verified **live fail-closed**: the
regex gate rejects `BAD_SLUG` (404), the handler executes end-to-end on a valid
slug against an unknown campaign (structured 400 `Unknown campaign`), and
malformed form/JSON payloads are rejected by `parseCaptureForm`. The **200
happy path** (capture form render + success page) is proven in-repo by
`convex/campaigns.test.ts` (7) + `__tests__/campaign/capture-runtime.test.ts`
(10) + the acquisition e2e in `convex/dashboard.test.ts`, and is ready the
moment a garage is onboarded on the dev deployment (the dev data set is
currently empty — no tenant exists yet, so no 200 was claimed against the
live URL). Fail-closed = proven; live happy-path render = ready and tested,
not faked. Known next step: onboard the Quickstop tenant (UI or super-admin
path) to complete the live round-trip.