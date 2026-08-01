export const CLOUD_BACKUP_MAX_ENCRYPTED_BYTES = 15_000_000;
export const CLOUD_BACKUP_MAX_PLAINTEXT_BYTES = 30_000_000;
export const CLOUD_BACKUP_ENCRYPTION_FORMAT_VERSION = 1;
export const CLOUD_BACKUP_PASSWORD_MIN_LENGTH = 8;
export const CLOUD_BACKUP_PBKDF2_ITERATIONS = 600_000;

const HEADER_BYTES = 40;
const AUTH_TAG_BYTES = 16;
const MAGIC = new Uint8Array([0x4c, 0x53, 0x43, 0x42]); // LSCB
const COMPRESSION_GZIP = 1;
const KDF_PBKDF2_SHA256 = 1;

export type CloudBackupCryptoErrorCode =
  | "PASSWORD_TOO_SHORT"
  | "PLAINTEXT_TOO_LARGE"
  | "ENCRYPTED_TOO_LARGE"
  | "UNSUPPORTED_BROWSER"
  | "UNSUPPORTED_FORMAT"
  | "DECRYPTION_FAILED";

export class CloudBackupCryptoError extends Error {
  constructor(message: string, readonly code: CloudBackupCryptoErrorCode) {
    super(message);
    this.name = "CloudBackupCryptoError";
  }
}

function passwordLength(password: string): number {
  return Array.from(password).length;
}

export function validateCloudBackupPassword(password: string): void {
  if (passwordLength(password) < CLOUD_BACKUP_PASSWORD_MIN_LENGTH) {
    throw new CloudBackupCryptoError("백업 비밀번호는 8자 이상 입력해 주세요.", "PASSWORD_TOO_SHORT");
  }
}

function browserCrypto(): Crypto {
  if (!globalThis.crypto?.subtle) {
    throw new CloudBackupCryptoError(
      "이 브라우저에서는 안전한 클라우드 백업 암호화를 사용할 수 없습니다.",
      "UNSUPPORTED_BROWSER",
    );
  }
  return globalThis.crypto;
}

function requireCompressionSupport(): void {
  if (typeof CompressionStream === "undefined" || typeof DecompressionStream === "undefined") {
    throw new CloudBackupCryptoError(
      "이 브라우저에서는 압축 백업을 사용할 수 없습니다. 최신 브라우저로 업데이트해 주세요.",
      "UNSUPPORTED_BROWSER",
    );
  }
}

function arrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

async function readStreamWithLimit(
  stream: ReadableStream<Uint8Array>,
  maxBytes: number,
  tooLargeCode: "PLAINTEXT_TOO_LARGE" | "ENCRYPTED_TOO_LARGE",
): Promise<Uint8Array> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel();
        throw new CloudBackupCryptoError(
          tooLargeCode === "PLAINTEXT_TOO_LARGE"
            ? "압축을 푼 백업 데이터가 30MB 제한을 넘습니다."
            : "압축·암호화된 백업 파일이 15MB 제한을 넘습니다.",
          tooLargeCode,
        );
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const output = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    output.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return output;
}

async function gzip(bytes: Uint8Array): Promise<Uint8Array> {
  requireCompressionSupport();
  const stream = new Blob([arrayBuffer(bytes)]).stream().pipeThrough(new CompressionStream("gzip"));
  return readStreamWithLimit(
    stream,
    CLOUD_BACKUP_MAX_ENCRYPTED_BYTES - HEADER_BYTES - AUTH_TAG_BYTES,
    "ENCRYPTED_TOO_LARGE",
  );
}

async function gunzip(bytes: Uint8Array): Promise<Uint8Array> {
  requireCompressionSupport();
  try {
    const stream = new Blob([arrayBuffer(bytes)]).stream().pipeThrough(
      new DecompressionStream("gzip"),
    );
    return await readStreamWithLimit(stream, CLOUD_BACKUP_MAX_PLAINTEXT_BYTES, "PLAINTEXT_TOO_LARGE");
  } catch (error) {
    if (error instanceof CloudBackupCryptoError) throw error;
    throw new CloudBackupCryptoError(
      "백업 파일이 손상되었거나 비밀번호가 올바르지 않습니다.",
      "DECRYPTION_FAILED",
    );
  }
}

