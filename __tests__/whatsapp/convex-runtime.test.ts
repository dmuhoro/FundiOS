/**
 * Proves the Convex-runtime WhatsApp boundary (the lib the HTTP action actually
 * runs) independently of the legacy src/lib implementations.
 */
import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  parseWhatsAppEnvelope,
  verifyWhatsAppSignature,
} from "../../convex/lib/whatsapp";

const SECRET = "test-app-secret";

function sign(secret: string, body: string): string {
  return `sha256=${createHmac("sha256", secret).update(body, "utf8").digest("hex")}`;
}

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
                phone_number_id: "105431206008513",
              },
              contacts: [
                {
                  profile: { name: "Nyaga M." },
                  wa_id: "254712345678",
                },
              ],
              messages: [
                {
                  from: "254712345678",
                  id: "wamid.HBgNNDUxMzE2MDU5NDE=",
                  timestamp: "1693352763",
                  type: "text",
                  text: { body: "My Fielder is making a noise." },
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

describe("Convex-runtime WhatsApp boundary", () => {
  it("sign-POST path: accepts only an authentic signature", async () => {
    const body = JSON.stringify(buildEnvelope());
    expect(await verifyWhatsAppSignature({ secret: SECRET, body, signature: sign(SECRET, body) })).toBe(true);

    expect(
      await verifyWhatsAppSignature({ secret: SECRET, body, signature: sign("other-secret", body) }),
    ).toBe(false);
    expect(
      await verifyWhatsAppSignature({
        secret: SECRET,
        body: JSON.stringify(buildEnvelope({ extra: 1 })),
        signature: sign(SECRET, body),
      }),
    ).toBe(false);
    expect(await verifyWhatsAppSignature({ secret: SECRET, body, signature: undefined })).toBe(false);
    expect(await verifyWhatsAppSignature({ secret: undefined, body, signature: "sha256=aa" })).toBe(false);
    expect(await verifyWhatsAppSignature({ secret: SECRET, body, signature: "abc" })).toBe(false);
  });

  it("extracts a normalised inbound message", () => {
    const result = parseWhatsAppEnvelope(buildEnvelope());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.message).toEqual({
      waPhoneNumberId: "105431206008513",
      fromPhone: "254712345678",
      messageId: "wamid.HBgNNDUxMzE2MDU5NDE=",
      timestamp: "1693352763",
      text: "My Fielder is making a noise.",
    });
  });

  it("acks status-only events (no_message)", () => {
    const envelope = buildEnvelope();
    const value = (envelope.entry[0] as { changes: Array<Record<string, unknown>> }).changes[0]
      .value as Record<string, unknown>;
    value["messages"] = undefined;
    const result = parseWhatsAppEnvelope(envelope);
    expect(result.ok === false && result.code).toBe("no_message");
  });

  it("rejects a malformed envelope before any lead write", () => {
    const result = parseWhatsAppEnvelope({ object: "not_whatsapp" });
    expect(result.ok === false && result.code).toBe("malformed_envelope");

    const brokenMessage = buildEnvelope();
    const value = (brokenMessage.entry[0] as { changes: Array<Record<string, unknown>> }).changes[0]
      .value as Record<string, unknown>;
    value["messages"] = [{ from: 42 }];
    const result2 = parseWhatsAppEnvelope(brokenMessage);
    expect(result2.ok === false && result2.code).toBe("malformed_envelope");
  });
});