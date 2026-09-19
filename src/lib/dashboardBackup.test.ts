import { describe, expect, it } from "vitest";
import type { DashboardBackupData, TestSession } from "../types/test";
import { getDashboardBackupStats, parseDashboardBackup, parseDashboardBackupJson } from "./dashboardBackup";
import { materializeOfflineSession } from "./offlineProblemSets";

const session: TestSession = {
  id: "session-1", title: "민법", type: "OX", order_mode: "random",
  total_questions: 2, solved_questions: 1, score: 50, elapsed_time: 91,
  created_at: "2026-08-01T00:00:00.000Z", status: "completed",
  questions: [
    { id: "q2", no: 2, chapter: "총칙", question: "두 번째 문항", answer: "X", my_answer: "X", wrong_note: "검토한 근거", bookmark: true,
      boxes: ["보기"], explanation: "해설", source: "출처", originalRow: { 문항: "원본 문항", 사용자답안: "X", 사용자정의열: "유지할 값" } },
    { id: "q1", no: 1, question: "첫 번째 문항", answer: "O", my_answer: "", wrong_note: "", bookmark: false, originalRow: {} },
  ],
};
const subject = { id: "subject-1", name: "민법", created_at: "2026-08-01T00:00:00.000Z" };
const legacy = (version: number) => ({
  app: "law-solver", version, exported_at: "2026-08-01T01:00:00.000Z", data_modified_at: "2026-08-01T00:30:00.000Z",
  sessions: [session], subjects: [subject], sessionSubjectMap: { [session.id]: subject.id, unknown: subject.id },
});
const v4 = () => parseDashboardBackup(legacy(3));
const withMutation = (mutate: (data: DashboardBackupData) => void) => {
  const data = v4();
  mutate(data);
  return data;
};

