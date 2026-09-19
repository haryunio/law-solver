import { ParsedQuestion } from "../types/test";

export const normalizeChoiceAnswer = (value: string): string | null => {
  if (value.trim() === "0") return "0";
  const tokens = value.split(",").map((token) => token.trim());
  if (tokens.some((token) => !/^[1-5]$/.test(token))) return null;
  return [...new Set(tokens)].sort().join(",");
};

export const hasNoCorrectChoice = (question: Pick<ParsedQuestion, "answer" | "choices">): boolean =>
  Boolean(question.choices) && normalizeChoiceAnswer(question.answer) === "0";

export const isCorrectAnswer = (
  question: Pick<ParsedQuestion, "answer" | "choices">,
  response: string,
): boolean => {
  if (hasNoCorrectChoice(question)) return true;
  if (response === "") return false;
  if (!question.choices) return response === question.answer;
  if (!/^[1-5]$/.test(response)) return false;
  return normalizeChoiceAnswer(question.answer)?.split(",").includes(response) ?? false;
};

export const getAnswerToken = (answer: string) => (answer === "" ? "-" : answer);

export const getQuestionAnswerToken = (question: Pick<ParsedQuestion, "answer" | "choices">) =>
  hasNoCorrectChoice(question) ? "정답 없음" : getAnswerToken(question.answer);

export const getAnswerParts = (question: ParsedQuestion, answer: string) => {
  if (!answer) return { circle: null, text: "미응답" };
  if (!question.choices) return { circle: null, text: answer };

  const idx = Number(answer) - 1;
  const choice = question.choices[idx];
  if (!choice) return { circle: null, text: answer };

  const CIRCLED_NUMBERS = ["①", "②", "③", "④", "⑤"];
  return {
    circle: CIRCLED_NUMBERS[idx] ?? answer,
    text: choice,
  };
};

export const getAnswerLabel = (question: ParsedQuestion, answer: string) => {
  const { circle, text } = getAnswerParts(question, answer);
  return circle ? `${circle} ${text}` : text;
};
