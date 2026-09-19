// @vitest-environment jsdom

import { IDBFactory } from "fake-indexeddb";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Subject, TestSession } from "../types/test";
import { createOfflineDataStorage, OFFLINE_DATA_AUTHORITY_MARKER, OFFLINE_DATA_STORAGE_KEY } from "../lib/offlineDataStorage";

const question = {
  id: "question-1", no: 1, question: "테스트 문제", choices: ["1", "2", "3", "4", "5"] as [string, string, string, string, string],
  answer: "2", explanation: "해설", my_answer: "2", wrong_note: "오답 노트", bookmark: true,
  originalRow: { 사용자답안: "2", 사용자정의열: "CSV 보존" },
};
const session: TestSession = {
  id: "session-1", title: "기존 문제", type: "5-choice", order_mode: "random", total_questions: 1,
  solved_questions: 1, score: 100, elapsed_time: 25, created_at: "2026-08-01T00:00:00.000Z", status: "completed", questions: [question],
};
const subject: Subject = { id: "subject-1", name: "법조윤리", created_at: "2026-08-01T00:00:00.000Z", cover_palette: "warm" };
const legacyState = {
  sessions: [session], subjects: [subject], sessionSubjectMap: { [session.id]: subject.id }, dataUpdatedAt: "2026-08-02T03:04:05.000Z",
};
let activeModule: typeof import("./useTestStore") | null = null;
async function loadStore() {
  const module = await import("./useTestStore");
  activeModule = module;
  await module.initializeOfflineData();
  return module;
}
async function reloadStore() {
  await activeModule?.offlineDataStorage.close();
  activeModule = null;
  vi.resetModules();
  return loadStore();
}
beforeEach(() => {
  vi.resetModules();
  localStorage.clear();
  Object.defineProperty(globalThis, "indexedDB", { configurable: true, value: new IDBFactory() });
});
afterEach(async () => {
  vi.useRealTimers();
  await activeModule?.offlineDataStorage.close().catch(() => undefined);
  activeModule = null;
  localStorage.clear();
  vi.restoreAllMocks();
});

