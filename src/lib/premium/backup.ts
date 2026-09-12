import { requireClient, supabaseUrl } from "./client";
import { PremiumApiError } from "./errors";
import { apiRequest } from "./transport";
import type { CloudBackupMetadata, CloudBackupUploadIntentInput, CloudBackupUploadIntent, CloudBackupRestoreTicket } from "./types";

export const getCloudBackupMetadata = () =>
  apiRequest<CloudBackupMetadata>("backup-api");

export const createCloudBackupUploadIntent = (input: CloudBackupUploadIntentInput) =>
  apiRequest<CloudBackupUploadIntent>("backup-api", "/upload-intents", {
    method: "POST",
    body: JSON.stringify(input),
  });

export async function uploadCloudBackupObject(
  intent: CloudBackupUploadIntent,
  encryptedBackup: Uint8Array,
): Promise<void> {
  const { error } = await requireClient().storage.from(intent.bucket).uploadToSignedUrl(
    intent.objectPath,
    intent.token,
    new Blob([
      encryptedBackup.buffer.slice(
        encryptedBackup.byteOffset,
        encryptedBackup.byteOffset + encryptedBackup.byteLength,
      ) as ArrayBuffer,
    ], { type: intent.contentType }),
    { contentType: intent.contentType, cacheControl: "0", upsert: false },
  );
  if (error) {
    throw new PremiumApiError(
      "암호화된 백업 파일을 업로드하지 못했습니다.",
      "BACKUP_STORAGE_ERROR",
      0,
    );
  }
}

export const commitCloudBackupUpload = (uploadId: string) =>
  apiRequest<CloudBackupMetadata>(
    "backup-api",
    `/upload-intents/${encodeURIComponent(uploadId)}/commit`,
    { method: "POST" },
  );

export const createCloudBackupRestoreTicket = () =>
  apiRequest<CloudBackupRestoreTicket>("backup-api", "/restore", { method: "POST" });

function browserStorageUrl(signedUrl: string): string {
  const target = new URL(signedUrl);
  const configuredApi = new URL(supabaseUrl);
  const isLocalApi = configuredApi.hostname === "127.0.0.1" || configuredApi.hostname === "localhost";
  if (isLocalApi && (target.hostname === "kong" || target.port === "8000")) {
    target.protocol = configuredApi.protocol;
    target.host = configuredApi.host;
  }
  return target.toString();
}

export async function downloadCloudBackupObject(ticket: CloudBackupRestoreTicket) {
  const expectedSize = ticket.metadata.backup?.encryptedSizeBytes;
  const response = await fetch(browserStorageUrl(ticket.signedUrl), { cache: "no-store" });
  if (!response.ok) {
    throw new PremiumApiError(
      "암호화된 백업 파일을 내려받지 못했습니다.",
      "BACKUP_STORAGE_ERROR",
      response.status,
    );
  }
  const declaredSize = Number(response.headers.get("content-length") ?? "0");
  if (declaredSize > 15_000_000) {
    throw new PremiumApiError("백업 파일 크기를 확인할 수 없습니다.", "BACKUP_UPLOAD_INVALID", 409);
  }
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes.byteLength < 1 || bytes.byteLength > 15_000_000 || bytes.byteLength !== expectedSize) {
    throw new PremiumApiError("백업 파일 크기가 일치하지 않습니다.", "BACKUP_UPLOAD_INVALID", 409);
  }
  return bytes;
}

export const deleteCloudBackup = () =>
  apiRequest<{ deleted: true }>("backup-api", "", { method: "DELETE" });
