import { NO_SUBJECT_ID } from "../types/test";

export const getSubjectDashboardPath = (subjectId?: string | null) =>
  `/dashboard/${subjectId || NO_SUBJECT_ID}`;
