import { v } from "convex/values";

const INBOUND_MESSAGE_SCHEMA = v.object({
  from: v.string(),
  id: v.string(),
  timestamp: v.string(),
  type: v.optional(v.string()),
  text: v.optional(v.object({ body: v.optional(v.string()) })),
});

function parseEnvelope(payload: unknown) {
  if (
    typeof payload !== "object" ||
    payload === null ||
    !("entry" in payload) ||
    !Array.isArray((payload as Record<string, unknown>).entry)
  ) {
    return { ok: false as const, reason: "malformed_envelope" };
  }

  const entry = (payload as Record<string, unknown>).entry as Array<{
    changes?: Array<{
      value?: {
        metadata?: { phone_number_id?: string };
        messages?: Array<{
          from: string;
          id: string;
          timestamp: string;
          type?: string;
          text?: { body?: string };
        }>;
      };
    }>;
  }>;

  const change = entry[0]?.changes?.[0];
  const message = change?.value?.messages?.[0];
  if (!message) {
    return { ok: false as const, reason: "no_message" };
  }

  return {
    ok: true as const,
    waPhoneNumberId: change.value?.metadata?.phone_number_id ?? "",
    fromPhone: message.from,
    messageId: message.id,
    timestamp: message.timestamp,
    text: message.text?.body ?? "",
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
    // Constant-time comparison
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
};

export function parseWhatsAppEnvelope(
  payload: unknown,
):
  | { ok: true; message: InboundWhatsAppMessage }
  | { ok: false; code: "malformed_envelope" | "no_message"; reason: string } {
  const result = parseEnvelope(payload);
  if (!result.ok) return { ok: false, code: result.reason as "malformed_envelope" | "no_message", reason: result.reason };
  return {
    ok: true,
    message: {
      waPhoneNumberId: result.waPhoneNumberId,
      fromPhone: result.fromPhone,
      messageId: result.messageId,
      timestamp: result.timestamp,
      text: result.text,
    },
  };
}

export function buildLeadAutoReply(input: {
  garageName: string;
  name?: string | null;
  language?: "en" | "sw";
}): string {
  const isSw = input.language === "sw";
  const displayName = input.name?.trim() || null;
  if (isSw) {
    const greet = displayName ? `Hujambo ${displayName}!` : "Hujambo!";
    return `${greet} Asante kwa kuwasiliana na ${input.garageName}. Mshauri wetu atakujibu ndani ya saa 2. Ili tusaidie haraka, tafadhali tuambie make, modeli na mwaka wa gari lako.`;
  }
  const greet = displayName ? `Hi ${displayName}!` : "Hi there!";
  return `${greet} Thanks for reaching ${input.garageName}. An advisor will reply within 2 hours. To help you faster, share your vehicle's make, model, and year.`;
}
