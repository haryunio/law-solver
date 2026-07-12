import { describe, expect, it } from "vitest";
import { calculateLbtiResult, getOppositeType, getRelatedTypes, lbtiQuestions } from "./lbti";

describe("LBTI domain", () => {
  it("calculates a valid four-letter result from complete answers", () => {
    const answers = Object.fromEntries(lbtiQuestions.map((question) => [question.id, 3]));
    const result = calculateLbtiResult(answers);

    expect(result.code).toBe("PCRD");
    expect(result.axisScores).toHaveLength(4);
    result.axisScores.forEach((axis) => {
      expect(axis.leftScore + axis.rightScore).toBe(axis.axisId === "pace" ? 23 : 21);
    });
  });

  it("rejects incomplete or invalid answers", () => {
    expect(() => calculateLbtiResult({})).toThrow("Missing answer");
    const answers = Object.fromEntries(lbtiQuestions.map((question) => [question.id, 3]));
    answers.q01 = 5;
    expect(() => calculateLbtiResult(answers)).toThrow("Invalid answer");
  });

  it("uses study-time tracking as a small Steady bonus", () => {
    const answers = Object.fromEntries(lbtiQuestions.map((question) => [question.id, 3]));
    answers.q08 = 2;

    expect(calculateLbtiResult(answers).code).toBe("PCRS");
  });

  it("finds nearby and fully opposite types", () => {
    expect(getRelatedTypes("PWOS")).toHaveLength(3);
    expect(getOppositeType("PWOS")?.code).toBe("TCRD");
  });
});
