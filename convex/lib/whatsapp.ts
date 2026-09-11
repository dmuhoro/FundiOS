import { z } from "zod";

const textPayloadSchema = z.object({
  body: z.string().optional(),
});

const inboundMessageSchema = z
  .object({
    from: z.string(),
    id: z.string(),
    timestamp: z.string(),
    type: z.string().optional(),
    text: textPayloadSchema.optional(),
  })
  .passthrough();

const valueSchema = z.object({
  metadata: z
    .object({
      phone_number_id: z.string().optional(),
      display_phone_number: z.string().optional(),
    })
    .optional(),
  contacts: z
    .array(
      z.object({
        profile: z.object({ name: z.string().optional() }).optional(),
        wa_id: z.string().optional(),
      }),
    )
    .optional(),
  messages: z.array(inboundMessageSchema).optional(),
});

const changeSchema = z.object({
  field: z.string(),
  value: valueSchema,
});

const envelopeSchema = z.object({
  object: z.string(),
  entry: z.array(
    z.object({
      id: z.string().optional(),
      changes: z.array(changeSchema),
    }),
  ),
});

function parseEnvelope(payload: unknown) {
  const parsed = envelopeSchema.safeParse(payload);
  if (!parsed.success) {
    return { ok: false as const, reason: "malformed_envelope" };
  }

  const change = parsed.data.entry[0]?.changes[0];
  const message = change?.value.messages?.[0];
  if (!message) {
    return { ok: false as const, reason: "no_message" };
  }

  return {
    ok: true as const,
    waPhoneNumberId: change.value.metadata?.phone_number_id ?? "",
    fromPhone: message.from,
    messageId: message.id,
    timestamp: message.timestamp,
    text: message.text?.body ?? "",
    profileName: change.value.contacts?.[0]?.profile?.name ?? null,
  };
}

export async function verifyWhatsAppSignature(input: {
  secret: string | undefined;
  body: string;
  signature: string | undefined | null;
}): Promise<boolean> {
  const { secret, body, signature } = input;
  if (!secret || !signature) return false;
  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
    const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
    const expectedHex = Array.from(new Uint8Array(sig))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    const expected = `sha256=${expectedHex}`;
    if (expected.length !== signature.length) return false;
    let diff = 0;
    for (let i = 0; i < expected.length; i++) {
      diff |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
    }
    return diff === 0;
  } catch {
    return false;
  }
}

export type InboundWhatsAppMessage = {
  waPhoneNumberId: string;
  fromPhone: string;
  messageId: string;
  timestamp: string;
  text: string;
  profileName: string | null;
};

export function parseWhatsAppEnvelope(
  payload: unknown,
):
  | { ok: true; message: InboundWhatsAppMessage }
  | { ok: false; code: "malformed_envelope" | "no_message"; reason: string } {
  const result = parseEnvelope(payload);
  if (!result.ok)
    return {
      ok: false,
      code: result.reason as "malformed_envelope" | "no_message",
      reason: result.reason,
    };
  return {
    ok: true,
    message: {
      waPhoneNumberId: result.waPhoneNumberId,
      fromPhone: result.fromPhone,
      messageId: result.messageId,
      timestamp: result.timestamp,
      text: result.text,
      profileName: result.profileName,
    },
  };
}