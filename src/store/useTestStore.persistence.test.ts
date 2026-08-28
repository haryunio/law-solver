// @vitest-environment jsdom

import { IDBFactory } from "fake-indexeddb";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Subject, TestSession } from "../types/test";
import { OFFLINE_DATA_AUTHORITY_MARKER, OFFLINE_DATA_STORAGE_KEY } from "../lib/offlineDataStorage";

const question = {
  id: "question-1",
  no: 1,
  question: "테스트 문제",
  choices: ["1", "2", "3", "4", "5"] as [string, string, string, string, string],
  answer: "2",
  explanation: "해설",
  my_answer: "2",
  wrong_note: "오답 노트",
  bookmark: true,
  originalRow: {},
};

const session: TestSession = {
  id: "session-1",
  title: "기존 문제",
  type: "5-choice",
  order_mode: "number",
  total_questions: 1,
  solved_questions: 1,
  score: 100,
  elapsed_time: 25,
  created_at: "2026-08-01T00:00:00.000Z",
  status: "completed",
  questions: [question],
};

const subject: Subject = {
  id: "subject-1",
  name: "법조윤리",
  created_at: "2026-08-01T00:00:00.000Z",
  cover_palette: "warm",
};

let indexedDb: IDBFactory;
let activeModule: typeof import("./useTestStore") | null = null;

async function loadStore() {
  const module = await import("./useTestStore");
  activeModule = module;
  await module.initializeOfflineData();
  return module;
}

beforeEach(() => {
  vi.resetModules();
  localStorage.clear();
  indexedDb = new IDBFactory();
  Object.defineProperty(globalThis, "indexedDB", {
    configurable: true,
    value: indexedDb,
  });
});

afterEach(async () => {
  await activeModule?.offlineDataStorage.close().catch(() => undefined);
  activeModule = null;
  localStorage.clear();
  vi.restoreAllMocks();
});

describe("useTestStore IndexedDB persistence", () => {
  it.each([
    {
      label: "v1 sessions-only data",
      persisted: { state: { sessions: [session] }, version: 1 },
      expectedSubjects: [],
      expectedMap: {},
      expectedTimestamp: undefined,
    },
    {
      label: "v2 subject data",
      persisted: {
        state: {
          sessions: [session],
          subjects: [subject],
          sessionSubjectMap: { [session.id]: subject.id },
        },
        version: 2,
      },
      expectedSubjects: [subject],
      expectedMap: { [session.id]: subject.id },
      expectedTimestamp: undefined,
    },
    {
      label: "v3 data with modified timestamp",
      persisted: {
        state: {
          sessions: [session],
          subjects: [subject],
          sessionSubjectMap: { [session.id]: subject.id },
          dataUpdatedAt: "2026-08-02T03:04:05.000Z",
        },
        version: 3,
      },
      expectedSubjects: [subject],
      expectedMap: { [session.id]: subject.id },
      expectedTimestamp: "2026-08-02T03:04:05.000Z",
    },
  ])("migrates $label without losing learning data", async ({
    persisted,
    expectedSubjects,
    expectedMap,
    expectedTimestamp,
  }) => {
    localStorage.setItem(OFFLINE_DATA_STORAGE_KEY, JSON.stringify(persisted));

    const module = await loadStore();
    const loaded = module.useTestStore.getState();

    expect(loaded.sessions).toEqual([session]);
    expect(loaded.sessions[0]?.questions[0]).toMatchObject({
      my_answer: "2",
      wrong_note: "오답 노트",
      bookmark: true,
    });
    expect(loaded.subjects).toEqual(expectedSubjects);
    expect(loaded.sessionSubjectMap).toEqual(expectedMap);
    if (expectedTimestamp) expect(loaded.dataUpdatedAt).toBe(expectedTimestamp);
    expect(localStorage.getItem(OFFLINE_DATA_STORAGE_KEY)).toBeNull();
    expect(localStorage.getItem(OFFLINE_DATA_AUTHORITY_MARKER)).toBe("indexeddb-v1");
    const durable = await module.offlineDataStorage.storage.getItem(OFFLINE_DATA_STORAGE_KEY);
    expect(durable).toMatchObject({ version: 3 });
    if (expectedTimestamp) expect(durable?.state.dataUpdatedAt).toBe(expectedTimestamp);
  });

  it("persists ordinary mutations and reloads the newest snapshot", async () => {
    const first = await loadStore();
    first.useTestStore.setState({
      sessions: [session],
      subjects: [subject],
      sessionSubjectMap: { [session.id]: subject.id },
      dataUpdatedAt: "2026-08-02T00:00:00.000Z",
    });
    first.useTestStore.getState().updateWrongNote(session.id, question.id, "최신 노트");
    first.useTestStore.getState().toggleBookmark(session.id, question.id);
    await first.flushOfflineData();
    await first.offlineDataStorage.close();
    activeModule = null;

    vi.resetModules();
    const second = await loadStore();
    const restoredQuestion = second.useTestStore.getState().sessions[0]?.questions[0];

    expect(restoredQuestion?.wrong_note).toBe("최신 노트");
    expect(restoredQuestion?.bookmark).toBe(false);
  });

  it("keeps the previous memory snapshot when a durable import fails", async () => {
    const module = await loadStore();
    module.useTestStore.setState({ sessions: [session] });
    const write = vi.spyOn(module.offlineDataStorage, "writeDurably")
      .mockRejectedValue(new DOMException("quota", "QuotaExceededError"));

    await expect(module.useTestStore.getState().importDashboardData({
      sessions: [],
      subjects: [],
      sessionSubjectMap: {},
      dataModifiedAt: "2026-08-03T00:00:00.000Z",
    })).rejects.toMatchObject({ name: "QuotaExceededError" });

    expect(module.useTestStore.getState().sessions).toEqual([session]);
    write.mockRestore();
  });

  it("keeps a completed reset after reload without reviving legacy data", async () => {
    localStorage.setItem(OFFLINE_DATA_STORAGE_KEY, JSON.stringify({
      state: {
        sessions: [session],
        subjects: [subject],
        sessionSubjectMap: { [session.id]: subject.id },
        dataUpdatedAt: "2026-08-02T00:00:00.000Z",
      },
      version: 3,
    }));
    const first = await loadStore();
    await first.useTestStore.getState().resetSessions();
    await first.offlineDataStorage.close();
    activeModule = null;

    vi.resetModules();
    const second = await loadStore();

    expect(second.useTestStore.getState().sessions).toEqual([]);
    expect(second.useTestStore.getState().subjects).toEqual([]);
    expect(second.useTestStore.getState().sessionSubjectMap).toEqual({});
    expect(localStorage.getItem(OFFLINE_DATA_STORAGE_KEY)).toBeNull();
  });

  it("exposes a hydration error instead of rendering an authoritative store as empty", async () => {
    localStorage.setItem(OFFLINE_DATA_AUTHORITY_MARKER, "indexeddb-v1");
    Object.defineProperty(globalThis, "indexedDB", {
      configurable: true,
      value: {
        open: () => {
          throw new DOMException("unavailable", "UnknownError");
        },
      },
    });
    vi.resetModules();
    const module = await import("./useTestStore");
    activeModule = module;

    await expect(module.initializeOfflineData()).rejects.toBeTruthy();
    expect(module.getOfflineDataInitializationStatus()).toMatchObject({ phase: "error" });
    expect(module.useTestStore.persist.hasHydrated()).toBe(false);
  });
});
