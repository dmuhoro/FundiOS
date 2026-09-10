# Runbook: WhatsApp Webhook — Setup & Verification

> Meta WhatsApp Business Cloud API. GET verify handshake is implemented
> (`src/app/api/whatsapp/webhook/route.ts`); the POST handler is F6 (planned).
> Live credentials are BLOCKED until Daniel provides them.

## 1. Meta app → webhook subscription

1. In Meta App settings, add the Webhooks product to the app.
2. Subscribe to the **messages** field for the app or phone number.
3. Callback URL: `https://<host>/api/whatsapp/webhook`.
4. Verify token: any string you also set as `WHATSAPP_VERIFY_TOKEN`.

## 2. GET verification (implemented)

Meta calls `GET /api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=…&hub.challenge=…`.
The route echoes `hub.challenge` with 200 only when the token matches. Any
mismatch → 403 + `logger.warn`.

Quick local check:

```bash
curl -i "http://localhost:3000/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=YOUR_TOKEN&hub.challenge=12345"
# expect: HTTP 200, body "12345"
```

## 3. POST inbound — plan for F6 (NOT yet implemented)

The POST handler currently returns 200 without processing. When implementing:

1. Verify signature BEFORE parsing:
   `X-Hub-Signature-256 = HMAC-SHA256(WHATSAPP_APP_SECRET, raw body)`,
   compared **constant-time**. Unverified → 403 + `automation_logs` row
   (never silent).
2. Parse `entry[].changes[].value.messages[]`.
3. Resolve the garage by phone-number id — NEVER from caller-supplied input.
4. Known customer → "welcome back" reply; unknown → create lead.
5. Enqueue reply through the notification queue (idempotency key), audit to
   `automation_logs`, surface owner event in real time.
6. Respond 200 fast (< 500ms); heavy work stays queued (PRD § NFR).

## 4. P0 gate (before exporting any Kay's queue module)

- `__tests__/whatsapp/cross-tenant-queue.test.ts` must pass against the real
  queue path: a job for garage A cannot be processed in garage B's context;
  mismatch → `tenant_mismatch` logged to `automation_logs`.
- No test may be weakened to pass (Constitution Art. VI).

## 5. Live verification (blocked)

When credentials exist, record in `docs/evidence/`:
- Date + exact curl / manual step (send a message from a real phone)
- Observed: inbound capture, auto-reply delivery, automation_logs rows, status.