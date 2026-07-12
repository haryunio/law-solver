import { describe, expect, it } from "vitest";
import questions from "./questions.ko.json";

const axisPoles: Record<string, readonly string[]> = {
  source: ["P", "T"],
  coverage: ["W", "C"],
  recall: ["R", "O"],
  pace: ["S", "D"],
};

describe("LBTI Korean question set", () => {
  it("contains 30 ordered questions with standard, bonus, and supplementary roles", () => {
    expect(questions.questions).toHaveLength(30);
    expect(questions.questionnaire.question_count).toBe(30);
    expect(questions.questionnaire.scored_question_count).toBe(29);
    expect(questions.questionnaire.standard_question_count).toBe(28);
    expect(questions.questionnaire.bonus_question_count).toBe(1);
    expect(questions.questionnaire.questions_per_axis).toBe(7);

    questions.questions.forEach((question, index) => {
      expect(question.id).toBe(`q${String(index + 1).padStart(2, "0")}`);
    });

    Object.keys(axisPoles).forEach((axisId) => {
      expect(
        questions.questions.filter(
          (question) => question.axis_id === axisId && !("scoring_mode" in question),
        ),
      ).toHaveLength(7);
    });
    expect(questions.questions.filter((question) => question.scored === false)).toHaveLength(1);
    expect(questions.questions.filter((question) => question.scoring_mode === "bonus")).toHaveLength(1);
  });

  it("uses valid mixed pole directions and unique natural-language prompts", () => {
    const prompts = questions.questions.map((question) => question.prompt);

    expect(new Set(prompts).size).toBe(prompts.length);
    prompts.forEach((prompt) => expect(prompt.endsWith(".")).toBe(true));

    Object.entries(axisPoles).forEach(([axisId, poles]) => {
      const axisQuestions = questions.questions.filter(
        (question) => question.axis_id === axisId && !("scoring_mode" in question),
      );
      const poleCounts = poles.map(
        (pole) => axisQuestions.filter((question) => question.agreement_pole === pole).length,
      );

      expect(Math.abs(poleCounts[0]! - poleCounts[1]!)).toBe(1);
      axisQuestions.forEach((question) => {
        expect(poles).toContain(question.agreement_pole);
      });
    });
  });

  it("defines a four-point scale whose axis scores cannot tie", () => {
    expect(questions.questionnaire.scale.map((option) => option.weight)).toEqual([3, 2, 1, 0]);
    expect(questions.questionnaire.scale.map((option) => option.label)).toEqual([
      "매우 그렇다",
      "그렇다",
      "그렇지 않다",
      "전혀 그렇지 않다",
    ]);

    const maxItemWeight = Math.max(...questions.questionnaire.scale.map((option) => option.weight));
    const axisTotal = questions.questionnaire.questions_per_axis * maxItemWeight;

    expect(axisTotal).toBe(questions.questionnaire.scoring.axis_total);
    expect(axisTotal % 2).toBe(1);
  });
});
