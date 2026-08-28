// @vitest-environment jsdom

import { StrictMode } from "react";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { IDBFactory } from "fake-indexeddb";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { OFFLINE_DATA_AUTHORITY_MARKER, OFFLINE_DATA_STORAGE_KEY } from "../../lib/offlineDataStorage";

let activeStore: typeof import("../../store/useTestStore") | null = null;

beforeEach(() => {
  vi.resetModules();
  localStorage.clear();
  Object.defineProperty(globalThis, "indexedDB", {
    configurable: true,
    value: new IDBFactory(),
  });
});
afterEach(async () => {
  cleanup();
  await activeStore?.offlineDataStorage.close().catch(() => undefined);
  activeStore = null;
  localStorage.clear();
});

describe("OfflineDataHydrationGate", () => {
  it("keeps routes hidden until legacy data has hydrated", async () => {
    localStorage.setItem(OFFLINE_DATA_STORAGE_KEY, JSON.stringify({
      state: {
        sessions: [],
        subjects: [],
        sessionSubjectMap: {},
        dataUpdatedAt: "2026-08-29T00:00:00.000Z",
      },
      version: 3,
    }));
    const [{ OfflineDataHydrationGate }, store] = await Promise.all([
      import("./OfflineDataHydrationGate"),
      import("../../store/useTestStore"),
    ]);
    activeStore = store;

    render(
      <StrictMode>
        <OfflineDataHydrationGate>
          <p>대시보드 내용</p>
        </OfflineDataHydrationGate>
      </StrictMode>,
    );

    expect(screen.queryByText("대시보드 내용")).toBeNull();
    expect(screen.getByRole("status", { name: /오프라인 문제 풀이 데이터를 준비/ })).toBeTruthy();
    await waitFor(() => expect(screen.getByText("대시보드 내용")).toBeTruthy());
    expect(localStorage.getItem(OFFLINE_DATA_STORAGE_KEY)).toBeNull();
  });

  it("shows an actionable error instead of empty children when authoritative IndexedDB fails", async () => {
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
    const [{ OfflineDataHydrationGate }, store] = await Promise.all([
      import("./OfflineDataHydrationGate"),
      import("../../store/useTestStore"),
    ]);
    activeStore = store;

    render(
      <OfflineDataHydrationGate>
        <p>비어 보이면 안 되는 화면</p>
      </OfflineDataHydrationGate>,
    );

    await waitFor(() => expect(screen.getByRole("alert")).toBeTruthy());
    expect(screen.queryByText("비어 보이면 안 되는 화면")).toBeNull();
    expect(screen.getByRole("button", { name: "다시 시도" })).toBeTruthy();
  });
});
