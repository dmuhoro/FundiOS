import { describe, expect, it } from "vitest";
import { signPayload, verifySignature } from "@/lib/whatsapp/signature";

const SECRET = "test-app-secret";

describe("WhatsApp — signature verification", () => {
  it("signs and verifies a payload with the correct secret", () => {
    const body = JSON.stringify({ hello: "world" });
    const signature = signPayload({ secret: SECRET, body });
    expect(signature).toMatch(/^sha256=[0-9a-f]{64}$/);
    expect(verifySignature({ secret: SECRET, body, signature })).toBe(true);
  });

  it("rejects a payload signed with a different secret", () => {
    const body = JSON.stringify({ hello: "world" });
    const signature = signPayload({ secret: "other-secret", body });
    expect(verifySignature({ secret: SECRET, body, signature })).toBe(false);
  });

  it("rejects a signature for tampered body content", () => {
    const body = JSON.stringify({ hello: "world" });
    const signature = signPayload({ secret: SECRET, body });
    const tampered = JSON.stringify({ hello: "evil" });
    expect(verifySignature({ secret: SECRET, body: tampered, signature })).toBe(false);
  });

  it("rejects when no secret, no signature, or wrong format is provided", () => {
    const body = "{}";
    const signature = signPayload({ secret: SECRET, body });
    expect(verifySignature({ secret: undefined, body, signature })).toBe(false);
    expect(verifySignature({ secret: SECRET, body, signature: undefined })).toBe(false);
    expect(verifySignature({ secret: SECRET, body, signature: "abc" })).toBe(false);
    expect(
      verifySignature({ secret: SECRET, body, signature: signature.slice(0, -2) }),
    ).toBe(false);
  });
});