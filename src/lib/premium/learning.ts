import { createId } from "../id";
import { apiRequest } from "./transport";
import type { PremiumCourse, PremiumProblemSetSummary, PremiumAttemptSummary, PremiumAttempt, PremiumQuestionSolution, PremiumAttemptResult } from "./types";

export const listPremiumCourses = () =>
  apiRequest<PremiumCourse[]>("learning-api", "/courses");

export const listPremiumProblemSets = (courseId: string) =>
  apiRequest<PremiumProblemSetSummary[]>(
    "learning-api",
    `/courses/${encodeURIComponent(courseId)}/problem-sets`,
  );

export const listPremiumProblemSetAttempts = (problemSetId: string) =>
  apiRequest<PremiumAttemptSummary[]>(
    "learning-api",
    `/problem-sets/${encodeURIComponent(problemSetId)}/attempts`,
  );

export const createPremiumAttempt = (problemSetId: string) =>
  apiRequest<PremiumAttempt>("learning-api", "/attempts", {
    method: "POST",
    body: JSON.stringify({ problemSetId, idempotencyKey: `web-attempt-${createId()}` }),
  });

export const getPremiumAttempt = (attemptId: string) =>
  apiRequest<PremiumAttempt>("learning-api", `/attempts/${encodeURIComponent(attemptId)}`);

export const getPremiumQuestionSolution = (attemptId: string, questionId: string) =>
  apiRequest<PremiumQuestionSolution>(
    "learning-api",
    `/attempts/${encodeURIComponent(attemptId)}/solutions/${encodeURIComponent(questionId)}`,
  );

export const savePremiumAnswer = (
  attemptId: string,
  questionId: string,
  answer: string | null,
  expectedRevision: number,
) => apiRequest<PremiumAttempt>(
  "learning-api",
  `/attempts/${encodeURIComponent(attemptId)}/answers/${encodeURIComponent(questionId)}`,
  {
    method: "PUT",
    body: JSON.stringify({ answer, expectedRevision }),
  },
);

export const setPremiumBookmark = (
  attemptId: string,
  questionId: string,
  bookmarked: boolean,
  expectedRevision: number,
) => apiRequest<PremiumAttempt>(
  "learning-api",
  `/attempts/${encodeURIComponent(attemptId)}/bookmarks/${encodeURIComponent(questionId)}`,
  {
    method: "PUT",
    body: JSON.stringify({ bookmarked, expectedRevision }),
  },
);

export const pausePremiumAttempt = (attemptId: string, expectedRevision: number) =>
  apiRequest<PremiumAttempt>(
    "learning-api",
    `/attempts/${encodeURIComponent(attemptId)}/pause`,
    { method: "POST", body: JSON.stringify({ expectedRevision }) },
  );

export const resumePremiumAttempt = (attemptId: string, expectedRevision: number) =>
  apiRequest<PremiumAttempt>(
    "learning-api",
    `/attempts/${encodeURIComponent(attemptId)}/resume`,
    { method: "POST", body: JSON.stringify({ expectedRevision }) },
  );

export const submitPremiumAttempt = (attemptId: string, expectedRevision: number) =>
  apiRequest<PremiumAttemptResult>(
    "learning-api",
    `/attempts/${encodeURIComponent(attemptId)}/submit`,
    { method: "POST", body: JSON.stringify({ expectedRevision }) },
  );

export const getPremiumResult = (attemptId: string) =>
  apiRequest<PremiumAttemptResult>(
    "learning-api",
    `/attempts/${encodeURIComponent(attemptId)}/result`,
  );

export const retryPremiumAttempt = (
  attemptId: string,
  mode: "all" | "incorrect" | "bookmarked",
  title: string,
  orderMode: "number" | "chapter-random" | "random",
) =>
  apiRequest<PremiumAttempt>(
    "learning-api",
    `/attempts/${encodeURIComponent(attemptId)}/retry`,
    {
      method: "POST",
      body: JSON.stringify({
        mode,
        title,
        orderMode,
        idempotencyKey: `web-retry-${createId()}`,
      }),
    },
  );

export const savePremiumWrongNote = (
  attemptId: string,
  questionId: string,
  note: string,
  expectedRevision: number,
) => apiRequest<PremiumAttemptResult>(
  "learning-api",
  `/attempts/${encodeURIComponent(attemptId)}/notes/${encodeURIComponent(questionId)}`,
  {
    method: "PUT",
    body: JSON.stringify({ note, expectedRevision }),
  },
);