describe("useTestStore v4 persistence", () => {
  it("upgrades an authoritative v3 IndexedDB snapshot without a localStorage copy", async () => {
    const shuffledSession = {
      ...session,
      questions: [{ ...question, id: "second", no: 2 }, question],
      total_questions: 2,
      solved_questions: 2,
    };
    const oldStorage = createOfflineDataStorage<unknown>();
    await oldStorage.prepare();
    await oldStorage.writeDurably(OFFLINE_DATA_STORAGE_KEY, {
      state: { ...legacyState, sessions: [shuffledSession] },
      version: 3,
    });
    await oldStorage.close();
    localStorage.setItem(OFFLINE_DATA_AUTHORITY_MARKER, "indexeddb-v1");
    expect(localStorage.getItem(OFFLINE_DATA_STORAGE_KEY)).toBeNull();
    const module = await loadStore();
    const loaded = module.useTestStore.getState();
    expect(loaded.getSessionById(session.id)).toEqual(shuffledSession);
    expect(loaded.sessions[0]).toMatchObject({ question_order: ["second", question.id], created_at: session.created_at, last_played_at: null });
    expect(loaded.problemSets[0]!.questions[0]!.originalRow).toEqual(question.originalRow);
    expect(loaded.dataUpdatedAt).toBe(legacyState.dataUpdatedAt);
    expect(await module.offlineDataStorage.storage.getItem(OFFLINE_DATA_STORAGE_KEY)).toMatchObject({ version: 4 });
    const reloaded = await reloadStore();
    expect(reloaded.useTestStore.getState().getSessionById(session.id)).toEqual(shuffledSession);
  });

  it.each([1, 2, 3])("migrates v%s without losing records or inventing play dates", async (version) => {
    const state = version === 1 ? { sessions: [session] } : version === 2
      ? { sessions: [session], subjects: [subject], sessionSubjectMap: legacyState.sessionSubjectMap } : legacyState;
    localStorage.setItem(OFFLINE_DATA_STORAGE_KEY, JSON.stringify({ state, version }));
    const module = await loadStore();
    const loaded = module.useTestStore.getState();
    expect(loaded.getSessionById(session.id)).toEqual(session);
    expect(loaded.problemSets).toHaveLength(1);
    expect(loaded.sessions[0]).toMatchObject({ id: session.id, problem_set_id: session.id, last_played_at: null, submitted_at: null, created_at: session.created_at });
    expect(loaded.problemSets[0]!.questions[0]!.originalRow).toEqual(question.originalRow);
    expect(loaded.getSessionSubjectId(session.id)).toBe(version === 1 ? null : subject.id);
    expect(loaded.subjects).toEqual(version === 1 ? [] : [subject]);
    if (version === 3) expect(loaded.dataUpdatedAt).toBe(legacyState.dataUpdatedAt);
    expect(localStorage.getItem(OFFLINE_DATA_STORAGE_KEY)).toBeNull();
    expect(localStorage.getItem(OFFLINE_DATA_AUTHORITY_MARKER)).toBe("indexeddb-v1");
    const durable = await module.offlineDataStorage.storage.getItem(OFFLINE_DATA_STORAGE_KEY);
    expect(durable).toMatchObject({ version: 4 });
    expect(durable?.state).not.toHaveProperty("sessionSubjectMap");
    expect(durable?.state.sessions[0]).not.toHaveProperty("questions");
    const next = await reloadStore();
    expect(next.useTestStore.getState().getSessionById(session.id)).toEqual(session);
  });

  it("initializes an absent persisted state as empty v4 data", async () => {
    const module = await loadStore();
    expect(module.useTestStore.getState().getDashboardBackupData()).toMatchObject({ version: 4, problemSets: [], sessions: [], subjects: [] });
    expect(module.getOfflineDataInitializationStatus().phase).toBe("ready");
  });

  it("persists ordinary mutations and reloads the newest snapshot", async () => {
    const first = await loadStore();
    await first.useTestStore.getState().importDashboardData(legacyState);
    first.useTestStore.getState().updateWrongNote(session.id, question.id, "최신 노트");
    first.useTestStore.getState().toggleBookmark(session.id, question.id);
    await first.flushOfflineData();
    const second = await reloadStore();
    expect(second.useTestStore.getState().getSessionById(session.id)?.questions[0]).toMatchObject({ wrong_note: "최신 노트", bookmark: false, my_answer: "2" });
  });

  it("keeps memory and durable data when validation rejects an import", async () => {
    const module = await loadStore();
    await module.useTestStore.getState().importDashboardData(legacyState);
    await module.flushOfflineData();
    const before = module.useTestStore.getState().getDashboardBackupData();
    const write = vi.spyOn(module.offlineDataStorage, "writeDurably");
    const corrupt = { ...before, sessions: [{ ...before.sessions[0]!, problem_set_id: "missing" }] };
    await expect(module.useTestStore.getState().importDashboardData(corrupt)).rejects.toThrow();
    await expect(module.useTestStore.getState().importDashboardData({ ...before, version: 5 })).rejects.toThrow("최신 버전");
    expect(write).not.toHaveBeenCalled();
    expect(module.useTestStore.getState().problemSets).toEqual(before.problemSets);
    expect(module.useTestStore.getState().sessions).toEqual(before.sessions);
    write.mockRestore();
    const reloaded = await reloadStore();
    expect(reloaded.useTestStore.getState().getSessionById(session.id)).toEqual(session);
  });

  it.each(["import", "reset"])("keeps the previous snapshot when a durable %s fails", async (action) => {
    const module = await loadStore();
    await module.useTestStore.getState().importDashboardData(legacyState);
    const before = module.useTestStore.getState().getDashboardBackupData();
    const write = vi.spyOn(module.offlineDataStorage, "writeDurably").mockRejectedValue(new DOMException("quota", "QuotaExceededError"));
    const operation = action === "import" ? module.useTestStore.getState().importDashboardData([]) : module.useTestStore.getState().resetSessions();
    await expect(operation).rejects.toMatchObject({ name: "QuotaExceededError" });
    expect(module.useTestStore.getState().sessions).toEqual(before.sessions);
    expect(module.useTestStore.getState().problemSets).toEqual(before.problemSets);
    write.mockRestore();
  });

  it("keeps a completed reset after reload without reviving legacy data", async () => {
    localStorage.setItem(OFFLINE_DATA_STORAGE_KEY, JSON.stringify({ state: legacyState, version: 3 }));
    const first = await loadStore();
    await first.useTestStore.getState().resetSessions();
    const second = await reloadStore();
    expect(second.useTestStore.getState().getDashboardBackupData()).toMatchObject({ problemSets: [], sessions: [], subjects: [] });
    expect(localStorage.getItem(OFFLINE_DATA_STORAGE_KEY)).toBeNull();
  });

  it.each([
    { label: "future version", state: legacyState, version: 5 },
    { label: "future version with array state", state: [session], version: 5 },
    { label: "duplicate IDs", state: { ...legacyState, sessions: [session, session] }, version: 3 },
    { label: "missing session array", state: { subjects: [subject] }, version: 3 },
  ])("preserves the original persisted snapshot after a $label hydration failure", async ({ state, version }) => {
    const original = JSON.stringify({ state, version });
    localStorage.setItem(OFFLINE_DATA_STORAGE_KEY, original);
    const module = await import("./useTestStore");
    activeModule = module;
    await expect(module.initializeOfflineData()).rejects.toBeTruthy();
    expect(module.getOfflineDataInitializationStatus().phase).toBe("error");
    expect(localStorage.getItem(OFFLINE_DATA_STORAGE_KEY)).toBe(original);
    expect(await module.offlineDataStorage.storage.getItem(OFFLINE_DATA_STORAGE_KEY)).toMatchObject({ state, version });
    expect(module.useTestStore.persist.hasHydrated()).toBe(false);
  });

  it("shows a hydration error when the authoritative IndexedDB is unavailable", async () => {
    localStorage.setItem(OFFLINE_DATA_AUTHORITY_MARKER, "indexeddb-v1");
    Object.defineProperty(globalThis, "indexedDB", { configurable: true, value: { open: () => { throw new DOMException("unavailable", "UnknownError"); } } });
    const module = await import("./useTestStore");
    activeModule = module;
    await expect(module.initializeOfflineData()).rejects.toBeTruthy();
    expect(module.getOfflineDataInitializationStatus().phase).toBe("error");
    expect(module.useTestStore.persist.hasHydrated()).toBe(false);
  });
});

