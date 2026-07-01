import { createId } from "../lib/id";
import { orderQuestions } from "../lib/order";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  AnswerValue,
  DashboardBackupData,
  NO_SUBJECT_ID,
  ParsedQuestion,
  SessionSubjectMap,
  SolveOrder,
  Subject,
  TestSession,
  TestType,
} from "../types/test";

interface CreateSessionInput {
  title: string;
  type: TestType;
  orderMode: SolveOrder;
  questions: ParsedQuestion[];
  subjectId?: string | null;
}

interface ImportDashboardDataInput {
  sessions: TestSession[];
  subjects?: Subject[];
  sessionSubjectMap?: SessionSubjectMap;
}

interface TestStore {
  sessions: TestSession[];
  subjects: Subject[];
  sessionSubjectMap: SessionSubjectMap;
  createSession: (input: CreateSessionInput) => string;
  deleteSession: (sessionId: string) => void;
  updateSessionTitle: (sessionId: string, title: string) => void;
  createSubject: (name: string) => string;
  renameSubject: (subjectId: string, name: string) => void;
  deleteSubject: (subjectId: string) => void;
  assignSessionSubject: (sessionId: string, subjectId: string | null) => void;
  getSessionSubjectId: (sessionId: string) => string | null;
  getDashboardBackupData: () => DashboardBackupData;
  updateAnswer: (sessionId: string, questionId: string, answer: AnswerValue) => void;
  updateWrongNote: (sessionId: string, questionId: string, note: string) => void;
  toggleBookmark: (sessionId: string, questionId: string) => void;
  tickElapsedTime: (sessionId: string) => void;
  submitSession: (sessionId: string) => void;
  getSessionById: (sessionId: string) => TestSession | undefined;
  resetSessions: () => void;
  importSessions: (sessions: TestSession[]) => void;
  importDashboardData: (data: ImportDashboardDataInput) => void;
}

const calcSolved = (questions: ParsedQuestion[]) =>
  questions.filter((q) => q.my_answer !== "").length;

