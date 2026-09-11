# 2026-09-11 — FundiOS live site: branding fix + route verification

## Command / Step

Deploy the green build (Layer 0) to the live Convex deployment, then probe the
public site:

```bash
npx convex dev --once     # deploy to dev deployment (confident-weasel-372)
curl -s -o /dev/null -w "landing HTTP %{http_code}\n" \
  https://confident-weasel-372.eu-west-1.convex.site/
curl -s https://confident-weasel-372.eu-west-1.convex.site/ | \
  rg -o "<title>[^<]+</title>|Service live|Quickstop Garage" | head -5
curl -s -o /dev/null -w "webhook GET HTTP %{http_code}\n" \
  "https://confident-weasel-372.eu-west-1.convex.site/api/whatsapp/webhook"
```

## Observed Result

- `GET /` → **HTTP 200**, HTML document titled `FundiOS — Marketing Operations OS
  for Automobile Garages`, badges `Service live` + `Quickstop Garage` present.
- Root route now serves the branded product (Convex previously returned
  `no matching routes found` for `/`).
- `GET /api/whatsapp/webhook` → **HTTP 403** (the app's explicit verification
  rejection for a missing `hub.mode`/`verify_token`, not a 404) — the webhook
  route is live and reachable.
- Local suite (before deploy): 76 passed / 16 files / 0 todos — lint 0
  problems, typecheck 0 errors, build green.

## Verdict

PASS — the public live URL now serves a FundiOS-branded product page; the
automation endpoint remains reachable.