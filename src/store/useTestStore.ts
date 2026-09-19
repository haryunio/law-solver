import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createId } from "../lib/id";
import { orderQuestions } from "../lib/order";
import { getCorrectCount, isCorrectQuestion } from "../lib/session";
import { reorderSubjects, type SubjectDropPlacement } from "../lib/subject";
import { DASHBOARD_BACKUP_VERSION, parseDashboardBackup, validateDashboardBackupVersion } from "../lib/dashboardBackup";
import { emptyOfflineResponse, materializeOfflineSession, toOfflineQuestion } from "../lib/offlineProblemSets";
import {
  createOfflineDataStorage,
  getOfflineDataStorageMessage,
  OFFLINE_DATA_STORAGE_KEY,
  OfflineDataStorageError,
  type OfflineDataStorageBackend,
} from "../lib/offlineDataStorage";
import {
  NO_SUBJECT_ID,
  type AnswerValue,
  type DashboardBackupData,
  type OfflineProblemSet,
  type OfflineRetryMode,
  type OfflineSession,
  type OfflineSessionResponse,
  type ParsedQuestion,
  type SolveOrder,
  type Subject,
  type SubjectCoverPalette,
  type TestSession,
  type TestType,
} from "../types/test";

export interface CreateProblemSetInput {
  title: string;
  type: TestType;
  questions: ParsedQuestion[];
  subjectId?: string | null;
}
interface CreateSessionInput {
  problemSetId: string;
  title?: string;
  orderMode?: SolveOrder;
  sourceSessionId?: string;
  retryMode?: OfflineRetryMode;
}
export interface PersistedTestState {
  problemSets: OfflineProblemSet[];
  sessions: OfflineSession[];
  subjects: Subject[];
  dataUpdatedAt: string;
}
interface TestStore extends PersistedTestState {
  createProblemSet: (input: CreateProblemSetInput) => string;
  createProblemSets: (inputs: CreateProblemSetInput[]) => string[];
  updateProblemSet: (id: string, updates: { title?: string; subjectId?: string | null }) => void;
  deleteProblemSet: (id: string) => void;
  createSession: (input: CreateSessionInput) => string;
  deleteSession: (id: string) => void;
  updateSessionTitle: (id: string, title: string) => void;
  createSubject: (name: string, coverPalette?: SubjectCoverPalette) => string;
  renameSubject: (id: string, name: string) => void;
  updateSubject: (id: string, updates: { name?: string; coverPalette?: SubjectCoverPalette }) => void;
  reorderSubject: (sourceId: string, targetId: string, placement?: SubjectDropPlacement) => void;
  deleteSubject: (id: string) => void;
  getSessionSubjectId: (id: string) => string | null;
  getDashboardBackupData: () => DashboardBackupData;
  updateAnswer: (sessionId: string, questionId: string, answer: AnswerValue) => void;
  updateWrongNote: (sessionId: string, questionId: string, note: string) => void;
  toggleBookmark: (sessionId: string, questionId: string) => void;
  tickElapsedTime: (id: string) => void;
  markSessionPlayed: (id: string) => void;
  submitSession: (id: string) => void;
  getSessionById: (id: string) => TestSession | undefined;
  resetSessions: () => Promise<void>;
  importSessions: (sessions: TestSession[]) => Promise<void>;
  importDashboardData: (data: unknown) => Promise<void>;
}

const modifiedNow = () => new Date().toISOString();
const emptyState = (): PersistedTestState => ({ problemSets: [], sessions: [], subjects: [], dataUpdatedAt: modifiedNow() });
const persistedTestState = ({ problemSets, sessions, subjects, dataUpdatedAt }: PersistedTestState): PersistedTestState =>
  ({ problemSets, sessions, subjects, dataUpdatedAt });
const normalizedState = (value: unknown): PersistedTestState => {
  const data = parseDashboardBackup(value);
  return { problemSets: data.problemSets, sessions: data.sessions, subjects: data.subjects, dataUpdatedAt: data.data_modified_at };
};
const selectedSubject = (subjectId: string | null | undefined, subjects: Subject[]): string | null => {
  if (!subjectId || subjectId === NO_SUBJECT_ID) return null;
  if (!subjects.some((subject) => subject.id === subjectId)) throw new Error("문제를 옮길 과목을 다시 선택해 주세요.");
  return subjectId;
};
const solvedCount = (responses: Record<string, OfflineSessionResponse>) => Object.values(responses).filter((response) => response.answer !== "").length;

