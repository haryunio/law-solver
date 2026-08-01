import { describe, expect, it } from "vitest";
import { legalEthicsAnswers } from "./data";
import { gradeLegalEthicsAnswers, parseLegalEthicsAnswers } from "./grading";

describe("제17회 법조윤리시험 자동채점", () => {
  it("accepts continuous or separated answer digits", () => {
    expect(parseLegalEthicsAnswers("3 4,4-2").answers).toEqual([3, 4, 4, 2]);
    expect(parseLegalEthicsAnswers("3442").answers).toEqual([3, 4, 4, 2]);
  });

  it("reports digits outside the available choices", () => {
    expect(parseLegalEthicsAnswers("1 2 0 5")).toEqual({
      answers: [1, 2],
      invalidDigits: ["0", "5"],
    });
  });

  it("grades exactly 40 answers", () => {
    const answerKey = legalEthicsAnswers.map((item) => item.answer);
    expect(gradeLegalEthicsAnswers(answerKey)).toMatchObject({
      correctCount: 40,
      incorrectCount: 0,
      score: 100,
    });
    expect(gradeLegalEthicsAnswers(answerKey.slice(0, 39))).toBeNull();
  });

  it("returns the submitted and correct choices for missed questions", () => {
    const submitted = legalEthicsAnswers.map((item) => item.answer);
    submitted[0] = 1;

    expect(gradeLegalEthicsAnswers(submitted)?.incorrectAnswers).toEqual([
      { number: 1, submitted: 1, correct: 3 },
    ]);
  });
});
