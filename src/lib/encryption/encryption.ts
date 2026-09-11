import crypto from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const KEY_LENGTH = 32;
const SALT = "fundios-pii-v1";
const ENC_PREFIX = "ENC:";

export const ENCRYPTION_SCHEME = "aes-256-gcm:scrypt-v1";

export interface EncryptedPayload {
  iv: string;
  tag: string;
  data: string;
  keyVersion: number;
}

export class DecryptionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DecryptionError";
  }
}

export class UnknownKeyVersionError extends DecryptionError {
  constructor(garageId: string, version: number) {
    super(`Encryption key version ${version} not found for garage ${garageId}`);
    this.name = "UnknownKeyVersionError";
  }
}

interface StoredKey {
  key: Buffer;
  active: boolean;
  ts: number;
}

interface GarageKeyState {
  entries: Map<number, StoredKey>;
  highestVersion: number;
}

const keyStore = new Map<string, GarageKeyState>();

function deriveKey(garageId: string, passphrase: string, version: number): Buffer {
  return crypto.scryptSync(`${garageId}:${passphrase}:v${version}`, SALT, KEY_LENGTH);
}

function ensureGarageState(garageId: string): GarageKeyState {
  let state = keyStore.get(garageId);
  if (!state) {
    state = { entries: new Map(), highestVersion: 0 };
    keyStore.set(garageId, state);
  }
  return state;
}

async function getActiveKey(garageId: string): Promise<{ key: Buffer; version: number }> {
  const state = ensureGarageState(garageId);
  const active = [...state.entries.values()].find((entry) => entry.active);
  if (active) {
    const activeVersion = state.highestVersion;
    return { key: active.key, version: activeVersion };
  }

  const passphrase = crypto.randomBytes(32).toString("hex");
  const key = deriveKey(garageId, passphrase, 1);
  state.entries.set(1, { key, active: true, ts: Date.now() });
  state.highestVersion = 1;
  return { key, version: 1 };
}

function getKeyByVersion(garageId: string, version: number): { key: Buffer; version: number } {
  const state = ensureGarageState(garageId);
  const entry = state.entries.get(version);
  if (!entry) {
    throw new UnknownKeyVersionError(garageId, version);
  }
  return { key: entry.key, version };
}

export async function encryptPII(garageId: string, plaintext: string): Promise<string> {
  if (!garageId) {
    throw new Error("Encryption requires a garage scope");
  }
  if (!plaintext) return plaintext;

  const { key, version } = await getActiveKey(garageId);
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  const payload: EncryptedPayload = {
    iv: iv.toString("hex"),
    tag: tag.toString("hex"),
    data: encrypted.toString("hex"),
    keyVersion: version,
  };

  return `${ENC_PREFIX}${JSON.stringify(payload)}`;
}

export async function decryptPII(garageId: string, ciphertext: string): Promise<string> {
  if (!ciphertext || !ciphertext.startsWith(ENC_PREFIX)) return ciphertext;

  let payload: EncryptedPayload;
  try {
    payload = JSON.parse(ciphertext.slice(ENC_PREFIX.length)) as EncryptedPayload;
  } catch {
    throw new DecryptionError("Decryption failed: invalid ciphertext");
  }

  let key: Buffer;
  try {
    key = getKeyByVersion(garageId, payload.keyVersion).key;
  } catch (err) {
    if (err instanceof UnknownKeyVersionError) {
      throw err;
    }
    throw new DecryptionError("Decryption failed: invalid key version");
  }

  try {
    const iv = Buffer.from(payload.iv, "hex");
    const tag = Buffer.from(payload.tag, "hex");
    const encryptedData = Buffer.from(payload.data, "hex");

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    const decrypted = Buffer.concat([decipher.update(encryptedData), decipher.final()]);
    return decrypted.toString("utf8");
  } catch {
    throw new DecryptionError("Decryption failed: invalid ciphertext or key");
  }
}

export async function encryptFields<T extends Record<string, unknown>>(
  garageId: string,
  record: T,
  fields: (keyof T)[],
): Promise<T> {
  if (!garageId) {
    throw new Error("Encryption requires a garage scope");
  }
  const result = { ...record };
  for (const field of fields) {
    const val = result[field];
    if (typeof val === "string" && val) {
      result[field] = (await encryptPII(garageId, val)) as T[keyof T];
    }
  }
  return result;
}

export async function decryptFields<T extends Record<string, unknown>>(
  garageId: string,
  record: T,
  fields: (keyof T)[],
): Promise<T> {
  if (!garageId) {
    throw new Error("Decryption requires a garage scope");
  }
  const result = { ...record };
  for (const field of fields) {
    const val = result[field];
    if (typeof val === "string" && val.startsWith(ENC_PREFIX)) {
      result[field] = (await decryptPII(garageId, val)) as T[keyof T];
    }
  }
  return result;
}

export function isEncrypted(value: unknown): boolean {
  return typeof value === "string" && value.startsWith(ENC_PREFIX);
}

export async function rotateKey(garageId: string): Promise<number> {
  if (!garageId) {
    throw new Error("Rotation requires a garage scope");
  }
  await getActiveKey(garageId);
  const state = ensureGarageState(garageId);

  for (const entry of state.entries.values()) {
    entry.active = false;
  }

  const nextVersion = state.highestVersion + 1;
  const passphrase = crypto.randomBytes(32).toString("hex");
  const key = deriveKey(garageId, passphrase, nextVersion);
  state.entries.set(nextVersion, { key, active: true, ts: Date.now() });
  state.highestVersion = nextVersion;

  return nextVersion;
}

export function activeKeyVersion(garageId: string): number {
  const state = ensureGarageState(garageId);
  return state.highestVersion;
}

export function wipeKeys(): void {
  keyStore.clear();
}

export function garageKeyStats(garageId: string): {
  versions: number;
  activeVersion: number | null;
} {
  const state = ensureGarageState(garageId);
  const active = [...state.entries.values()].find((entry) => entry.active);
  return {
    versions: state.entries.size,
    activeVersion: active
      ? [...state.entries.entries()].find(([, e]) => e === active)?.[0] ?? null
      : null,
  };
}