export const offlineDataStorage = createOfflineDataStorage<PersistedTestState>();
const flushImportantOfflineChange = () => {
  queueMicrotask(() => void offlineDataStorage.flush().catch(() => undefined));
};

export type OfflineDataInitializationStatus =
  | { phase: "idle" | "loading"; backend: null; message: null }
  | { phase: "ready"; backend: OfflineDataStorageBackend; message: null }
  | { phase: "error"; backend: null; message: string };
let hydrationError: unknown = null;
let initializationPromise: Promise<void> | null = null;
let initializationStatus: OfflineDataInitializationStatus = { phase: "idle", backend: null, message: null };
const initializationListeners = new Set<() => void>();
const updateInitializationStatus = (status: OfflineDataInitializationStatus) => {
  initializationStatus = status;
  initializationListeners.forEach((listener) => listener());
};

export const useTestStore = create<TestStore>()(
  persist<TestStore, [], [], PersistedTestState>(
    (set, get) => {
      const changeSession = (id: string, update: (session: OfflineSession) => OfflineSession) => {
        set((state) => {
          const current = state.sessions.find((session) => session.id === id);
          if (!current) return state;
          const next = update(current);
          if (next === current) return state;
          return { sessions: state.sessions.map((session) => session.id === id ? next : session), dataUpdatedAt: modifiedNow() };
        });
      };
      const changeResponse = (id: string, questionId: string, update: (response: OfflineSessionResponse) => OfflineSessionResponse, activeOnly = false) => {
        changeSession(id, (session) => {
          if ((activeOnly && session.status === "completed") || !Object.prototype.hasOwnProperty.call(session.responses, questionId)) return session;
          const responses = { ...session.responses, [questionId]: update(session.responses[questionId]!) };
          return { ...session, responses, solved_questions: solvedCount(responses), ...(activeOnly ? { last_played_at: modifiedNow() } : {}) };
        });
        flushImportantOfflineChange();
      };
      return {
        ...emptyState(),
        createProblemSet: (input) => get().createProblemSets([input])[0]!,
        createProblemSets: (inputs) => {
          if (!inputs.length) return [];
          const now = modifiedNow();
          const state = get();
          const problems: OfflineProblemSet[] = inputs.map(({ title, type, questions, subjectId }) => ({
            id: createId(), title: title.trim(), type, subject_id: selectedSubject(subjectId, state.subjects),
            created_at: now, updated_at: now, questions: questions.map(toOfflineQuestion),
          }));
          // Validate the complete batch before publishing or persisting any of it.
          const normalized = normalizedState({ ...persistedTestState(state), problemSets: [...problems, ...state.problemSets], dataUpdatedAt: now });
          set(normalized);
          return problems.map((problem) => problem.id);
        },
        updateProblemSet: (id, updates) => {
          set((state) => {
            const problem = state.problemSets.find((item) => item.id === id);
            if (!problem) return state;
            const title = updates.title?.trim();
            const subjectId = updates.subjectId === undefined ? problem.subject_id : selectedSubject(updates.subjectId, state.subjects);
            const now = modifiedNow();
            return {
              problemSets: state.problemSets.map((item) => item.id === id ? { ...item, ...(title ? { title } : {}), subject_id: subjectId, updated_at: now } : item),
              dataUpdatedAt: now,
            };
          });
        },
        deleteProblemSet: (id) => set((state) => ({
          problemSets: state.problemSets.filter((problem) => problem.id !== id),
          sessions: state.sessions.filter((session) => session.problem_set_id !== id),
          dataUpdatedAt: modifiedNow(),
        })),
        createSession: ({ problemSetId, title, orderMode = "number", sourceSessionId, retryMode }) => {
          const state = get();
          const problem = state.problemSets.find((item) => item.id === problemSetId);
          if (!problem) throw new Error("풀이를 시작할 문제를 다시 선택해 주세요.");
          const source = sourceSessionId ? state.sessions.find((item) => item.id === sourceSessionId) : undefined;
          if ((sourceSessionId && (!source || source.problem_set_id !== problemSetId)) || (retryMode && !source)) {
            throw new Error("재풀이할 세션을 다시 선택해 주세요.");
          }
          const mode = source ? retryMode ?? "all" : null;
          const selected = source
            ? materializeOfflineSession(problem, source).questions.filter((question) => mode === "incorrect"
              ? !isCorrectQuestion(question) : mode === "bookmarked" ? question.bookmark : true)
            : problem.questions.map((question) => ({ ...question, my_answer: "" }));
          if (!selected.length) throw new Error("풀이할 문항이 없습니다. 문제나 재풀이 방식을 다시 선택해 주세요.");
          const id = createId();
          const now = modifiedNow();
          const order = orderQuestions(selected, orderMode).map((question) => question.id);
          const attemptNumber = state.sessions.reduce((max, session) => session.problem_set_id === problemSetId ? Math.max(max, session.attempt_number) : max, 0) + 1;
          const session: OfflineSession = {
            id, problem_set_id: problemSetId, title: title?.trim() || problem.title, order_mode: orderMode,
            total_questions: order.length, solved_questions: 0, score: 0, elapsed_time: 0,
            created_at: now, last_played_at: null, submitted_at: null, status: "in-progress",
            question_order: order, responses: Object.fromEntries(order.map((questionId) => [questionId, emptyOfflineResponse()])),
            attempt_number: attemptNumber, source_session_id: source?.id ?? null, retry_mode: mode,
          };
          set({ sessions: [session, ...state.sessions], dataUpdatedAt: now });
          return id;
        },
        deleteSession: (id) => set((state) => ({
          sessions: state.sessions.filter((session) => session.id !== id).map((session) => session.source_session_id === id ? { ...session, source_session_id: null } : session),
          dataUpdatedAt: modifiedNow(),
        })),
        updateSessionTitle: (id, title) => {
          const next = title.trim();
          if (next) changeSession(id, (session) => ({ ...session, title: next }));
        },
        createSubject: (name, coverPalette = "warm") => {
          const trimmed = name.trim();
          if (!trimmed) return "";
          const id = createId();
          const now = modifiedNow();
          set((state) => ({ subjects: [{ id, name: trimmed, created_at: now, cover_palette: coverPalette }, ...state.subjects], dataUpdatedAt: now }));
          return id;
        },
        renameSubject: (id, name) => get().updateSubject(id, { name }),
        updateSubject: (id, updates) => {
          if (id === NO_SUBJECT_ID) return;
          set((state) => ({
            subjects: state.subjects.map((subject) => subject.id === id ? {
              ...subject,
              ...(updates.name?.trim() ? { name: updates.name.trim() } : {}),
              ...(updates.coverPalette ? { cover_palette: updates.coverPalette } : {}),
            } : subject),
            dataUpdatedAt: modifiedNow(),
          }));
        },
        reorderSubject: (sourceId, targetId, placement = "before") => set((state) => ({
          subjects: reorderSubjects(state.subjects, sourceId, targetId, placement), dataUpdatedAt: modifiedNow(),
        })),
        deleteSubject: (id) => {
          if (id === NO_SUBJECT_ID) return;
          const now = modifiedNow();
          set((state) => ({
            subjects: state.subjects.filter((subject) => subject.id !== id),
            problemSets: state.problemSets.map((problem) => problem.subject_id === id ? { ...problem, subject_id: null, updated_at: now } : problem),
            dataUpdatedAt: now,
          }));
        },
        getSessionSubjectId: (id) => {
          const state = get();
          const session = state.sessions.find((item) => item.id === id);
          return state.problemSets.find((problem) => problem.id === session?.problem_set_id)?.subject_id ?? null;
        },
        getDashboardBackupData: () => {
          const state = get();
          return {
            app: "law-solver", version: DASHBOARD_BACKUP_VERSION, exported_at: modifiedNow(), data_modified_at: state.dataUpdatedAt,
            problemSets: state.problemSets, sessions: state.sessions, subjects: state.subjects,
          };
        },
        updateAnswer: (id, questionId, answer) => changeResponse(id, questionId, (response) => ({ ...response, answer }), true),
        updateWrongNote: (id, questionId, wrong_note) => changeResponse(id, questionId, (response) => ({ ...response, wrong_note })),
        toggleBookmark: (id, questionId) => changeResponse(id, questionId, (response) => ({ ...response, bookmark: !response.bookmark })),
        tickElapsedTime: (id) => changeSession(id, (session) => session.status === "in-progress"
          ? { ...session, elapsed_time: session.elapsed_time + 1, last_played_at: modifiedNow() } : session),
        markSessionPlayed: (id) => changeSession(id, (session) => session.status === "in-progress" ? { ...session, last_played_at: modifiedNow() } : session),
        submitSession: (id) => {
          const state = get();
          changeSession(id, (session) => {
            if (session.status === "completed") return session;
            const problem = state.problemSets.find((item) => item.id === session.problem_set_id);
            if (!problem) return session;
            const materialized = materializeOfflineSession(problem, session);
            const correct = getCorrectCount(materialized.questions);
            const now = modifiedNow();
            return { ...session, solved_questions: solvedCount(session.responses), score: session.total_questions ? Math.round(correct / session.total_questions * 100) : 0,
              status: "completed", last_played_at: now, submitted_at: now };
          });
          flushImportantOfflineChange();
        },
        getSessionById: (id) => {
          const state = get();
          const session = state.sessions.find((item) => item.id === id);
          const problem = state.problemSets.find((item) => item.id === session?.problem_set_id);
          return session && problem ? materializeOfflineSession(problem, session) : undefined;
        },
        resetSessions: async () => {
          const next = emptyState();
          await offlineDataStorage.writeDurably(OFFLINE_DATA_STORAGE_KEY, { state: next, version: DASHBOARD_BACKUP_VERSION });
          set(next);
        },
        importSessions: async (sessions) => get().importDashboardData(sessions),
        importDashboardData: async (data) => {
          const next = normalizedState(data);
          await offlineDataStorage.writeDurably(OFFLINE_DATA_STORAGE_KEY, { state: next, version: DASHBOARD_BACKUP_VERSION });
          set(next);
        },
      };
    },
    {
      name: OFFLINE_DATA_STORAGE_KEY,
      version: DASHBOARD_BACKUP_VERSION,
      storage: offlineDataStorage.storage,
      skipHydration: true,
      partialize: persistedTestState,
      migrate: (persistedState, version) => {
        // Zustand's version lives outside state; retain it for future-version rejection.
        validateDashboardBackupVersion(version);
        if (typeof persistedState !== "object" || persistedState === null || Array.isArray(persistedState)) return normalizedState(persistedState);
        return normalizedState({ ...persistedState, version });
      },
      merge: (persistedState, currentState) => persistedState === undefined
        ? currentState : { ...currentState, ...normalizedState(persistedState) },
      onRehydrateStorage: () => (_state, error) => { hydrationError = error ?? null; },
    },
  ),
);

