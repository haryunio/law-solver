import { describe, expect, it } from "vitest";
import type { ParsedQuestion } from "../types/test";
import { getAnswerToken, getQuestionAnswerToken, hasNoCorrectChoice, isCorrectAnswer, normalizeChoiceAnswer } from "./answer";

const choices: ParsedQuestion["choices"] = ["하나", "둘", "셋", "넷", "다섯"];

describe("normalizeChoiceAnswer", () => {
  it("normalizes whitespace and deduplicates accepted answers in choice order", () => {
    expect(normalizeChoiceAnswer("1")).toBe("1");
    expect(normalizeChoiceAnswer("1,2")).toBe("1,2");
    expect(normalizeChoiceAnswer(" 5, 2,1, 2 ")).toBe("1,2,5");
    expect(normalizeChoiceAnswer("3, 3")).toBe("3");
    expect(normalizeChoiceAnswer(" 0 ")).toBe("0");
  });

  it("rejects missing choices, out-of-range values, and other answer formats", () => {
    for (const value of ["", " ", "0,1", "0,0", "6", "1,6", ",1", "1,", "1,,2", "1 2", "1;2", "01", "1.0", "O", "1,X"]) {
      expect(normalizeChoiceAnswer(value), value).toBeNull();
    }
  });
});

describe("isCorrectAnswer", () => {
  it("accepts either allowed choice while requiring one selected answer", () => {
    const question = { choices, answer: "2, 1,2" };
    expect(isCorrectAnswer(question, "1")).toBe(true);
    expect(isCorrectAnswer(question, "2")).toBe(true);
    for (const response of ["3", "", "1,2", "1,1", " 1 ", "01", "1.0", "0", "6"]) {
      expect(isCorrectAnswer(question, response), response).toBe(false);
    }
    expect(isCorrectAnswer({ choices, answer: "1,6" }, "1")).toBe(false);
    expect(isCorrectAnswer({ choices, answer: "" }, "")).toBe(false);
  });

  it("awards a choice question with no correct option even when it is unanswered", () => {
    const question = { choices, answer: " 0 " };
    expect(hasNoCorrectChoice(question)).toBe(true);
    expect(getQuestionAnswerToken(question)).toBe("정답 없음");
    for (const response of ["", "1", "2", "3", "4", "5"]) {
      expect(isCorrectAnswer(question, response), response).toBe(true);
    }
    expect(hasNoCorrectChoice({ choices, answer: "0,1" })).toBe(false);
    expect(isCorrectAnswer({ choices, answer: "0,1" }, "1")).toBe(false);
    expect(getQuestionAnswerToken({ choices, answer: "1,2" })).toBe("1,2");
  });

  it("keeps OX and short answers as exact strings, including commas", () => {
    expect(isCorrectAnswer({ answer: "O" }, "O")).toBe(true);
    expect(isCorrectAnswer({ answer: "O" }, "o")).toBe(false);
    expect(isCorrectAnswer({ answer: "1,2" }, "1,2")).toBe(true);
    expect(isCorrectAnswer({ answer: "1,2" }, "1")).toBe(false);
    expect(isCorrectAnswer({ answer: "1,2" }, "1, 2")).toBe(false);
    expect(isCorrectAnswer({ answer: "해제, 해지" }, "해제, 해지")).toBe(true);
    expect(isCorrectAnswer({ answer: "해제, 해지" }, "해제")).toBe(false);
    expect(isCorrectAnswer({ answer: "" }, "")).toBe(false);
    expect(hasNoCorrectChoice({ answer: "0" })).toBe(false);
    expect(isCorrectAnswer({ answer: "0" }, "0")).toBe(true);
    expect(isCorrectAnswer({ answer: "0" }, "")).toBe(false);
    expect(isCorrectAnswer({ answer: "0" }, "1")).toBe(false);
    expect(getQuestionAnswerToken({ answer: "0" })).toBe("0");
    expect(getAnswerToken("1,2")).toBe("1,2");
  });
});
