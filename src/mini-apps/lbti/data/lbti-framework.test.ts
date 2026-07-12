import { describe, expect, it } from "vitest";
import framework from "./lbti-framework.json";

const expectedTypeCodes = ["P", "T"].flatMap((source) =>
  ["W", "C"].flatMap((coverage) =>
    ["R", "O"].flatMap((recall) =>
      ["S", "D"].map((pace) => `${source}${coverage}${recall}${pace}`),
    ),
  ),
);

describe("LBTI content framework", () => {
  it("defines the four axes in result-code order", () => {
    expect(framework.test.code_order).toEqual(["source", "coverage", "recall", "pace"]);
    expect(framework.axes.map((axis) => axis.id)).toEqual(framework.test.code_order);
    expect(framework.test.questions_per_axis).toBe(7);
    expect(framework.test.recommended_question_count).toBe(30);
  });

  it("contains every four-axis result exactly once", () => {
    const actualTypeCodes = framework.types.map((type) => type.code);

    expect(new Set(actualTypeCodes).size).toBe(16);
    expect(actualTypeCodes).toEqual(expect.arrayContaining(expectedTypeCodes));
  });

  it("keeps the updated PWOS identity without a type-specific disclaimer", () => {
    const pwos = framework.types.find((type) => type.code === "PWOS");

    expect(pwos?.name).toBe("대법관 꿈나무");
    expect(pwos).not.toHaveProperty("required_disclaimer");
  });
});
