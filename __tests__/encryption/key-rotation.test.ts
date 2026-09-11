/**
 * P0 Bug Test: Encryption key rotation
 *
 * Asserts that records encrypted with key v1 still decrypt correctly
 * after the active key is rotated to v2 (PRD § 2, P0 Bug 2).
 *
 * The decryption path reads the key_version stored in the ciphertext and
 * resolves that exact key, never the "currently active" key. This is the
 * guard that was missing in the original Kay's flow, where rotation silently
 * made older ciphertext undecryptable.
 */
import { beforeEach, describe, expect, it } from "vitest";
import {
  UnknownKeyVersionError,
  activeKeyVersion,
  decryptFields,
  decryptPII,
  encryptFields,
  encryptPII,
  isEncrypted,
  rotateKey,
  wipeKeys,
} from "@/lib/encryption/encryption";

const GARAGE = "garage-123e4567-e89b-12d3-a456-426614174000";

describe("Encryption — key rotation (P0 gate)", () => {
  beforeEach(() => {
    wipeKeys();
  });

  it("decrypts v1-encrypted records after key is rotated to v2", async () => {
    const record = { name: "Nyaga M." };
    const encrypted = await encryptFields(GARAGE, record, ["name"]);
    expect(isEncrypted(encrypted.name)).toBe(true);
    expect(activeKeyVersion(GARAGE)).toBe(1);

    await rotateKey(GARAGE);
    expect(activeKeyVersion(GARAGE)).toBe(2);

    const decrypted = await decryptFields(GARAGE, { name: encrypted.name }, ["name"]);
    expect(decrypted.name).toBe("Nyaga M.");
  });

  it("decrypts v2-encrypted records after rotation", async () => {
    await rotateKey(GARAGE);

    const encrypted = await encryptPII(GARAGE, "0712345678");
    expect(activeKeyVersion(GARAGE)).toBe(2);

    const decrypted = await decryptPII(GARAGE, encrypted);
    expect(decrypted).toBe("0712345678");
  });

  it("throws on unknown key_version rather than silently failing", async () => {
    const unknown = `ENC:${JSON.stringify({
      iv: "00000000000000000000000000000000",
      tag: "00000000000000000000000000000000",
      data: "00",
      keyVersion: 999,
    })}`;

    await expect(decryptPII(GARAGE, unknown)).rejects.toThrow(UnknownKeyVersionError);
  });

  it("resolve the exact stored version, not the active key", async () => {
    const v1Encrypted = await encryptPII(GARAGE, "kept-in-v1");
    await rotateKey(GARAGE);
    const v2Encrypted = await encryptPII(GARAGE, "born-in-v2");

    expect(await decryptPII(GARAGE, v1Encrypted)).toBe("kept-in-v1");
    expect(await decryptPII(GARAGE, v2Encrypted)).toBe("born-in-v2");
  });

  it("isolates keys per garage", async () => {
    const other = "garage-other-00000000-0000-4a2f-0000-000000000090";
    const a = await encryptPII(GARAGE, "secret-a");
    await expect(decryptPII(other, a)).rejects.toThrow(UnknownKeyVersionError);
  });
});