import { ParsedQuestion, TestSession } from "../types/test";
import { isCorrectAnswer } from "./answer";

export const getCorrectCount = (questions: ParsedQuestion[]) =>
  questions.filter(isCorrectQuestion).length;

export const getWrongQuestions = (session: TestSession) =>
  session.questions.filter((q) => !isCorrectQuestion(q));

export const isCorrectQuestion = (question: ParsedQuestion) =>
  isCorrectAnswer(question, question.my_answer);
