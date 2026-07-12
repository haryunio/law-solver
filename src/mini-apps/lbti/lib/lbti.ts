import framework from "../data/lbti-framework.json";
import questionnaire from "../data/questions.ko.json";

export type AxisId = "source" | "coverage" | "recall" | "pace";
export type PoleCode = "P" | "T" | "W" | "C" | "R" | "O" | "S" | "D";
export type TypeCode =
  | "PWRS"
  | "PWRD"
  | "PWOS"
  | "PWOD"
  | "PCRS"
  | "PCRD"
  | "PCOS"
  | "PCOD"
  | "TWRS"
  | "TWRD"
  | "TWOS"
  | "TWOD"
  | "TCRS"
  | "TCRD"
  | "TCOS"
  | "TCOD";

export type LbtiAnswers = Record<string, number>;

export interface AxisScore {
  axisId: AxisId;
  axisName: string;
  leftCode: PoleCode;
  leftLabel: string;
  leftScore: number;
  rightCode: PoleCode;
  rightLabel: string;
  rightScore: number;
  winner: PoleCode;
  winnerPercent: number;
}

export interface LbtiCalculation {
  code: TypeCode;
  axisScores: AxisScore[];
}

const axisIds: AxisId[] = ["source", "coverage", "recall", "pace"];
const validTypeCodes = new Set(framework.types.map((type) => type.code));

export const lbtiQuestions = questionnaire.questions;
export const lbtiScale = questionnaire.questionnaire.scale;
export const lbtiAxes = framework.axes;
export const lbtiTypes = framework.types;

export function isTypeCode(value: string): value is TypeCode {
  return validTypeCodes.has(value.toUpperCase());
}

export function getTypeDefinition(code: string) {
  const normalizedCode = code.toUpperCase();
  if (!isTypeCode(normalizedCode)) return null;
  return framework.types.find((type) => type.code === normalizedCode) ?? null;
}

export function getAxisDefinition(axisId: AxisId) {
  return framework.axes.find((axis) => axis.id === axisId)!;
}

const getOppositePole = (axisId: AxisId, pole: string): PoleCode => {
  const axis = getAxisDefinition(axisId);
  return (axis.left.code === pole ? axis.right.code : axis.left.code) as PoleCode;
};

export function calculateLbtiResult(answers: LbtiAnswers): LbtiCalculation {
  const missingQuestion = lbtiQuestions.find((question) => answers[question.id] === undefined);
  if (missingQuestion) throw new Error(`Missing answer for ${missingQuestion.id}`);

  const scores = new Map<PoleCode, number>();
  const baseScores = new Map<PoleCode, number>();
  lbtiAxes.forEach((axis) => {
    scores.set(axis.left.code as PoleCode, 0);
    scores.set(axis.right.code as PoleCode, 0);
    baseScores.set(axis.left.code as PoleCode, 0);
    baseScores.set(axis.right.code as PoleCode, 0);
  });

  lbtiQuestions.forEach((question) => {
    const answerWeight = answers[question.id];
    if (answerWeight === undefined || !lbtiScale.some((option) => option.weight === answerWeight)) {
      throw new Error(`Invalid answer for ${question.id}`);
    }

    if ("scored" in question && question.scored === false) return;

    const agreementPole = question.agreement_pole as PoleCode;
    if ("scoring_mode" in question && question.scoring_mode === "bonus") {
      const bonus = Math.max(0, answerWeight - 1);
      scores.set(agreementPole, (scores.get(agreementPole) ?? 0) + bonus);
      return;
    }

    const oppositePole = getOppositePole(question.axis_id as AxisId, agreementPole);
    scores.set(agreementPole, (scores.get(agreementPole) ?? 0) + answerWeight);
    scores.set(oppositePole, (scores.get(oppositePole) ?? 0) + (3 - answerWeight));
    baseScores.set(agreementPole, (baseScores.get(agreementPole) ?? 0) + answerWeight);
    baseScores.set(oppositePole, (baseScores.get(oppositePole) ?? 0) + (3 - answerWeight));
  });

  const axisScores = axisIds.map((axisId): AxisScore => {
    const axis = getAxisDefinition(axisId);
    const leftCode = axis.left.code as PoleCode;
    const rightCode = axis.right.code as PoleCode;
    const leftScore = scores.get(leftCode) ?? 0;
    const rightScore = scores.get(rightCode) ?? 0;
    const winner = leftScore === rightScore
      ? ((baseScores.get(leftCode) ?? 0) > (baseScores.get(rightCode) ?? 0) ? leftCode : rightCode)
      : (leftScore > rightScore ? leftCode : rightCode);

    return {
      axisId,
      axisName: axis.name,
      leftCode,
      leftLabel: axis.left.label,
      leftScore,
      rightCode,
      rightLabel: axis.right.label,
      rightScore,
      winner,
      winnerPercent: Math.round((Math.max(leftScore, rightScore) / (leftScore + rightScore)) * 100),
    };
  });

  const code = axisScores.map((axis) => axis.winner).join("") as TypeCode;
  if (!isTypeCode(code)) throw new Error(`Unknown LBTI result: ${code}`);

  return { code, axisScores };
}

export function getSelectedPoles(code: TypeCode) {
  return axisIds.map((axisId, index) => {
    const axis = getAxisDefinition(axisId);
    const selectedCode = code[index] as PoleCode;
    const selected = axis.left.code === selectedCode ? axis.left : axis.right;
    const opposite = axis.left.code === selectedCode ? axis.right : axis.left;
    return {
      axisId,
      axis,
      selected: { ...selected, code: selected.code as PoleCode },
      opposite: { ...opposite, code: opposite.code as PoleCode },
    };
  });
}

const hammingDistance = (first: string, second: string) =>
  [...first].reduce((distance, character, index) => distance + (character === second[index] ? 0 : 1), 0);

export function getRelatedTypes(code: TypeCode, limit = 3) {
  return framework.types
    .filter((type) => type.code !== code)
    .sort((first, second) => hammingDistance(code, first.code) - hammingDistance(code, second.code))
    .slice(0, limit);
}

export function getOppositeType(code: TypeCode) {
  const opposite = axisIds
    .map((axisId, index) => getOppositePole(axisId, code[index]!))
    .join("");
  return getTypeDefinition(opposite);
}
