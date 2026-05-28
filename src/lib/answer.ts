import { ParsedQuestion } from "../types/test";

export const getAnswerToken = (answer: string) => (answer === "" ? "-" : answer);

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