describe("dashboard backup validation and migration", () => {
  it.each([1, 2, 3])("preserves v%s source content, records, order, result and original timestamps", (version) => {
    const parsed = parseDashboardBackup(legacy(version));
    expect(parsed.version).toBe(4);
    expect(parsed.problemSets[0]).toMatchObject({ id: session.id, title: session.title, subject_id: subject.id, created_at: session.created_at, updated_at: session.created_at });
    expect(parsed.sessions[0]).toMatchObject({
      id: session.id, problem_set_id: session.id, order_mode: "random", question_order: ["q2", "q1"], score: 50, elapsed_time: 91,
      created_at: session.created_at, last_played_at: null, submitted_at: null, attempt_number: 1, source_session_id: null, retry_mode: null,
    });
    expect(materializeOfflineSession(parsed.problemSets[0]!, parsed.sessions[0]!)).toEqual(session);
    expect(parsed.problemSets[0]!.questions[0]!.originalRow).toEqual(session.questions[0]!.originalRow);
    for (const question of parsed.problemSets[0]!.questions) {
      expect(question).not.toHaveProperty("my_answer");
      expect(question).not.toHaveProperty("wrong_note");
      expect(question).not.toHaveProperty("bookmark");
    }
    expect(parsed.sessions[0]).not.toHaveProperty("questions");
  });

  it("accepts legacy arrays and repairs legacy derived counts without rearranging questions", () => {
    const parsed = parseDashboardBackup([{ ...session, total_questions: 99, solved_questions: 99 }]);
    expect(parsed.sessions[0]).toMatchObject({ total_questions: 2, solved_questions: 1, question_order: ["q2", "q1"] });
    expect(parsed.problemSets[0]!.subject_id).toBeNull();
  });

  it("keeps same-title legacy sessions in separate problem sets", () => {
    const parsed = parseDashboardBackup([session, { ...session, id: "session-2" }]);
    expect(parsed.problemSets.map((problem) => problem.id)).toEqual(["session-1", "session-2"]);
    expect(parsed.sessions.map((attempt) => attempt.problem_set_id)).toEqual(["session-1", "session-2"]);
  });

  it("preserves finite CSV numbering in legacy migration and v4 round trips", () => {
    const parsed = parseDashboardBackup([{ ...session, questions: session.questions.map((question, index) => ({ ...question, no: index ? 0 : -1.5 })) }]);
    expect(parsed.problemSets[0]!.questions.map((question) => question.no)).toEqual([-1.5, 0]);
    expect(parseDashboardBackupJson(JSON.stringify(parsed))).toEqual(parsed);
    parsed.problemSets[0]!.questions[0]!.no = Infinity;
    expect(() => parseDashboardBackup(parsed)).toThrow("문항 번호");
  });

  it("round-trips v4 with a shared source and counts each original question once", () => {
    const data = v4();
    data.sessions.push({ ...data.sessions[0]!, id: "retry", attempt_number: 2, source_session_id: session.id, retry_mode: "all" });
    const parsed = parseDashboardBackupJson(JSON.stringify(data));
    expect(parsed).toEqual(data);
    expect(getDashboardBackupStats(parsed)).toEqual({ subjectCount: 1, problemSetCount: 1, sessionCount: 2, questionCount: 2, dataModifiedAt: "2026-08-01T00:30:00.000Z" });
    const { version: _version, ...withoutVersion } = data;
    expect(parseDashboardBackup(withoutVersion)).toEqual(data);
  });

  it("preserves the persisted data timestamp when normalizing storage state", () => {
    const data = v4();
    expect(parseDashboardBackup({ problemSets: data.problemSets, sessions: data.sessions, subjects: data.subjects, dataUpdatedAt: data.data_modified_at }).data_modified_at)
      .toBe(data.data_modified_at);
  });

  it.each([
    ["problem", (data: DashboardBackupData) => data.problemSets.push(data.problemSets[0]!)],
    ["session", (data: DashboardBackupData) => data.sessions.push(data.sessions[0]!)],
    ["subject", (data: DashboardBackupData) => data.subjects.push(data.subjects[0]!)],
    ["question", (data: DashboardBackupData) => data.problemSets[0]!.questions.push(data.problemSets[0]!.questions[0]!)],
  ])("rejects duplicate %s IDs", (_label, mutate) => {
    expect(() => parseDashboardBackup(withMutation(mutate))).toThrow("중복");
  });

  it.each([
    ["missing problem", (data: DashboardBackupData) => { data.sessions[0]!.problem_set_id = "missing"; }],
    ["missing subject", (data: DashboardBackupData) => { data.problemSets[0]!.subject_id = "missing"; }],
    ["missing question", (data: DashboardBackupData) => { data.sessions[0]!.question_order[0] = "missing"; }],
    ["duplicate question order", (data: DashboardBackupData) => { data.sessions[0]!.question_order[0] = "q1"; }],
    ["missing response", (data: DashboardBackupData) => { delete data.sessions[0]!.responses.q1; }],
    ["foreign response", (data: DashboardBackupData) => { data.sessions[0]!.responses.other = { answer: "", wrong_note: "", bookmark: false }; }],
    ["missing source", (data: DashboardBackupData) => { data.sessions[0]!.source_session_id = "missing"; }],
    ["self reference", (data: DashboardBackupData) => { data.sessions[0]!.source_session_id = session.id; }],
  ])("rejects broken v4 references: %s", (_label, mutate) => {
    expect(() => parseDashboardBackup(withMutation(mutate))).toThrow();
  });

  it("rejects retry sources belonging to another problem set", () => {
    const data = parseDashboardBackup([session, { ...session, id: "other" }]);
    data.sessions[1]!.source_session_id = session.id;
    data.sessions[1]!.attempt_number = 2;
    expect(() => parseDashboardBackup(data)).toThrow("원본 세션 연결");
  });

  it("rejects future and malformed formats", () => {
    expect(() => parseDashboardBackup({ ...v4(), version: 5 })).toThrow("최신 버전");
    expect(() => parseDashboardBackup({ ...v4(), version: "4" })).toThrow("버전");
    expect(() => parseDashboardBackup({ sessions: [{ ...session, questions: [{}] }] })).toThrow("정답");
    expect(() => parseDashboardBackup({ version: 4, sessions: [], subjects: [] })).toThrow("문제 목록");
    expect(() => parseDashboardBackupJson("{")).toThrow("JSON");
    expect(() => parseDashboardBackup(null)).toThrow("백업");
  });

  it("handles prototype-shaped IDs as plain persisted keys", () => {
    const legacySession = { ...session, id: "constructor", questions: session.questions.map((question, index) => ({ ...question, id: index ? "constructor" : "__proto__" })) };
    const data = parseDashboardBackup([legacySession]);
    expect(Object.keys(data.sessions[0]!.responses)).toEqual(["__proto__", "constructor"]);
    expect(parseDashboardBackupJson(JSON.stringify(data))).toEqual(data);
    expect(materializeOfflineSession(data.problemSets[0]!, data.sessions[0]!).questions.map((question) => question.my_answer)).toEqual(["X", ""]);
    delete data.sessions[0]!.responses.__proto__;
    expect(() => parseDashboardBackup(data)).toThrow("답안 연결");
  });
});
