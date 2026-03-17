import { ParsedQuestion, TestSession } from "../types/test";

export const getCorrectCount = (questions: ParsedQuestion[]) =>
  questions.filter((q) => q.my_answer !== "" && q.my_answer === q.answer).length;

export const getWrongQuestions = (session: TestSession) =>
  session.questions.filter((q) => q.my_answer !== q.answer);

export const isCorrectQuestion = (question: ParsedQuestion) =>
  question.my_answer !== "" && question.my_answer === question.answer;
