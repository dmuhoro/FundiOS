import { z } from "zod";

/**
 * Brianna'sOS ←→ FundiOS integration contract.
 *
 * This is the single source of truth for the data contract between FundiOS
 * (the tenant OS) and Brianna'sOS (the operator backend). It is versioned and
 * schema-validated on every boundary crossing — the connector ships before any
 * intelligence is built on the pipe ("connectors before intelligence").
 */

export const BRIANNAS_OS_API_NAME = "briannas_os";
export const BRIANNAS_OS_EVENTS_PATH = "/events";
export const BRIANNAS_OS_SIGNATURE_HEADER = "X-BriannasOS-Signature";

export const BRIANNAS_OS_CONFIG_KEYS = {
  endpoint: "BRIANNAS_OS_ENDPOINT",
  secret: "BRIANNAS_OS_WEBHOOK_SECRET",
} as const;

/** FundiOS → Brianna'sOS (outbound events the OS publishes). */
export const BRIANNAS_OS_OUTBOUND_EVENTS = [
  "lead.created",
  "lead.wa_opted_in",
  "service.completed",
  "reminder.sent",
  "campaign.fired",
] as const;

/** Brianna'sOS → FundiOS (inbound events the OS consumes via webhook). */
export const BRIANNAS_OS_INBOUND_EVENTS = [
  "customer.response",
  "review.received",
  "appointment.confirmed",
  "job.scheduled",
] as const;

export const outboundEventSchema = z.object({
  eventId: z.string().min(1),
  source: z.literal("fundios"),
  tenantId: z.string().min(1),
  event: z.enum(BRIANNAS_OS_OUTBOUND_EVENTS),
  occurredAt: z.string().datetime(),
  data: z.record(z.string(), z.unknown()),
});

export const inboundEventSchema = z.object({
  eventId: z.string().min(1),
  source: z.literal("briannas_os"),
  event: z.enum(BRIANNAS_OS_INBOUND_EVENTS),
  occurredAt: z.string().datetime(),
  data: z.record(z.string(), z.unknown()),
});

export type OutboundEvent = z.infer<typeof outboundEventSchema>;
export type InboundEvent = z.infer<typeof inboundEventSchema>;
export type OutboundEventName = (typeof BRIANNAS_OS_OUTBOUND_EVENTS)[number];
export type InboundEventName = (typeof BRIANNAS_OS_INBOUND_EVENTS)[number];

export function isOutboundEvent(value: unknown): value is OutboundEvent {
  return outboundEventSchema.safeParse(value).success;
}

export function isInboundEvent(value: unknown): value is InboundEvent {
  return inboundEventSchema.safeParse(value).success;
}