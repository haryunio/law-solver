import { describe, expect, it } from "vitest";
import { legalEthicsAnswers } from "./data";

describe("제17회 법조윤리시험 가답안", () => {
  it("contains one answer and explanation for every question", () => {
    expect(legalEthicsAnswers).toHaveLength(40);
    expect(legalEthicsAnswers.map((item) => item.number)).toEqual(
      Array.from({ length: 40 }, (_, index) => index + 1),
    );
    legalEthicsAnswers.forEach((item) => {
      expect(item.answer).toBeGreaterThanOrEqual(1);
      expect(item.answer).toBeLessThanOrEqual(4);
      expect(item.topic.length).toBeGreaterThan(0);
      expect(item.explanation.length).toBeGreaterThan(20);
    });
  });

  it("matches the supplied provisional answer table", () => {
    expect(legalEthicsAnswers.map((item) => item.answer)).toEqual([
      3, 4, 4, 2, 3, 4, 2, 3, 4, 3,
      3, 2, 3, 4, 2, 2, 3, 3, 1, 4,
      2, 1, 1, 2, 1, 3, 4, 3, 1, 2,
      4, 2, 4, 3, 1, 2, 1, 4, 3, 1,
    ]);
  });
});
