import { describe, expect, it } from "vitest";
import { encryptCloudBackupJson, decryptCloudBackupJson } from "./cloudBackupCrypto";
import { parseCloudBackupRestore } from "./cloudBackupRestore";
import type { CloudBackupRecord } from "./premiumApi";

const timestamp = "2026-08-29T00:00:00.000Z";
const legacy = {
  app: "law-solver", version: 3, exported_at: timestamp, data_modified_at: timestamp,
  subjects: [{ id: "subject-1", name: "예시 과목", created_at: timestamp }],
  sessionSubjectMap: { "session-1": "subject-1" },
  sessions: [{
    id: "session-1", title: "예시 문제", type: "OX", order_mode: "random",
    total_questions: 1, solved_questions: 1, score: 0, elapsed_time: 47,
    created_at: timestamp, status: "completed",
    questions: [{ id: "q1", no: 1, question: "예시 지문", answer: "O", my_answer: "X", wrong_note: "다시 확인", bookmark: true, originalRow: {} }],
  }],
};
const remote: CloudBackupRecord = {
  revision: 1, dataModifiedAt: timestamp, uploadedAt: timestamp,
  subjectCount: 1, sessionCount: 1, questionCount: 1,
  encryptedSizeBytes: 300, backupFormatVersion: 3, encryptionFormatVersion: 1,
  deletionScheduledAt: null,
};

describe("cloud backup restore compatibility", () => {
  it("decrypts a server-stored v3 payload and migrates it before replacement", async () => {
    const encrypted = await encryptCloudBackupJson(JSON.stringify(legacy), "example-password");
    const restored = parseCloudBackupRestore(await decryptCloudBackupJson(encrypted, "example-password"), remote);
    expect(restored.version).toBe(4);
    expect(restored.problemSets).toHaveLength(1);
    expect(restored.sessions).toHaveLength(1);
    expect(restored.problemSets[0]?.questions[0]).not.toHaveProperty("my_answer");
    expect(restored.sessions[0]).toMatchObject({
      id: "session-1", problem_set_id: restored.problemSets[0]?.id,
      question_order: ["q1"], score: 0, elapsed_time: 47, last_played_at: null,
      responses: { q1: { answer: "X", wrong_note: "다시 확인", bookmark: true } },
    });
  });

  it("rejects metadata mismatch and malformed content without returning a replacement", () => {
    expect(() => parseCloudBackupRestore(JSON.stringify(legacy), { ...remote, sessionCount: 2 }))
      .toThrow("백업 파일과 서버 정보가 일치하지 않습니다");
    expect(() => parseCloudBackupRestore('{"version":4,"sessions":[]}', remote)).toThrow();
  });
});