const calcScore = (questions: ParsedQuestion[]) => {
  if (!questions.length) return 0;
  const correct = questions.filter((q) => q.my_answer !== "" && q.my_answer === q.answer).length;
  return Math.round((correct / questions.length) * 100);
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const normalizeSubjects = (value: unknown): Subject[] => {
  if (!Array.isArray(value)) return [];

  const seen = new Set<string>();
  return value.flatMap((subject) => {
    if (!isRecord(subject)) return [];
    const id = typeof subject.id === "string" ? subject.id : "";
    const name = typeof subject.name === "string" ? subject.name.trim() : "";
    const createdAt =
      typeof subject.created_at === "string" ? subject.created_at : new Date().toISOString();

    if (!id || id === NO_SUBJECT_ID || !name || seen.has(id)) return [];
    seen.add(id);
    return [{ id, name, created_at: createdAt }];
  });
};

const normalizeSessionSubjectMap = (
  value: unknown,
  sessions: TestSession[],
  subjects: Subject[],
): SessionSubjectMap => {
  if (!isRecord(value)) return {};

  const sessionIds = new Set(sessions.map((session) => session.id));
  const subjectIds = new Set(subjects.map((subject) => subject.id));

  return Object.entries(value).reduce<SessionSubjectMap>((acc, [sessionId, subjectId]) => {
    if (
      sessionIds.has(sessionId) &&
      typeof subjectId === "string" &&
      subjectId !== NO_SUBJECT_ID &&
      subjectIds.has(subjectId)
    ) {
      acc[sessionId] = subjectId;
    }
    return acc;
  }, {});
};

const normalizeDashboardData = (value: unknown): ImportDashboardDataInput => {
  const state = isRecord(value) ? value : {};
  const sessions = Array.isArray(state.sessions) ? (state.sessions as TestSession[]) : [];
  const subjects = normalizeSubjects(state.subjects);

  return {
    sessions,
    subjects,
    sessionSubjectMap: normalizeSessionSubjectMap(state.sessionSubjectMap, sessions, subjects),
  };
};

export const useTestStore = create<TestStore>()(
  persist(
    (set, get) => ({
      sessions: [],
      subjects: [],
      sessionSubjectMap: {},
      createSession: ({ title, type, orderMode, questions, subjectId }) => {
        const id = createId();
        const orderedQuestions = orderQuestions(questions, orderMode);
        const session: TestSession = {
          id,
          title,
          type,
          order_mode: orderMode,
          total_questions: orderedQuestions.length,
          solved_questions: 0,
          score: 0,
          elapsed_time: 0,
          created_at: new Date().toISOString(),
          status: "in-progress",
          questions: orderedQuestions,
        };
        set((state) => {
          const shouldAssign =
            subjectId &&
            subjectId !== NO_SUBJECT_ID &&
            state.subjects.some((subject) => subject.id === subjectId);

          return {
            sessions: [session, ...state.sessions],
            sessionSubjectMap: shouldAssign
              ? { ...state.sessionSubjectMap, [id]: subjectId }
              : state.sessionSubjectMap,
          };
        });
        return id;
      },
      deleteSession: (sessionId) =>
        set((state) => {
          const { [sessionId]: _deleted, ...nextMap } = state.sessionSubjectMap;
          return {
            sessions: state.sessions.filter((session) => session.id !== sessionId),
            sessionSubjectMap: nextMap,
          };
        }),
      updateSessionTitle: (sessionId, title) =>
        set((state) => ({
          sessions: state.sessions.map((session) =>
            session.id === sessionId ? { ...session, title } : session,
          ),
        })),
      createSubject: (name) => {
        const trimmedName = name.trim();
        if (!trimmedName) return "";

        const id = createId();
        const subject: Subject = {
          id,
          name: trimmedName,
          created_at: new Date().toISOString(),
        };
        set((state) => ({ subjects: [...state.subjects, subject] }));
        return id;
      },
      renameSubject: (subjectId, name) => {
        const trimmedName = name.trim();
        if (!trimmedName || subjectId === NO_SUBJECT_ID) return;

        set((state) => ({
          subjects: state.subjects.map((subject) =>
            subject.id === subjectId ? { ...subject, name: trimmedName } : subject,
          ),
        }));
      },
      deleteSubject: (subjectId) =>
        set((state) => {
          if (subjectId === NO_SUBJECT_ID) return state;

          return {
            subjects: state.subjects.filter((subject) => subject.id !== subjectId),
            sessionSubjectMap: Object.entries(state.sessionSubjectMap).reduce<SessionSubjectMap>(
              (acc, [sessionId, mappedSubjectId]) => {
                if (mappedSubjectId !== subjectId) {
                  acc[sessionId] = mappedSubjectId;
                }
                return acc;
              },
              {},
            ),
          };
        }),
      assignSessionSubject: (sessionId, subjectId) =>
        set((state) => {
          const { [sessionId]: _previous, ...nextMap } = state.sessionSubjectMap;
          const shouldAssign =
            subjectId &&
            subjectId !== NO_SUBJECT_ID &&
            state.subjects.some((subject) => subject.id === subjectId);

          return {
            sessionSubjectMap: shouldAssign
              ? { ...nextMap, [sessionId]: subjectId }
              : nextMap,
          };
        }),
      getSessionSubjectId: (sessionId) => get().sessionSubjectMap[sessionId] ?? null,
      getDashboardBackupData: () => ({
        app: "law-solver",
        version: 2,
        exported_at: new Date().toISOString(),
        sessions: get().sessions,
        subjects: get().subjects,
        sessionSubjectMap: get().sessionSubjectMap,
      }),
      updateAnswer: (sessionId, questionId, answer) =>
        set((state) => ({
          sessions: state.sessions.map((session) => {
            if (session.id !== sessionId || session.status === "completed") return session;

            const nextQuestions = session.questions.map((question) =>
              question.id === questionId ? { ...question, my_answer: answer } : question,
            );
            return {
              ...session,
              questions: nextQuestions,
              solved_questions: calcSolved(nextQuestions),
            };
          }),
        })),
      updateWrongNote: (sessionId, questionId, note) =>
        set((state) => ({
          sessions: state.sessions.map((session) => {
            if (session.id !== sessionId) return session;
            return {
              ...session,
              questions: session.questions.map((q) =>
                q.id === questionId ? { ...q, wrong_note: note } : q,
              ),
            };
          }),
        })),
      toggleBookmark: (sessionId, questionId) =>
        set((state) => ({
          sessions: state.sessions.map((session) => {
            if (session.id !== sessionId) return session;
            return {
              ...session,
              questions: session.questions.map((q) =>
                q.id === questionId ? { ...q, bookmark: !q.bookmark } : q,
              ),
            };
          }),
        })),
      tickElapsedTime: (sessionId) =>
        set((state) => ({
          sessions: state.sessions.map((session) =>
            session.id === sessionId && session.status === "in-progress"
              ? { ...session, elapsed_time: session.elapsed_time + 1 }
              : session,
          ),
        })),
      submitSession: (sessionId) =>
        set((state) => ({
          sessions: state.sessions.map((session) => {
            if (session.id !== sessionId) return session;
            return {
              ...session,
              solved_questions: calcSolved(session.questions),
              score: calcScore(session.questions),
              status: "completed",
            };
          }),
        })),
      getSessionById: (sessionId) => get().sessions.find((session) => session.id === sessionId),
      resetSessions: () => set({ sessions: [], subjects: [], sessionSubjectMap: {} }),
      importSessions: (sessions) => set({ sessions, subjects: [], sessionSubjectMap: {} }),
      importDashboardData: (data) => set(normalizeDashboardData(data)),
    }),
    {
      name: "law-solver-storage",
      version: 2,
      migrate: (persistedState) => normalizeDashboardData(persistedState),
    },
  ),
);
