import { describe, expect, it } from "vitest";
import { getCorrectCount, getWrongQuestions, isCorrectQuestion } from "./session";
import { ParsedQuestion, TestSession } from "../types/test";

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

  it("uses accepted choice alternatives consistently for score and retry candidates", () => {
    const responses = ["1", "2", "3", "", "1,2"];
    const questions: ParsedQuestion[] = responses.map((response, index) => ({
      id: `q${index + 1}`,
      no: index + 1,
      question: `가상 문항 ${index + 1}`,
      choices: ["하나", "둘", "셋", "넷", "다섯"],
      answer: "1, 2",
      my_answer: response,
      originalRow: {},
    }));
    questions.push(...["4", ""].map((response, index): ParsedQuestion => ({
      id: `no-correct-${index}`,
      no: index + 6,
      question: "정답이 없는 문항",
      choices: ["하나", "둘", "셋", "넷", "다섯"],
      answer: "0",
      my_answer: response,
      originalRow: {},
    })));
    const session: TestSession = {
      id: "choice-session",
      title: "복수 허용 정답",
      type: "5-choice",
      total_questions: questions.length,
      solved_questions: 5,
      score: 57,
      elapsed_time: 60,
      created_at: "2026-09-21T00:00:00Z",
      status: "completed",
      questions,
    };

    expect(getCorrectCount(questions)).toBe(4);
    expect(questions.map(isCorrectQuestion)).toEqual([true, true, false, false, false, true, true]);
    expect(getWrongQuestions(session).map((question) => question.no)).toEqual([3, 4, 5]);
  });
});
