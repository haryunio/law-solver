import { describe, expect, it } from "vitest";
import { parseDashboardBackup } from "./dashboardBackup";
import { emptyOfflineResponse, materializeOfflineSession, toOfflineQuestion } from "./offlineProblemSets";
import type { ParsedQuestion, TestSession } from "../types/test";

const question: ParsedQuestion = {
  id: "q", no: 1, question: "원본 문제", answer: "2", choices: ["첫째", "둘째", "셋째", "넷째", "다섯째"],
  boxes: ["원본 보기"], my_answer: "2", wrong_note: "원본 노트", bookmark: true,
  originalRow: { 문제: "원본 문제", 사용자답안: "2", 오답노트: "원본 노트" },
};
const legacy: TestSession = {
  id: "s", title: "문제", type: "5-choice", total_questions: 1, solved_questions: 1, score: 100, elapsed_time: 20,
  created_at: "2026-08-01T00:00:00.000Z", status: "completed", questions: [question],
};

describe("offline problem set materialization", () => {
  it("stores source content without attempt fields and independently copies input arrays", () => {
    const source = toOfflineQuestion(question);
    expect(source).not.toHaveProperty("my_answer");
    expect(source).not.toHaveProperty("wrong_note");
    expect(source).not.toHaveProperty("bookmark");
    source.choices![0] = "다른 보기";
    source.boxes![0] = "다른 지문";
    source.originalRow.문제 = "변경";
    expect(question.choices![0]).toBe("첫째");
    expect(question.boxes![0]).toBe("원본 보기");
    expect(question.originalRow.문제).toBe("원본 문제");
  });

  it("overlays only the selected attempt and does not mutate canonical data", () => {
    const data = parseDashboardBackup([legacy]);
    const problem = data.problemSets[0]!;
    const session = data.sessions[0]!;
    const retry = { ...session, id: "retry", responses: { q: emptyOfflineResponse() }, solved_questions: 0, score: 0 };
    const view = materializeOfflineSession(problem, retry);
    expect(view.questions[0]).toMatchObject({ my_answer: "", wrong_note: "", bookmark: false, originalRow: question.originalRow });
    view.questions[0]!.my_answer = "1";
    view.questions[0]!.choices![0] = "화면 변경";
    view.questions[0]!.originalRow.문제 = "화면 변경";
    expect(problem.questions[0]!.choices![0]).toBe("첫째");
    expect(problem.questions[0]!.originalRow.문제).toBe("원본 문제");
    expect(session.responses.q!.answer).toBe("2");
    expect(retry.responses.q.answer).toBe("");
  });

  it("fails if the view references another source or a missing response", () => {
    const data = parseDashboardBackup([legacy]);
    expect(() => materializeOfflineSession(data.problemSets[0]!, { ...data.sessions[0]!, problem_set_id: "different" })).toThrow();
    expect(() => materializeOfflineSession(data.problemSets[0]!, { ...data.sessions[0]!, responses: {} })).toThrow();
  });
});
