import { describe, expect, it } from "vitest";
import { getWrongQuestions } from "./session";
import { TestSession } from "../types/test";

describe("getWrongQuestions", () => {
  it("includes unanswered questions as wrong after submission", () => {
    const session: TestSession = {
      id: "session-1",
      title: "테스트",
      type: "OX",
      total_questions: 3,
      solved_questions: 2,
      score: 33,
      elapsed_time: 60,
      created_at: new Date().toISOString(),
      status: "completed",
      questions: [
        {
          id: "q1",
          no: 1,
          question: "q1",
          answer: "O",
          my_answer: "",
          originalRow: { 번호: "1" },
        },
        {
          id: "q2",
          no: 2,
          question: "q2",
          answer: "X",
          my_answer: "O",
          originalRow: { 번호: "2" },
        },
        {
          id: "q3",
          no: 3,
          question: "q3",
          answer: "O",
          my_answer: "O",
          originalRow: { 번호: "3" },
        },
      ],
    };

    const wrong = getWrongQuestions(session);
    expect(wrong).toHaveLength(2);
    expect(wrong.map((q) => q.no)).toEqual([1, 2]);
  });
});

