import { NO_SUBJECT_ID } from "../types/test";

export const getOfflineProblemSetPath = (problemSetId: string, subjectId?: string | null) =>
  `/dashboard/${encodeURIComponent(subjectId || NO_SUBJECT_ID)}/problem-sets/${encodeURIComponent(problemSetId)}`;