export const subscribeOfflineDataInitialization = (listener: () => void) => {
  initializationListeners.add(listener);
  return () => {
    initializationListeners.delete(listener);
  };
};

export const getOfflineDataInitializationStatus = () => initializationStatus;

export const persistCurrentOfflineData = async () => {
  await offlineDataStorage.writeDurably(OFFLINE_DATA_STORAGE_KEY, {
    state: persistedTestState(useTestStore.getState()),
    version: DASHBOARD_BACKUP_VERSION,
  });
};

export const initializeOfflineData = () => {
  if (initializationStatus.phase === "ready") return Promise.resolve();
  if (initializationPromise) return initializationPromise;
  updateInitializationStatus({ phase: "loading", backend: null, message: null });
  initializationPromise = (async () => {
    const backend = await offlineDataStorage.prepare();
    hydrationError = null;
    await useTestStore.persist.rehydrate();
    if (hydrationError || !useTestStore.persist.hasHydrated()) {
      throw hydrationError ?? new Error("Offline data hydration did not finish");
    }
    try {
      await persistCurrentOfflineData();
    } catch (error) {
      if (!(error instanceof OfflineDataStorageError) || error.code !== "WRITE_CONFLICT") {
        throw error;
      }
      hydrationError = null;
      await useTestStore.persist.rehydrate();
      if (hydrationError || !useTestStore.persist.hasHydrated()) {
        throw hydrationError ?? error;
      }
    }
    await offlineDataStorage.finalizeLegacyMigration();
    updateInitializationStatus({ phase: "ready", backend, message: null });
  })().catch((error) => {
    updateInitializationStatus({
      phase: "error",
      backend: null,
      message: getOfflineDataStorageMessage(error),
    });
    initializationPromise = null;
    throw error;
  });
  return initializationPromise;
};

export const flushOfflineData = () => offlineDataStorage.flush();
