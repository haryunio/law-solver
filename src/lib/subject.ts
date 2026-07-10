import { NO_SUBJECT_ID, Subject } from "../types/test";

export type SubjectDropPlacement = "before" | "after";

export const getSubjectDashboardPath = (subjectId?: string | null) =>
  `/dashboard/${subjectId || NO_SUBJECT_ID}`;

export const reorderSubjects = (
  subjects: Subject[],
  sourceSubjectId: string,
  targetSubjectId: string,
  placement: SubjectDropPlacement = "before",
) => {
  if (sourceSubjectId === targetSubjectId) return subjects;

  const sourceIndex = subjects.findIndex((subject) => subject.id === sourceSubjectId);
  if (sourceIndex < 0 || !subjects.some((subject) => subject.id === targetSubjectId)) {
    return subjects;
  }

  const nextSubjects = [...subjects];
  const [sourceSubject] = nextSubjects.splice(sourceIndex, 1);
  if (!sourceSubject) return subjects;

  const targetIndex = nextSubjects.findIndex((subject) => subject.id === targetSubjectId);
  const insertionIndex = targetIndex + (placement === "after" ? 1 : 0);
  nextSubjects.splice(insertionIndex, 0, sourceSubject);

  return nextSubjects;
};
