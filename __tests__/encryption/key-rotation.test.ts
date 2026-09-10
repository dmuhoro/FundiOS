/**
 * P0 Bug Test: Encryption key rotation
 *
 * Asserts that records encrypted with key v1 still decrypt correctly
 * after the active key is rotated to v2.
 *
 * DO NOT extract the encryption module from Kay's until this suite passes
 * against the real decryption path (PRD § 2, P0 Bug 2).
 */
import { describe, it } from "vitest";

describe("Encryption — key rotation", () => {
  it.todo("decrypts v1-encrypted records after key is rotated to v2");
  it.todo("decrypts v2-encrypted records after rotation");
  it.todo("throws on unknown key_version rather than silently failing");
});