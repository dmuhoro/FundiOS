import crypto from "node:crypto";

export function signPayload(input: { secret: string; body: string }): string {
  const { secret, body } = input;
  return `sha256=${crypto.createHmac("sha256", secret).update(body, "utf8").digest("hex")}`;
}

export function verifySignature(input: {
  secret: string | undefined;
  body: string;
  signature: string | undefined | null;
}): boolean {
  const { secret, body, signature } = input;
  if (!secret || !signature) {
    return false;
  }
  const expected = signPayload({ secret, body });
  const expectedBuffer = Buffer.from(expected, "utf8");
  const providedBuffer = Buffer.from(signature, "utf8");
  if (expectedBuffer.length !== providedBuffer.length) {
    return false;
  }
  return crypto.timingSafeEqual(expectedBuffer, providedBuffer);
}