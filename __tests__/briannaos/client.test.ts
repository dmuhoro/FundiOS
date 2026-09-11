import { describe, expect, it } from "vitest";
import {
  BriannasOSEnvelopeError,
  buildOutboundEvent,
  parseInboundEvent,
  sendOutboundEvent,
  verifyInboundSignature,
  type Transport,
} from "../../src/lib/briannaos/client";
import { BRIANNAS_OS_EVENTS_PATH } from "../../src/lib/briannaos/contract";
import { signPayload } from "../../src/lib/briannaos/signature";

const SECRET = "test-briannas-os-secret";

function fakeTransport(status: number, body?: string): Transport {
  return async () => new Response(body ?? "", { status });
}

describe("Brianna'sOS outbound client", () => {
  it("fail-closed: not_configured when endpoint is missing", async () => {
    const event = buildOutboundEvent({ tenantId: "t1", event: "lead.created", data: {} });
    const result = await sendOutboundEvent({ endpoint: undefined, secret: SECRET, event });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("not_configured");
  });

  it("fail-closed: not_configured when secret is missing", async () => {
    const event = buildOutboundEvent({ tenantId: "t1", event: "lead.created", data: {} });
    const result = await sendOutboundEvent({ endpoint: "https://briannas.example", secret: undefined, event });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("not_configured");
  });

  it("posts a signed envelope to <endpoint>/events and returns ok", async () => {
    let capturedUrl: string | undefined;
    let capturedInit: RequestInit | undefined;
    const t: Transport = async (url, init) => {
      capturedUrl = url;
      capturedInit = init;
      return new Response(JSON.stringify({ accepted: true }), { status: 202 });
    };
    const event = buildOutboundEvent({ tenantId: "t1", event: "reminder.sent", data: { serviceId: "s1" } });
    const result = await sendOutboundEvent({ endpoint: "https://briannas.example/", secret: SECRET, event, transport: t });
    expect(result).toEqual({ ok: true, status: 202 });
    expect(capturedUrl).toBe(`https://briannas.example${BRIANNAS_OS_EVENTS_PATH}`);

    const body = capturedInit?.body as string;
    const parsed = JSON.parse(body);
    expect(parsed.event).toBe("reminder.sent");
    expect(parsed.source).toBe("fundios");
    expect(parsed.tenantId).toBe("t1");

    const headers = new Headers(capturedInit?.headers);
    const expectedSignature = signPayload({ secret: SECRET, body });
    expect(headers.get("X-BriannasOS-Signature")).toBe(expectedSignature);
  });

  it("maps a non-2xx upstream to http_<status>", async () => {
    const event = buildOutboundEvent({ tenantId: "t1", event: "lead.created", data: {} });
    const result = await sendOutboundEvent({ endpoint: "https://briannas.example", secret: SECRET, event, transport: fakeTransport(500) });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("http_500");
  });

  it("maps a transport exception to transport_error", async () => {
    const event = buildOutboundEvent({ tenantId: "t1", event: "lead.created", data: {} });
    const t: Transport = async () => {
      throw new Error("boom");
    };
    const result = await sendOutboundEvent({ endpoint: "https://briannas.example", secret: SECRET, event, transport: t });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("transport_error");
  });

  it("rejects an event that violates the contract (invalid_payload)", async () => {
    const event = buildOutboundEvent({ tenantId: "t1", event: "lead.created", data: {} });
    const tampered: typeof event = { ...event, source: "briannas_os" as "fundios" };
    const result = await sendOutboundEvent({ endpoint: "https://briannas.example", secret: SECRET, event: tampered, transport: fakeTransport(200) });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("invalid_payload");
  });
});

describe("Brianna'sOS inbound webhook", () => {
  it("verifies a correctly signed payload and rejects tampering", () => {
    const body = JSON.stringify({ ping: true });
    const signature = signPayload({ secret: SECRET, body });
    expect(verifyInboundSignature({ secret: SECRET, body, signature })).toBe(true);
    expect(verifyInboundSignature({ secret: SECRET, body: `${body}x`, signature })).toBe(false);
    expect(verifyInboundSignature({ secret: undefined, body, signature })).toBe(false);
    expect(verifyInboundSignature({ secret: SECRET, body, signature: undefined })).toBe(false);
  });

  it("parses a valid inbound event", () => {
    const event = parseInboundEvent({
      eventId: "inbound-1",
      source: "briannas_os",
      event: "review.received",
      occurredAt: "2026-09-11T09:05:00.000Z",
      data: { stars: 5 },
    });
    expect(event.event).toBe("review.received");
    expect(event.data.stars).toBe(5);
  });

  it("throws on an invalid inbound envelope (fail closed)", () => {
    expect(() => parseInboundEvent({ event: "unknown" })).toThrow(BriannasOSEnvelopeError);
    expect(() => parseInboundEvent({ source: "fundios", event: "review.received" })).toThrow(BriannasOSEnvelopeError);
  });

  it("buildOutboundEvent produces a contract-valid event with uuid", async () => {
    const event = buildOutboundEvent({ tenantId: "t1", event: "campaign.fired", data: { campaignId: "c1" } });
    expect(event.eventId).toMatch(/^[0-9a-f-]{36}$/);
    expect(new Date(event.occurredAt).toISOString()).toBe(event.occurredAt);
    const result = await sendOutboundEvent({ endpoint: "https://briannas.example", secret: SECRET, event, transport: fakeTransport(200) });
    expect(result).toEqual({ ok: true, status: 200 });
  });
});