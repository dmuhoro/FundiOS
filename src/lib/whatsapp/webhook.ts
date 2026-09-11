import { z } from "zod";

const contactProfileSchema = z.object({
  name: z.string().optional(),
});

const contactSchema = z.object({
  profile: contactProfileSchema.optional(),
  wa_id: z.string().optional(),
});

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
  messaging_product: z.string().optional(),
  metadata: z
    .object({
      phone_number_id: z.string().optional(),
      display_phone_number: z.string().optional(),
    })
    .optional(),
  contacts: z.array(contactSchema).optional(),
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

export interface InboundMessage {
  waPhoneNumberId: string;
  fromPhone: string;
  messageId: string;
  timestamp: string;
  messageType: string;
  text: string;
  profileName: string | null;
}

export type WebhookParseResult =
  | { ok: true; message: InboundMessage }
  | { ok: false; code: "malformed_envelope"; reason: string }
  | { ok: false; code: "no_message"; reason: string };

export function parseWebhook(payload: unknown): WebhookParseResult {
  const parsed = envelopeSchema.safeParse(payload);
  if (!parsed.success) {
    return {
      ok: false,
      code: "malformed_envelope",
      reason: parsed.error.message,
    };
  }

  const change = parsed.data.entry[0]?.changes[0];
  const message = change?.value.messages?.[0];

  if (!message) {
    return {
      ok: false,
      code: "no_message",
      reason: "Webhook event does not contain an inbound message",
    };
  }

  const metadata = change?.value.metadata;
  const contact = change?.value.contacts?.[0];

  return {
    ok: true,
    message: {
      waPhoneNumberId: metadata?.phone_number_id ?? "",
      fromPhone: message.from,
      messageId: message.id,
      timestamp: message.timestamp,
      messageType: message.type ?? "unknown",
      text: message.text?.body ?? "",
      profileName: contact?.profile?.name ?? null,
    },
  };
}

export const inboundMessageType = z.enum(["unknown", "text"]);
export type InboundMessageType = z.infer<typeof inboundMessageType>;

export const webhookEnvelopeSchema = envelopeSchema;
export type WebhookEnvelope = z.infer<typeof envelopeSchema>;