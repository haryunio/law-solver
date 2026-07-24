import type {
  PremiumAttempt,
  PremiumAttemptResult,
  PremiumQuestion,
} from "./premiumApi";
import type {
  AnswerValue,
  ParsedQuestion,
  TestSession,
  TestType,
} from "../types/test";

const emptyOriginalRow = (question: PremiumQuestion) => ({
  번호: String(question.position),
  챕터: question.chapter,
  문제: question.prompt,
  ...Object.fromEntries((question.boxes ?? []).map((box, index) => [`박스${index + 1}`, box])),
  ...Object.fromEntries(
    (question.choices ?? []).map((choice, index) => [`선택지${index + 1}`, choice]),
  ),
  정답: question.correctAnswer ?? "",
  해설: question.explanation ?? "",
  출처: question.source,
});

const toTestType = (questionType?: PremiumQuestion["type"]): TestType => {
  if (questionType === "ox") return "OX";
  if (questionType === "short_answer") return "short";
  return "5-choice";
};

export const premiumQuestionToParsedQuestion = (question: PremiumQuestion): ParsedQuestion => ({
  id: question.id,
  no: question.position,
  chapter: question.chapter || undefined,
  question: question.prompt,
  boxes: question.boxes ?? undefined,
  choices: question.type === "multiple_choice" && question.choices?.length === 5
    ? question.choices as [string, string, string, string, string]
    : undefined,
  answer: (question.correctAnswer ?? "") as AnswerValue,
  explanation: question.explanation || undefined,
  source: question.source || undefined,
  my_answer: (question.answer ?? "") as AnswerValue | "",
  wrong_note: question.wrongNote ?? "",
  bookmark: question.bookmarked ?? false,
  originalRow: emptyOriginalRow(question),
});

export const premiumAttemptToTestSession = (
  attempt: PremiumAttempt,
  elapsedSeconds = attempt.elapsedSeconds,
): TestSession => {
  const questions = attempt.questions.map(premiumQuestionToParsedQuestion);
  return {
    id: attempt.id,
    title: attempt.title,
    type: toTestType(attempt.questions[0]?.type),
    order_mode: attempt.orderMode,
    total_questions: questions.length,
    solved_questions: questions.filter((question) => question.my_answer !== "").length,
    score: 0,
    elapsed_time: elapsedSeconds,
    created_at: attempt.startedAt,
    status: attempt.status === "submitted" ? "completed" : "in-progress",
    questions,
  };
};

export const premiumResultToTestSession = (result: PremiumAttemptResult): TestSession => {
  const questions = result.questions.map(premiumQuestionToParsedQuestion);
  return {
    id: result.id,
    title: result.title,
    type: toTestType(result.questions[0]?.type),
    order_mode: result.orderMode,
    total_questions: questions.length,
    solved_questions: questions.filter((question) => question.my_answer !== "").length,
    score: result.maxScore > 0 ? Math.round((result.score / result.maxScore) * 100) : 0,
    elapsed_time: result.elapsedSeconds,
    created_at: result.startedAt,
    status: "completed",
    questions,
  };
};
