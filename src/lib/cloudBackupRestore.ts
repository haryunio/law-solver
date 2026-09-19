import { CloudBackupCryptoError } from "./cloudBackupCrypto";
import { getDashboardBackupStats, parseDashboardBackupJson } from "./dashboardBackup";
import type { CloudBackupRecord } from "./premiumApi";

/** Validate and migrate decrypted content before the user can confirm replacement. */
export function parseCloudBackupRestore(json: string, remote: CloudBackupRecord | null | undefined) {
  const data = parseDashboardBackupJson(json);
  const stats = getDashboardBackupStats(data);
  if (
    !remote || remote.subjectCount !== stats.subjectCount ||
    remote.sessionCount !== stats.sessionCount || remote.questionCount !== stats.questionCount ||
    Date.parse(remote.dataModifiedAt) !== Date.parse(stats.dataModifiedAt)
  ) {
    throw new CloudBackupCryptoError(
      "백업 파일과 서버 정보가 일치하지 않습니다. 다시 시도해 주세요.",
      "DECRYPTION_FAILED",
    );
  }
  return data;
}
