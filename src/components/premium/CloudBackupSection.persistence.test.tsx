// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { OfflineDataStorageError } from "../../lib/offlineDataStorage";

const backupJson = JSON.stringify({
  app: "law-solver",
  version: 3,
  exported_at: "2026-08-29T00:00:00.000Z",
  data_modified_at: "2026-08-29T00:00:00.000Z",
  sessions: [{
    id: "legacy-session", title: "기존 문제", type: "OX", order_mode: "random",
    total_questions: 1, solved_questions: 1, score: 0, elapsed_time: 32,
    created_at: "2026-08-28T00:00:00.000Z", status: "completed",
    questions: [{ id: "question-1", no: 1, question: "백업 복구 예시", answer: "O", my_answer: "X", wrong_note: "기존 노트", bookmark: true, originalRow: {} }],
  }],
  subjects: [{ id: "subject-1", name: "예시 과목", created_at: "2026-08-28T00:00:00.000Z" }],
  sessionSubjectMap: { "legacy-session": "subject-1" },
});

const metadata = {
  activePremium: true,
  backup: {
    revision: 1,
    dataModifiedAt: "2026-08-29T00:00:00.000Z",
    uploadedAt: "2026-08-29T00:00:00.000Z",
    subjectCount: 1,
    sessionCount: 1,
    questionCount: 1,
    encryptedSizeBytes: 100,
    backupFormatVersion: 3,
    encryptionFormatVersion: 1,
    deletionScheduledAt: null,
  },
  limits: {
    maxEncryptedBytes: 15_000_000,
    dailyUploadLimit: 5,
    dailyRestoreLimit: 5,
    uploadsUsed: 0,
    restoresUsed: 0,
    resetsAt: "2026-08-30T00:00:00.000Z",
  },
  serverNow: "2026-08-29T00:00:00.000Z",
};

const apiMocks = vi.hoisted(() => ({
  getMetadata: vi.fn(),
  createTicket: vi.fn(),
  download: vi.fn(),
}));
const cryptoMocks = vi.hoisted(() => ({
  decrypt: vi.fn(),
}));

vi.mock("../../lib/premiumApi", async (importOriginal) => ({
  ...await importOriginal<typeof import("../../lib/premiumApi")>(),
  getCloudBackupMetadata: apiMocks.getMetadata,
  createCloudBackupRestoreTicket: apiMocks.createTicket,
  downloadCloudBackupObject: apiMocks.download,
}));

vi.mock("../../lib/cloudBackupCrypto", async (importOriginal) => ({
  ...await importOriginal<typeof import("../../lib/cloudBackupCrypto")>(),
  decryptCloudBackupJson: cryptoMocks.decrypt,
  validateCloudBackupPassword: vi.fn(),
}));

import { useAccountStore } from "../../store/useAccountStore";
import { offlineDataStorage, useTestStore } from "../../store/useTestStore";
import { CloudBackupSection } from "./CloudBackupSection";

const originalImport = useTestStore.getState().importDashboardData;

beforeEach(() => {
  cryptoMocks.decrypt.mockResolvedValue(backupJson);
  apiMocks.getMetadata.mockResolvedValue(metadata);
  apiMocks.createTicket.mockResolvedValue({
    signedUrl: "https://example.test/backup",
    expiresAt: "2026-08-29T01:00:00.000Z",
    metadata,
    restoresUsed: 1,
    restoresRemaining: 4,
    resetsAt: metadata.limits.resetsAt,
  });
  apiMocks.download.mockResolvedValue(new Uint8Array([1, 2, 3]));
  useAccountStore.setState({
    configured: true,
    initialized: true,
    isSignedIn: true,
    isPremiumActive: true,
  });
});

afterEach(async () => {
  cleanup();
  useTestStore.setState({ importDashboardData: originalImport });
  useAccountStore.setState({ isSignedIn: false, isPremiumActive: false });
  await offlineDataStorage.close().catch(() => undefined);
  vi.clearAllMocks();
});

async function reachFinalConfirmation() {
  render(<CloudBackupSection />);
  const open = await screen.findByRole("button", { name: "클라우드에서 내려받기" });
  fireEvent.click(open);
  fireEvent.change(screen.getByPlaceholderText("8자 이상 입력"), {
    target: { value: "password123" },
  });
  fireEvent.click(screen.getByRole("button", { name: "내려받고 확인하기" }));
  return screen.findByRole("button", { name: "이 데이터로 교체" });
}

describe("CloudBackupSection durable restore", () => {
  it("opens restore outside the animated content and restores focus without downloading", async () => {
    const { container } = render(<div className="app-content-stagger"><CloudBackupSection /></div>);
    const open = await screen.findByRole("button", { name: "클라우드에서 내려받기" });
    open.focus();
    fireEvent.click(open);

    const dialog = screen.getByRole("dialog", { name: "클라우드에서 내려받기" });
    expect(container.contains(dialog)).toBe(false);
    expect(dialog.parentElement).toBe(document.body);
    expect(document.body.style.overflow).toBe("hidden");
    expect(apiMocks.createTicket).not.toHaveBeenCalled();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(open);
    expect(document.body.style.overflow).not.toBe("hidden");
  });

  it("closes only after the restored snapshot is durably stored", async () => {
    let resolveImport: (() => void) | undefined;
    const importData = vi.fn(() => new Promise<void>((resolve) => {
      resolveImport = resolve;
    }));
    useTestStore.setState({ importDashboardData: importData });
    const replace = await reachFinalConfirmation();
    expect(importData).not.toHaveBeenCalled();

    fireEvent.click(replace);
    expect(importData).toHaveBeenCalledWith(expect.objectContaining({
      version: 4,
      problemSets: [expect.objectContaining({ id: "legacy-session", subject_id: "subject-1" })],
      sessions: [expect.objectContaining({
        id: "legacy-session", problem_set_id: "legacy-session", last_played_at: null,
        responses: { "question-1": { answer: "X", wrong_note: "기존 노트", bookmark: true } },
      })],
    }));
    expect(screen.getByText("이 브라우저에 저장하는 중")).toBeTruthy();
    expect((screen.getByRole("button", { name: "클라우드 백업 닫기" }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.getByRole("heading", { name: "내려받은 데이터 최종 확인" })).toBeTruthy();

    resolveImport?.();
    await waitFor(() => expect(screen.queryByRole("heading", { name: "내려받은 데이터 최종 확인" })).toBeNull());
    expect(screen.getByText(/이 브라우저에 반영했습니다/)).toBeTruthy();
  });

  it("keeps the confirmation open and explains quota failure without false success", async () => {
    useTestStore.setState({
      importDashboardData: vi.fn().mockRejectedValue(new OfflineDataStorageError(
        "이 기기의 브라우저 저장 공간이 부족합니다.",
        "QUOTA_EXCEEDED",
      )),
    });
    const replace = await reachFinalConfirmation();

    fireEvent.click(replace);

    await waitFor(() => expect(screen.getAllByRole("alert").some((alert) => /저장 공간이 부족/.test(alert.textContent ?? ""))).toBe(true));
    expect(screen.getByRole("heading", { name: "내려받은 데이터 최종 확인" })).toBeTruthy();
    expect(screen.queryByText(/이 브라우저에 반영했습니다/)).toBeNull();
  });
});
