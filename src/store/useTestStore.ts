import { createId } from "../lib/id";
import { orderQuestions } from "../lib/order";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { AnswerValue, ParsedQuestion, SolveOrder, TestSession, TestType } from "../types/test";

interface CreateSessionInput {
  title: string;
  type: TestType;
  orderMode: SolveOrder;
  questions: ParsedQuestion[];
}

interface TestStore {
  sessions: TestSession[];
  createSession: (input: CreateSessionInput) => string;
  deleteSession: (sessionId: string) => void;
  updateAnswer: (sessionId: string, questionId: string, answer: AnswerValue) => void;
  updateWrongNote: (sessionId: string, questionId: string, note: string) => void; // 추가
  tickElapsedTime: (sessionId: string) => void;
  submitSession: (sessionId: string) => void;
  getSessionById: (sessionId: string) => TestSession | undefined;
  resetSessions: () => void;
  importSessions: (sessions: TestSession[]) => void;
}

const calcSolved = (questions: ParsedQuestion[]) =>
  questions.filter((q) => q.my_answer !== "").length;

const calcScore = (questions: ParsedQuestion[]) => {
  if (!questions.length) return 0;
  const correct = questions.filter((q) => q.my_answer !== "" && q.my_answer === q.answer).length;
  return Math.round((correct / questions.length) * 100);
};

export const useTestStore = create<TestStore>()(
  persist(
    (set, get) => ({
      sessions: [],
      createSession: ({ title, type, orderMode, questions }) => {
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
        set((state) => ({ sessions: [session, ...state.sessions] }));
        return id;
      },
      deleteSession: (sessionId) =>
        set((state) => ({
          sessions: state.sessions.filter((session) => session.id !== sessionId),
        })),
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
      resetSessions: () => set({ sessions: [] }),
      importSessions: (sessions) => set({ sessions }),
    }),
    {
      name: "law-solver-storage",
      version: 1,
    },
  ),
);
