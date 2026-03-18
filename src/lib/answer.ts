import { ParsedQuestion } from "../types/test";

export const getAnswerToken = (answer: string) => (answer === "" ? "-" : answer);

export const getAnswerLabel = (question: ParsedQuestion, answer: string) => {
  if (!answer) return "미응답";
  if (!question.choices) return answer;

  const idx = Number(answer) - 1;
  const choice = question.choices[idx];
  if (!choice) return answer;

  const CIRCLED_NUMBERS = ["①", "②", "③", "④", "⑤"];
  return `${CIRCLED_NUMBERS[idx] ?? answer} ${choice}`;
};

