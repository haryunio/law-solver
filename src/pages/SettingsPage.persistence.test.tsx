// @vitest-environment jsdom

import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { OfflineDataStorageError } from "../lib/offlineDataStorage";
import { useTestStore } from "../store/useTestStore";
import { SettingsPage } from "./SettingsPage";

vi.mock("../components/premium/CloudBackupSection", () => ({
  CloudBackupSection: () => null,
}));

const backupJson = JSON.stringify({
  app: "law-solver",
  version: 3,
  exported_at: "2026-08-29T00:00:00.000Z",
  data_modified_at: "2026-08-29T00:00:00.000Z",
  sessions: [],
  subjects: [],
  sessionSubjectMap: {},
});

const originalImport = useTestStore.getState().importDashboardData;
let selectedInput: HTMLInputElement | null = null;

beforeEach(() => {
  selectedInput = null;
  vi.spyOn(HTMLInputElement.prototype, "click").mockImplementation(function captureInput(
    this: HTMLInputElement,
  ) {
    selectedInput = this;
  });
});

afterEach(() => {
  cleanup();
  useTestStore.setState({ importDashboardData: originalImport });
  vi.restoreAllMocks();
});

async function openFileRestoreConfirmation() {
  render(
    <MemoryRouter>
      <SettingsPage />
    </MemoryRouter>,
  );
  fireEvent.click(screen.getByRole("tab", { name: "오프라인 문제 풀이 데이터" }));
  fireEvent.click(screen.getByRole("button", { name: "백업 파일 선택" }));
  expect(selectedInput).not.toBeNull();
  Object.defineProperty(selectedInput!, "files", {
    configurable: true,
    value: [{ size: backupJson.length, text: async () => backupJson }],
  });
  await act(async () => {
    await selectedInput!.onchange?.({ target: selectedInput } as unknown as Event);
  });
  return screen.findByRole("button", { name: "불러오기" });
}

describe("SettingsPage durable file restore", () => {
  it("keeps the confirmation open until IndexedDB persistence finishes", async () => {
    let resolveImport: (() => void) | undefined;
    useTestStore.setState({
      importDashboardData: vi.fn(() => new Promise<void>((resolve) => {
        resolveImport = resolve;
      })),
    });
    const confirm = await openFileRestoreConfirmation();
    expect(useTestStore.getState().importDashboardData).not.toHaveBeenCalled();

    fireEvent.click(confirm);
    expect(useTestStore.getState().importDashboardData).toHaveBeenCalledWith(expect.objectContaining({
      app: "law-solver", version: 4, problemSets: [], sessions: [], subjects: [],
    }));
    expect(screen.getByText("저장하는 중")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "오프라인 문제 풀이 데이터를 불러올까요?" }))
      .toBeTruthy();

    resolveImport?.();
    await waitFor(() => expect(screen.getByRole("heading", { name: "불러오기가 완료되었습니다." }))
      .toBeTruthy());
  });

  it("shows the storage failure without reporting a false success", async () => {
    useTestStore.setState({
      importDashboardData: vi.fn().mockRejectedValue(new OfflineDataStorageError(
        "이 기기의 브라우저 저장 공간이 부족합니다.",
        "QUOTA_EXCEEDED",
      )),
    });
    const confirm = await openFileRestoreConfirmation();

    fireEvent.click(confirm);

    await waitFor(() => expect(screen.getByRole("heading", { name: "데이터를 저장하지 못했습니다." }))
      .toBeTruthy());
    expect(screen.getByText(/기존 데이터는 변경하지 않았습니다/)).toBeTruthy();
    expect(screen.queryByText("불러오기가 완료되었습니다.")).toBeNull();
  });
});
