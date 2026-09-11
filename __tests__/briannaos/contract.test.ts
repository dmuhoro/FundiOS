import { describe, expect, it } from "vitest";
import {
  BRIANNAS_OS_INBOUND_EVENTS,
  BRIANNAS_OS_OUTBOUND_EVENTS,
  inboundEventSchema,
  isInboundEvent,
  isOutboundEvent,
  outboundEventSchema,
} from "../../src/lib/briannaos/contract";

const outboundPayload = {
  eventId: "a8f90b2c-1111-4222-8333-000000000001",
  source: "fundios",
  tenantId: "tenant_quickstop",
  event: "lead.created",
  occurredAt: "2026-09-11T09:00:00.000Z",
  data: { phone: "+254700000000", name: "Nyaga" },
};

const inboundPayload = {
  eventId: "inbound-1",
  source: "briannas_os",
  event: "appointment.confirmed",
  occurredAt: "2026-09-11T09:05:00.000Z",
  data: { bookingRef: "BK-42" },
};

describe("Brianna'sOS contract", () => {
  it("documented event catalogs are non-empty and disjoint", () => {
    expect(BRIANNAS_OS_OUTBOUND_EVENTS.length).toBeGreaterThan(0);
    expect(BRIANNAS_OS_INBOUND_EVENTS.length).toBeGreaterThan(0);
    for (const out of BRIANNAS_OS_OUTBOUND_EVENTS) {
      expect(BRIANNAS_OS_INBOUND_EVENTS).not.toContain(out);
    }
  });

  it("validates a well-formed outbound event", () => {
    expect(isOutboundEvent(outboundPayload)).toBe(true);
    expect(outboundEventSchema.safeParse(outboundPayload).success).toBe(true);
  });

  it("rejects outbound events with the wrong source or name", () => {
    expect(isOutboundEvent({ ...outboundPayload, source: "briannas_os" })).toBe(false);
    expect(isOutboundEvent({ ...outboundPayload, event: "appointment.confirmed" })).toBe(false);
    expect(isOutboundEvent({ ...outboundPayload, occurredAt: "not-a-date" })).toBe(false);
  });

  it("validates a well-formed inbound event", () => {
    expect(isInboundEvent(inboundPayload)).toBe(true);
    expect(inboundEventSchema.safeParse(inboundPayload).success).toBe(true);
  });

  it("rejects inbound events from non-Brianna'sOS sources and unknown names", () => {
    expect(isInboundEvent({ ...inboundPayload, source: "fundios" })).toBe(false);
    expect(isInboundEvent({ ...inboundPayload, event: "campaign.fired" })).toBe(false);
  });

  it("requires eventId and tenantId on outbound", () => {
    expect(isOutboundEvent({ ...outboundPayload, eventId: "" })).toBe(false);
    expect(isOutboundEvent({ ...outboundPayload, tenantId: "" })).toBe(false);
  });
});