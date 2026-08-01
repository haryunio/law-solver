import { describe, expect, it } from "vitest";
import {
  CloudBackupCryptoError,
  decryptCloudBackupJson,
  encryptCloudBackupJson,
  validateCloudBackupPassword,
} from "./cloudBackupCrypto";

describe("client-encrypted cloud backup", () => {
  it("gzip-compresses and AES-GCM decrypts the same JSON", async () => {
    const json = JSON.stringify({ app: "law-solver", sessions: [{ title: "민법" }] });
    const encrypted = await encryptCloudBackupJson(json, "안전한비밀번호8자");
    expect(new TextDecoder().decode(encrypted)).not.toContain("민법");
    await expect(decryptCloudBackupJson(encrypted, "안전한비밀번호8자")).resolves.toBe(json);
  });

  it("supports repeated password attempts against the same cached bytes", async () => {
    const encrypted = await encryptCloudBackupJson("{\"value\":1}", "correct-password");
    await expect(decryptCloudBackupJson(encrypted, "wrong-password"))
      .rejects.toMatchObject({ code: "DECRYPTION_FAILED" });
    await expect(decryptCloudBackupJson(encrypted, "correct-password"))
      .resolves.toBe("{\"value\":1}");
  });

  it("rejects short passwords and authenticated-header tampering", async () => {
    expect(() => validateCloudBackupPassword("1234567")).toThrow(CloudBackupCryptoError);
    const encrypted = await encryptCloudBackupJson("{}", "12345678");
    encrypted[7] = (encrypted[7] ?? 0) ^ 1;
    await expect(decryptCloudBackupJson(encrypted, "12345678"))
      .rejects.toMatchObject({ code: "DECRYPTION_FAILED" });
  });
});
