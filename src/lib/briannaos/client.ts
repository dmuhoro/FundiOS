import crypto from "node:crypto";
import {
  BRIANNAS_OS_EVENTS_PATH,
  BRIANNAS_OS_SIGNATURE_HEADER,
  inboundEventSchema,
  outboundEventSchema,
  type OutboundEvent,
  type OutboundEventName,
  type InboundEvent,
} from "./contract";
import { signPayload, verifySignature } from "./signature";

export type Transport = (
  url: string,
  init: RequestInit,
) => Promise<Response>;

export class BriannasOSEnvelopeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BriannasOSEnvelopeError";
  }
}

export function buildOutboundEvent(input: {
  tenantId: string;
  event: OutboundEventName;
  data: Record<string, unknown>;
  now?: Date;
}): OutboundEvent {
  return {
    eventId: crypto.randomUUID(),
    source: "fundios",
    tenantId: input.tenantId,
    event: input.event,
    occurredAt: (input.now ?? new Date()).toISOString(),
    data: input.data,
  };
}

export function parseInboundEvent(payload: unknown): InboundEvent {
  const parsed = inboundEventSchema.safeParse(payload);
  if (!parsed.success) {
    throw new BriannasOSEnvelopeError(
      `Invalid Brianna'sOS envelope: ${parsed.error.message}`,
    );
  }
  return parsed.data;
}

export function verifyInboundSignature(input: {
  secret: string | undefined;
  body: string;
  signature: string | undefined | null;
}): boolean {
  return verifySignature(input);
}

export async function sendOutboundEvent(input: {
  endpoint: string | undefined;
  secret: string | undefined;
  event: OutboundEvent;
  transport?: Transport;
}): Promise<{ ok: true; status: number } | { ok: false; code: string }> {
  const { endpoint, secret, event, transport } = input;
  if (!endpoint || !secret) {
    return { ok: false, code: "not_configured" };
  }
  const parsed = outboundEventSchema.safeParse(event);
  if (!parsed.success) {
    return { ok: false, code: "invalid_payload" };
  }

  const body = JSON.stringify(parsed.data);
  const signature = signPayload({ secret, body });
  const base = endpoint.replace(/\/$/, "");
  const t = transport ?? fetch;
  let res: Response;
  try {
    res = await t(`${base}${BRIANNAS_OS_EVENTS_PATH}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        [BRIANNAS_OS_SIGNATURE_HEADER]: signature,
      },
      body,
    });
  } catch {
    return { ok: false, code: "transport_error" };
  }
  if (!res.ok) {
    return { ok: false, code: `http_${res.status}` };
  }
  return { ok: true, status: res.status };
}