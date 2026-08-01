import { describe, expect, it } from "vitest";
import { getDashboardBackupStats, parseDashboardBackup } from "./dashboardBackup";

const session = {
  id: "session-1",
  title: "민법",
  type: "OX",
  total_questions: 99,
  solved_questions: 99,
  score: 0,
  elapsed_time: 10,
  created_at: "2026-08-01T00:00:00Z",
  status: "in-progress",
  questions: [{
    id: "question-1",
    no: 1,
    question: "의사표시는 법률행위다.",
    answer: "O",
    my_answer: "",
    originalRow: {},
  }],
};

describe("dashboard backup validation", () => {
  it("migrates legacy session arrays to the current backup format", () => {
    const parsed = parseDashboardBackup([session]);
    expect(parsed).toMatchObject({ app: "law-solver", version: 3 });
    expect(parsed.sessions[0]).toMatchObject({ total_questions: 1, solved_questions: 0 });
  });

  it("preserves metadata and counts questions across sessions", () => {
    const parsed = parseDashboardBackup({
      app: "law-solver",
      version: 3,
      exported_at: "2026-08-01T01:00:00Z",
      data_modified_at: "2026-08-01T00:30:00Z",
      sessions: [session],
      subjects: [{ id: "subject-1", name: "민법", created_at: "2026-08-01T00:00:00Z" }],
      sessionSubjectMap: { "session-1": "subject-1", unknown: "subject-1" },
    });
    expect(getDashboardBackupStats(parsed)).toEqual({
      subjectCount: 1,
      sessionCount: 1,
      questionCount: 1,
      dataModifiedAt: "2026-08-01T00:30:00.000Z",
    });
    expect(parsed.sessionSubjectMap).toEqual({ "session-1": "subject-1" });
  });

  it("rejects future formats and structurally invalid questions", () => {
    expect(() => parseDashboardBackup({ version: 4, sessions: [] })).toThrow("최신 버전");
    expect(() => parseDashboardBackup({ sessions: [{ ...session, questions: [{}] }] }))
      .toThrow("정답");
  });
});