describe("normalized offline learning records", () => {
  it("registers a complete batch together, preserving file order and source content without creating sessions", async () => {
    const module = await loadStore();
    await module.useTestStore.getState().importDashboardData(legacyState);
    const before = module.useTestStore.getState();
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-09-20T03:00:00Z"));
    const observedProblemCounts: number[] = [];
    const unsubscribe = module.useTestStore.subscribe((state) => observedProblemCounts.push(state.problemSets.length));
    const ids = before.createProblemSets([
      { title: "  첫 파일  ", type: "5-choice", questions: [question], subjectId: subject.id },
      { title: "둘째 파일", type: "5-choice", questions: [{ ...question, id: "second-file-question" }] },
    ]);
    unsubscribe();

    expect(ids).toHaveLength(2);
    expect(new Set(ids).size).toBe(2);
    expect(observedProblemCounts).toEqual([3]);
    const after = module.useTestStore.getState();
    expect(after.problemSets.slice(0, 2).map((problem) => problem.id)).toEqual(ids);
    expect(after.problemSets.slice(0, 2)).toMatchObject([
      { title: "첫 파일", subject_id: subject.id, created_at: "2026-09-20T03:00:00.000Z", updated_at: "2026-09-20T03:00:00.000Z" },
      { title: "둘째 파일", subject_id: null, created_at: "2026-09-20T03:00:00.000Z", updated_at: "2026-09-20T03:00:00.000Z" },
    ]);
    expect(after.dataUpdatedAt).toBe("2026-09-20T03:00:00.000Z");
    expect(after.problemSets[0]!.questions[0]!.originalRow).toEqual(question.originalRow);
    for (const field of ["my_answer", "wrong_note", "bookmark"]) {
      expect(after.problemSets[0]!.questions[0]).not.toHaveProperty(field);
    }
    expect(after.problemSets[2]).toEqual(before.problemSets[0]);
    expect(after.sessions).toEqual(before.sessions);
    expect(after.subjects).toEqual(before.subjects);
    await module.flushOfflineData();
    const reloaded = await reloadStore();
    expect(reloaded.useTestStore.getState().problemSets).toEqual(after.problemSets);
    expect(reloaded.useTestStore.getState().sessions).toEqual(before.sessions);
  });

  it.each([
    { label: "invalid title", input: { title: "  ", type: "5-choice" as const, questions: [question] } },
    { label: "unknown subject", input: { title: "둘째 파일", type: "5-choice" as const, questions: [question], subjectId: "missing-subject" } },
  ])("rejects a batch with an $label in the middle without changing memory or storage", async ({ input }) => {
    const module = await loadStore();
    await module.useTestStore.getState().importDashboardData(legacyState);
    await module.flushOfflineData();
    const before = module.useTestStore.getState();
    const storedBefore = await module.offlineDataStorage.storage.getItem(OFFLINE_DATA_STORAGE_KEY);
    const changed = vi.fn();
    const unsubscribe = module.useTestStore.subscribe(changed);

    expect(() => before.createProblemSets([
      { title: "첫 파일", type: "5-choice", questions: [question] },
      input,
      { title: "셋째 파일", type: "5-choice", questions: [question] },
    ])).toThrow();
    expect(module.useTestStore.getState()).toBe(before);
    expect(changed).not.toHaveBeenCalled();
    unsubscribe();
    await module.flushOfflineData();
    expect(await module.offlineDataStorage.storage.getItem(OFFLINE_DATA_STORAGE_KEY)).toEqual(storedBefore);
    const reloaded = await reloadStore();
    expect(reloaded.useTestStore.getState().problemSets).toEqual(before.problemSets);
    expect(reloaded.useTestStore.getState().sessions).toEqual(before.sessions);
    expect(reloaded.useTestStore.getState().dataUpdatedAt).toBe(before.dataUpdatedAt);
  });

  it("leaves the current snapshot unchanged for an empty problem batch", async () => {
    const module = await loadStore();
    const before = module.useTestStore.getState();
    const changed = vi.fn();
    const unsubscribe = module.useTestStore.subscribe(changed);
    expect(before.createProblemSets([])).toEqual([]);
    expect(module.useTestStore.getState()).toBe(before);
    expect(changed).not.toHaveBeenCalled();
    unsubscribe();
  });

  it("registers and orders existing CSV numbering without replacing negative or decimal values", async () => {
    const module = await loadStore();
    const store = module.useTestStore.getState();
    const problemId = store.createProblemSet({ title: "민법", type: "5-choice", questions: [
      { ...question, no: 2.5 }, { ...question, id: "negative", no: -1 },
    ] });
    const id = store.createSession({ problemSetId: problemId });
    expect(store.getSessionById(id)!.questions.map((item) => item.no)).toEqual([-1, 2.5]);
    expect(module.useTestStore.getState().problemSets[0]!.questions.map((item) => item.no)).toEqual([2.5, -1]);
  });

  it("creates no automatic session and isolates fresh attempts from source and each other", async () => {
    const module = await loadStore();
    const store = module.useTestStore.getState();
    const id = store.createProblemSet({ title: "민법", type: "5-choice", questions: [question] });
    expect(module.useTestStore.getState().sessions).toEqual([]);
    const first = store.createSession({ problemSetId: id });
    const second = store.createSession({ problemSetId: id });
    expect(store.getSessionById(first)!.questions[0]).toMatchObject({ my_answer: "", wrong_note: "", bookmark: false });
    store.updateAnswer(first, question.id, "1");
    store.updateWrongNote(first, question.id, "첫 회차 메모");
    store.toggleBookmark(first, question.id);
    expect(store.getSessionById(second)!.questions[0]).toMatchObject({ my_answer: "", wrong_note: "", bookmark: false });
    const state = module.useTestStore.getState();
    expect(state.problemSets).toHaveLength(1);
    expect(state.problemSets[0]!.questions[0]).not.toHaveProperty("my_answer");
    expect(state.problemSets[0]!.questions[0]!.originalRow).toEqual(question.originalRow);
    expect(state.sessions.every((attempt) => !("questions" in attempt))).toBe(true);
    expect(state.sessions.map((attempt) => attempt.attempt_number)).toEqual([2, 1]);
    await module.flushOfflineData();
    const reloaded = await reloadStore();
    expect(reloaded.useTestStore.getState().getSessionById(first)!.questions[0]).toMatchObject({ my_answer: "1", wrong_note: "첫 회차 메모", bookmark: true });
    expect(reloaded.useTestStore.getState().getSessionById(second)!.questions[0]).toMatchObject({ my_answer: "", wrong_note: "", bookmark: false });
  });

  it("selects retry questions from the source session, resets all records and preserves the source result", async () => {
    const module = await loadStore();
    const store = module.useTestStore.getState();
    const questions = [question, { ...question, id: "q2", no: 2 }, { ...question, id: "q3", no: 3 }];
    const problemId = store.createProblemSet({ title: "민법", type: "5-choice", questions });
    const first = store.createSession({ problemSetId: problemId });
    store.updateAnswer(first, question.id, "2");
    store.updateAnswer(first, "q2", "1");
    store.toggleBookmark(first, "q2");
    store.updateWrongNote(first, "q2", "원본 노트");
    store.submitSession(first);
    const original = store.getSessionById(first);
    expect(original).toMatchObject({ score: 33, solved_questions: 2, status: "completed" });
    const incorrect = store.createSession({ problemSetId: problemId, sourceSessionId: first, retryMode: "incorrect" });
    const bookmarked = store.createSession({ problemSetId: problemId, sourceSessionId: first, retryMode: "bookmarked" });
    const all = store.createSession({ problemSetId: problemId, sourceSessionId: incorrect, retryMode: "all" });
    expect(store.getSessionById(incorrect)!.questions.map((item) => item.id)).toEqual(["q2", "q3"]);
    expect(store.getSessionById(bookmarked)!.questions.map((item) => item.id)).toEqual(["q2"]);
    expect(store.getSessionById(all)!.questions.map((item) => item.id)).toEqual(["q2", "q3"]);
    expect(store.getSessionById(bookmarked)!.questions[0]).toMatchObject({ my_answer: "", wrong_note: "", bookmark: false });
    store.updateAnswer(first, "q2", "2");
    expect(store.getSessionById(first)).toEqual(original);
    expect(() => store.createSession({ problemSetId: problemId, sourceSessionId: bookmarked, retryMode: "bookmarked" })).toThrow("문항이 없습니다");
  });

  it("supports random order without changing canonical source order", async () => {
    const module = await loadStore();
    const store = module.useTestStore.getState();
    const id = store.createProblemSet({ title: "민법", type: "5-choice", questions: [question, { ...question, id: "q2", no: 2 }, { ...question, id: "q3", no: 3 }] });
    vi.spyOn(Math, "random").mockReturnValue(0);
    const sessionId = store.createSession({ problemSetId: id, orderMode: "random" });
    expect(store.getSessionById(sessionId)!.questions.map((item) => item.id)).toEqual(["q2", "q3", question.id]);
    expect(module.useTestStore.getState().problemSets[0]!.questions.map((item) => item.id)).toEqual([question.id, "q2", "q3"]);
  });

  it("records registration, creation, last play and submission independently", async () => {
    const module = await loadStore();
    const store = module.useTestStore.getState();
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-09-01T00:00:00Z"));
    const problemId = store.createProblemSet({ title: "민법", type: "5-choice", questions: [question] });
    vi.setSystemTime(new Date("2026-09-02T00:00:00Z"));
    const sessionId = store.createSession({ problemSetId: problemId });
    expect(module.useTestStore.getState().sessions[0]).toMatchObject({ created_at: "2026-09-02T00:00:00.000Z", last_played_at: null, submitted_at: null });
    vi.setSystemTime(new Date("2026-09-03T00:00:00Z"));
    store.markSessionPlayed(sessionId);
    expect(module.useTestStore.getState().sessions[0]!.last_played_at).toBe("2026-09-03T00:00:00.000Z");
    vi.setSystemTime(new Date("2026-09-04T00:00:00Z"));
    store.submitSession(sessionId);
    const completed = module.useTestStore.getState().sessions[0]!;
    expect(completed).toMatchObject({ created_at: "2026-09-02T00:00:00.000Z", last_played_at: "2026-09-04T00:00:00.000Z", submitted_at: "2026-09-04T00:00:00.000Z" });
    expect(module.useTestStore.getState().problemSets[0]!.created_at).toBe("2026-09-01T00:00:00.000Z");
    vi.setSystemTime(new Date("2026-09-05T00:00:00Z"));
    store.submitSession(sessionId);
    store.tickElapsedTime(sessionId);
    store.markSessionPlayed(sessionId);
    expect(module.useTestStore.getState().sessions[0]).toEqual(completed);
  });

  it("moves all attempts with their problem and safely cleans up references after deletions", async () => {
    const module = await loadStore();
    const store = module.useTestStore.getState();
    const subjectId = store.createSubject("민법");
    const problemId = store.createProblemSet({ title: "민법", type: "5-choice", questions: [question], subjectId });
    const first = store.createSession({ problemSetId: problemId });
    const retry = store.createSession({ problemSetId: problemId, sourceSessionId: first, retryMode: "all" });
    const otherSubject = store.createSubject("복습");
    store.updateProblemSet(problemId, { title: "민법 수정", subjectId: otherSubject });
    expect(store.getSessionSubjectId(first)).toBe(otherSubject);
    expect(store.getSessionSubjectId(retry)).toBe(otherSubject);
    store.deleteSession(first);
    expect(module.useTestStore.getState().sessions[0]!.source_session_id).toBeNull();
    expect(module.useTestStore.getState().problemSets).toHaveLength(1);
    store.deleteSubject(otherSubject);
    expect(store.getSessionSubjectId(retry)).toBeNull();
    await store.importDashboardData(store.getDashboardBackupData());
    store.deleteProblemSet(problemId);
    expect(module.useTestStore.getState().sessions).toEqual([]);
    expect(module.useTestStore.getState().problemSets).toEqual([]);
  });

  it("keeps prototype-shaped question IDs usable in independent response records", async () => {
    const module = await loadStore();
    const store = module.useTestStore.getState();
    const problemId = store.createProblemSet({ title: "민법", type: "5-choice", questions: [{ ...question, id: "__proto__" }, { ...question, id: "constructor", no: 2 }] });
    const sessionId = store.createSession({ problemSetId: problemId });
    store.updateAnswer(sessionId, "__proto__", "2");
    store.toggleBookmark(sessionId, "constructor");
    expect(store.getSessionById(sessionId)!.questions).toMatchObject([{ my_answer: "2", bookmark: false }, { my_answer: "", bookmark: true }]);
    await store.importDashboardData(JSON.parse(JSON.stringify(store.getDashboardBackupData())));
    expect(store.getSessionById(sessionId)!.questions[0]!.my_answer).toBe("2");
  });
});
