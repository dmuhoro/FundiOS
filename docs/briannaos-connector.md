# Brianna'sOS ↔ FundiOS Connector (contract v1)

> Status: **CODE – awaiting endpoint + credentials.** The connector layer is
> shipped, tested and fail-closed; live wiring is blocked until Brianna'sOS
> provides the endpoint URL, webhook secret, and the agreed data-direction list.
> (Constitution Art. I — a connector that ships before the pipe is real is a
> socket, not a claim.)

## Why connector-first

"Connectors before intelligence": reliable pipes beat cleverness on top. This
layer defines the exact bytes both sides may exchange, signs every request, and
rejects anything that does not match the schema — before any business logic
runs.

## Data directions

| Direction | Event namespace | Purpose | Status |
|-----------|-----------------|---------|--------|
| FundiOS → Brianna'sOS | `lead.created`, `lead.wa_opted_in`, `service.completed`, `reminder.sent`, `campaign.fired` | OS publishes tenant activity | Implemented (client) — live once credentials set |
| Brianna'sOS → FundiOS | `customer.response`, `review.received`, `appointment.confirmed`, `job.scheduled` | Operator events hydrate the tenant CRM/automation | Implemented (webhook validator) — route awaits spec |

Canonical reference (types + zod schemas): `src/lib/briannaos/contract.ts`.

## Envelope shape (both directions)

```jsonc
{
  "eventId": "a8f90b2c-…",              // UUID (outbound) / opaque (inbound)
  "source": "fundios" | "briannas_os",
  "tenantId": "tenant_quickstop",        // outbound only
  "event": "lead.created",               // from the catalogs above
  "occurredAt": "2026-09-11T09:00:00.000Z",
  "data": { }                            // event-specific payload
}
```

## Transport & signing

- **Outbound:** `POST {BRIANNAS_OS_ENDPOINT}/events`, `Content-Type:
  application/json`, header `X-BriannasOS-Signature:
  sha256=<hex-HMAC-SHA256-of-raw-body>` with `BRIANNAS_OS_WEBHOOK_SECRET`.
- **Inbound (Brianna'sOS → FundiOS webhook):** the same signature scheme is
  verified before the payload is parsed (constant-time compare). Unsigned or
  mismatched requests are refused — fail closed.
- **Config keys (env):** `BRIANNAS_OS_ENDPOINT`, `BRIANNAS_OS_WEBHOOK_SECRET`.
  Names only — see `.env.local.example`. Missing credentials ⇒ the client
  returns `not_configured`; no silent drop, no default endpoint.

## Failure codes

`not_configured` · `invalid_payload` · `http_<status>` · `transport_error`

## Verification

- `__tests__/briannaos/contract.test.ts` — schema accepts well-formed
  outbound/inbound events and rejects cross-source, unknown-name, invalid
  datetime and empty-id payloads; catalogs are disjoint.
- `__tests__/briannaos/client.test.ts` — fail-closed on missing endpoint or
  secret; correct `…/events` URL + signed header; `http_500` mapping;
  `transport_error` on thrown transport; contract-violating events refused
  before any request; inbound signature verify (valid/tampered/missing);
  envelope parse throws on invalid input.

## Hand-off checklist (to go live)

1. Brianna'sOS provides endpoint URL + webhook secret.
2. Confirm the data-direction list and both event catalogs.
3. Configure `BRIANNAS_OS_ENDPOINT` + `BRIANNAS_OS_WEBHOOK_SECRET` on the
   Convex deployment.
4. Wire `sendOutboundEvent` into `convex/whatsapp.ts` /
   `convex/reminders.ts` via an audited, idempotency-keyed path
   (`automation_logs`), and expose the inbound webhook route.
5. Re-run the live round-trip evidence.