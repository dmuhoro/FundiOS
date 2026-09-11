import { describe, expect, it } from "vitest";
import { parseWebhook } from "@/lib/whatsapp/webhook";

const WA_NUMBER_ID = "105431206008513";
const SENDER = "254712345678";

function buildEnvelope(overrides: Record<string, unknown> = {}) {
  return {
    object: "whatsapp_business_account",
    entry: [
      {
        id: "424564758443304",
        changes: [
          {
            field: "messages",
            value: {
              messaging_product: "whatsapp",
              metadata: {
                display_phone_number: "16505551111",
                phone_number_id: WA_NUMBER_ID,
              },
              contacts: [
                {
                  profile: { name: "Nyaga M." },
                  wa_id: SENDER,
                },
              ],
              messages: [
                {
                  from: SENDER,
                  id: "wamid.HBgNNDUxMzE2MDU5NDE=",
                  timestamp: "1693352763",
                  type: "text",
                  text: { body: "Hello! My Fielder is making a noise." },
                },
              ],
            },
          },
        ],
      },
    ],
    ...overrides,
  };
}

describe("WhatsApp — webhook parsing", () => {
  it("extracts a normalised inbound message from a Meta payload", () => {
    const result = parseWebhook(buildEnvelope());
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.message).toEqual({
      waPhoneNumberId: WA_NUMBER_ID,
      fromPhone: SENDER,
      messageId: "wamid.HBgNNDUxMzE2MDU5NDE=",
      timestamp: "1693352763",
      messageType: "text",
      text: "Hello! My Fielder is making a noise.",
      profileName: "Nyaga M.",
    });
  });

  it("acks status-only events (no_message) rather than treating them as messages", () => {
    const envelope = buildEnvelope();
    const change = (envelope.entry[0] as { changes: Array<Record<string, unknown>> }).changes[0];
    (change.value as Record<string, unknown>)["messages"] = undefined;

    const result = parseWebhook(envelope);
    expect(result).toMatchObject({ ok: false, code: "no_message" });
    expect(result.ok === false && result.code).toBe("no_message");
  });

  it("rejects a structurally invalid envelope", () => {
    const result = parseWebhook({ object: "not_whatsapp" });
    expect(result.ok).toBe(false);
    expect(result.ok === false && result.code).toBe("malformed_envelope");
  });

  it("handles messages without a contact profile name", () => {
    const envelope = buildEnvelope();
    const changes = (envelope.entry as Array<Record<string, unknown>>)[0].changes as Array<
      Record<string, unknown>
    >;
    (changes[0].value as Record<string, unknown>)["contacts"] = [];

    const result = parseWebhook(envelope);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.message.profileName).toBeNull();
  });
});