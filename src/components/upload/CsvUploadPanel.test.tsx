// @vitest-environment jsdom

import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { readCsvFileText } from "../../lib/csv";
import { CsvUploadPanel } from "./CsvUploadPanel";

const { createProblemSet } = vi.hoisted(() => ({ createProblemSet: vi.fn(() => "problem-new") }));
vi.mock("../../store/useTestStore", () => ({
  useTestStore: (selector: (state: { createProblemSet: typeof createProblemSet }) => unknown) => selector({ createProblemSet }),
}));
vi.mock("../../lib/csv", async () => ({
  ...await vi.importActual<typeof import("../../lib/csv")>("../../lib/csv"),
  readCsvFileText: vi.fn(),
}));
vi.mock("../../lib/analytics", async () => ({
  ...await vi.importActual<typeof import("../../lib/analytics")>("../../lib/analytics"),
  trackEvent: vi.fn(),
}));
afterEach(() => { cleanup(); vi.clearAllMocks(); });

function chooseFile(name = "민법_연습.csv") {
  fireEvent.change(screen.getByLabelText("CSV 파일"), { target: { files: [new File(["test"], name, { type: "text/csv" })] } });
}

describe("CSV source problem registration", () => {
  it("keeps the selected type when the file cannot identify a question type", async () => {
    vi.mocked(readCsvFileText).mockResolvedValue("제목,내용\n알 수 없는 형식,입력");
    render(<CsvUploadPanel />);
    fireEvent.click(screen.getByRole("button", { name: "문제 타입 선택" }));
    fireEvent.click(screen.getByRole("option", { name: "단답형" }));
    chooseFile();
    await screen.findByRole("button", { name: "문제 등록" });
    expect(screen.getByRole("button", { name: "문제 타입 선택" }).textContent).toContain("단답형");
    expect((screen.getByLabelText("문제 제목") as HTMLInputElement).value).toBe("민법 연습");
    expect(createProblemSet).not.toHaveBeenCalled();
  });

  it("ignores a slow response from an earlier file selection", async () => {
    let finishEarlier!: (value: string) => void;
    vi.mocked(readCsvFileText)
      .mockImplementationOnce(() => new Promise((resolve) => { finishEarlier = resolve; }))
      .mockResolvedValueOnce("번호,문제,정답\n1,가상 문제,민법");
    render(<CsvUploadPanel />);
    chooseFile("첫_파일.csv");
    chooseFile("두번째_파일.csv");
    await waitFor(() => expect(screen.getByRole("button", { name: "문제 타입 선택" }).textContent).toContain("단답형"));
    await act(async () => { finishEarlier("번호,문제,정답\n1,가상 문제,O"); });
    expect(screen.getByRole("button", { name: "문제 타입 선택" }).textContent).toContain("단답형");
    expect((screen.getByLabelText("문제 제목") as HTMLInputElement).value).toBe("두번째 파일");
  });

  it("reports the new problem ID without creating a solve order or session", async () => {
    vi.mocked(readCsvFileText).mockResolvedValue("번호,문제,정답\n1,가상 문제,O");
    const onCreated = vi.fn();
    render(<CsvUploadPanel subjectId="subject-1" onCreated={onCreated} />);
    chooseFile();
    fireEvent.click(await screen.findByRole("button", { name: "문제 등록" }));
    await waitFor(() => expect(onCreated).toHaveBeenCalledWith("problem-new"));
    expect(createProblemSet).toHaveBeenCalledTimes(1);
    expect(createProblemSet).toHaveBeenCalledWith({ title: "민법 연습", type: "OX", subjectId: "subject-1", questions: expect.any(Array) });
    expect(screen.queryByRole("button", { name: "풀이 순서 선택" })).toBeNull();
  });
});