async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const subtle = browserCrypto().subtle;
  const passwordKey = await subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  return subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: arrayBuffer(salt),
      iterations: CLOUD_BACKUP_PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    passwordKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

function createHeader(salt: Uint8Array, iv: Uint8Array): Uint8Array {
  const header = new Uint8Array(HEADER_BYTES);
  header.set(MAGIC, 0);
  header[4] = CLOUD_BACKUP_ENCRYPTION_FORMAT_VERSION;
  header[5] = COMPRESSION_GZIP;
  header[6] = KDF_PBKDF2_SHA256;
  new DataView(header.buffer).setUint32(8, CLOUD_BACKUP_PBKDF2_ITERATIONS, false);
  header.set(salt, 12);
  header.set(iv, 28);
  return header;
}

function parseHeader(file: Uint8Array) {
  if (
    file.byteLength < HEADER_BYTES + AUTH_TAG_BYTES ||
    MAGIC.some((byte, index) => file[index] !== byte) ||
    file[4] !== CLOUD_BACKUP_ENCRYPTION_FORMAT_VERSION ||
    file[5] !== COMPRESSION_GZIP ||
    file[6] !== KDF_PBKDF2_SHA256 ||
    new DataView(file.buffer, file.byteOffset, HEADER_BYTES).getUint32(8, false) !==
      CLOUD_BACKUP_PBKDF2_ITERATIONS
  ) {
    throw new CloudBackupCryptoError(
      "지원하지 않는 클라우드 백업 파일 형식입니다.",
      "UNSUPPORTED_FORMAT",
    );
  }
  return {
    header: file.slice(0, HEADER_BYTES),
    salt: file.slice(12, 28),
    iv: file.slice(28, 40),
    ciphertext: file.slice(HEADER_BYTES),
  };
}

export async function encryptCloudBackupJson(json: string, password: string): Promise<Uint8Array> {
  validateCloudBackupPassword(password);
  const plaintext = new TextEncoder().encode(json);
  if (plaintext.byteLength > CLOUD_BACKUP_MAX_PLAINTEXT_BYTES) {
    throw new CloudBackupCryptoError(
      "백업할 원본 데이터가 30MB 안전 제한을 넘습니다.",
      "PLAINTEXT_TOO_LARGE",
    );
  }
  const crypto = browserCrypto();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const header = createHeader(salt, iv);
  const compressed = await gzip(plaintext);
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: arrayBuffer(iv), additionalData: arrayBuffer(header), tagLength: 128 },
    await deriveKey(password, salt),
    arrayBuffer(compressed),
  );
  const output = new Uint8Array(HEADER_BYTES + encrypted.byteLength);
  output.set(header, 0);
  output.set(new Uint8Array(encrypted), HEADER_BYTES);
  if (output.byteLength > CLOUD_BACKUP_MAX_ENCRYPTED_BYTES) {
    throw new CloudBackupCryptoError(
      "압축·암호화된 백업 파일이 15MB 제한을 넘습니다.",
      "ENCRYPTED_TOO_LARGE",
    );
  }
  return output;
}

export async function decryptCloudBackupJson(file: Uint8Array, password: string): Promise<string> {
  validateCloudBackupPassword(password);
  if (file.byteLength > CLOUD_BACKUP_MAX_ENCRYPTED_BYTES) {
    throw new CloudBackupCryptoError(
      "암호화된 백업 파일이 15MB 제한을 넘습니다.",
      "ENCRYPTED_TOO_LARGE",
    );
  }
  const { header, salt, iv, ciphertext } = parseHeader(file);
  let compressed: ArrayBuffer;
  try {
    compressed = await browserCrypto().subtle.decrypt(
      { name: "AES-GCM", iv: arrayBuffer(iv), additionalData: arrayBuffer(header), tagLength: 128 },
      await deriveKey(password, salt),
      arrayBuffer(ciphertext),
    );
  } catch {
    throw new CloudBackupCryptoError(
      "비밀번호가 올바르지 않거나 백업 파일이 손상되었습니다.",
      "DECRYPTION_FAILED",
    );
  }
  const plaintext = await gunzip(new Uint8Array(compressed));
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(plaintext);
  } catch {
    throw new CloudBackupCryptoError(
      "복구한 백업 내용을 읽을 수 없습니다.",
      "DECRYPTION_FAILED",
    );
  }
}
