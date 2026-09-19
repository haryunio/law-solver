// @vitest-environment jsdom

import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readCsvFileText } from "../../lib/csv";
import { CsvUploadPanel } from "./CsvUploadPanel";

const { createProblemSet, createProblemSets } = vi.hoisted(() => ({
  createProblemSet: vi.fn(() => "problem-new"),
  createProblemSets: vi.fn((inputs: unknown[]) => inputs.map((_, index) => `problem-batch-${index + 1}`)),
}));
vi.mock("../../store/useTestStore", () => ({
  useTestStore: (selector: (state: {
    createProblemSet: typeof createProblemSet;
    createProblemSets: typeof createProblemSets;
  }) => unknown) => selector({ createProblemSet, createProblemSets }),
}));
vi.mock("../../lib/csv", async () => ({
  ...await vi.importActual<typeof import("../../lib/csv")>("../../lib/csv"),
  readCsvFileText: vi.fn(),
}));
vi.mock("../../lib/analytics", async () => ({
  ...await vi.importActual<typeof import("../../lib/analytics")>("../../lib/analytics"),
  trackEvent: vi.fn(),
}));
beforeEach(() => { vi.mocked(readCsvFileText).mockReset(); });
afterEach(() => { cleanup(); vi.clearAllMocks(); });

function chooseFile(name = "민법_연습.csv") {
  fireEvent.change(screen.getByLabelText("CSV 파일"), { target: { files: [new File(["test"], name, { type: "text/csv" })] } });
}

function chooseFiles(names: string[]) {
  fireEvent.change(screen.getByLabelText("CSV 파일"), {
    target: { files: names.map((name) => new File(["test"], name, { type: "text/csv" })) },
  });
}

const oxCsv = "번호,문제,정답\n1,가상 OX 문제,O";
const shortCsv = "번호,문제,정답\n1,가상 단답형 문제,민법";
const choiceCsv = "번호,문제,선택지1,선택지2,선택지3,선택지4,선택지5,정답\n1,가상 선택형 문제,보기 하나,보기 둘,보기 셋,보기 넷,보기 다섯,3";

async function confirmBatch() {
  const dialog = await screen.findByRole("dialog", { name: "문제를 일괄 등록할까요?" });
  fireEvent.click(within(dialog).getByRole("button", { name: "일괄 등록" }));
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

describe("batch CSV source problem registration", () => {
  it("requires confirmation and leaves data unchanged when canceled", async () => {
    vi.mocked(readCsvFileText).mockResolvedValue(oxCsv);
    const onCreated = vi.fn();
    const onBatchCreated = vi.fn();
    render(<CsvUploadPanel onCreated={onCreated} onBatchCreated={onBatchCreated} />);
    expect((screen.getByLabelText("CSV 파일") as HTMLInputElement).multiple).toBe(true);
    chooseFiles(["민법.csv", "헌법.csv"]);

    const dialog = await screen.findByRole("dialog", { name: "문제를 일괄 등록할까요?" });
    expect(dialog.textContent).toMatch(/2\s*개/);
    expect(dialog.textContent).toMatch(/자동/);
    expect(createProblemSet).not.toHaveBeenCalled();
    expect(createProblemSets).not.toHaveBeenCalled();
    fireEvent.click(within(dialog).getByRole("button", { name: "취소" }));

    expect(screen.queryByRole("dialog", { name: "문제를 일괄 등록할까요?" })).toBeNull();
    expect(createProblemSet).not.toHaveBeenCalled();
    expect(createProblemSets).not.toHaveBeenCalled();
    expect(onCreated).not.toHaveBeenCalled();
    expect(onBatchCreated).not.toHaveBeenCalled();
    expect((screen.getByLabelText("CSV 파일") as HTMLInputElement).disabled).toBe(false);
  });

  it("registers mixed question types together with inferred titles and one batch callback", async () => {
    vi.mocked(readCsvFileText)
      .mockResolvedValueOnce(oxCsv)
      .mockResolvedValueOnce(shortCsv)
      .mockResolvedValueOnce(choiceCsv);
    const onCreated = vi.fn();
    const onBatchCreated = vi.fn();
    render(<CsvUploadPanel subjectId="subject-1" onCreated={onCreated} onBatchCreated={onBatchCreated} />);
    chooseFiles(["민법_OX-연습.csv", "행정법_단답.csv", "헌법_선택형.csv"]);
    await confirmBatch();

    await waitFor(() => expect(onBatchCreated).toHaveBeenCalledTimes(1));
    expect(createProblemSets).toHaveBeenCalledTimes(1);
    expect(createProblemSets).toHaveBeenCalledWith([
      expect.objectContaining({ title: "민법 OX 연습", type: "OX", subjectId: "subject-1", questions: [expect.objectContaining({ question: "가상 OX 문제", answer: "O" })] }),
      expect.objectContaining({ title: "행정법 단답", type: "short", subjectId: "subject-1", questions: [expect.objectContaining({ question: "가상 단답형 문제", answer: "민법" })] }),
      expect.objectContaining({ title: "헌법 선택형", type: "5-choice", subjectId: "subject-1", questions: [expect.objectContaining({ question: "가상 선택형 문제", answer: "3", choices: ["보기 하나", "보기 둘", "보기 셋", "보기 넷", "보기 다섯"] })] }),
    ]);
    expect(onBatchCreated).toHaveBeenCalledWith(["problem-batch-1", "problem-batch-2", "problem-batch-3"]);
    expect(createProblemSet).not.toHaveBeenCalled();
    expect(onCreated).not.toHaveBeenCalled();
  });

  it("uses a numbered fallback when a filename contains no usable title", async () => {
    vi.mocked(readCsvFileText).mockResolvedValue(oxCsv);
    render(<CsvUploadPanel />);
    chooseFiles(["___.csv", "헌법.csv"]);
    await confirmBatch();

    await waitFor(() => expect(createProblemSets).toHaveBeenCalledTimes(1));
    expect(createProblemSets).toHaveBeenCalledWith([
      expect.objectContaining({ title: "새 문제 1", type: "OX" }),
      expect.objectContaining({ title: "헌법", type: "OX" }),
    ]);
  });

  it.each([
    { reason: "unrecognized type", csv: "제목,내용\n알 수 없는 형식,입력" },
    { reason: "empty file", csv: "" },
    { reason: "invalid question row", csv: "번호,문제,선택지1,선택지2,선택지3,선택지4,선택지5,정답\n1,가상 선택형 문제,보기 하나,보기 둘,보기 셋,보기 넷,,3" },
    { reason: "malformed CSV", csv: "번호,문제,정답\n1,\"닫히지 않은 문제,O" },
  ])("does not save any problem when a later file has $reason", async ({ csv }) => {
    vi.mocked(readCsvFileText).mockResolvedValueOnce(oxCsv).mockResolvedValueOnce(csv);
    const onBatchCreated = vi.fn();
    render(<CsvUploadPanel onBatchCreated={onBatchCreated} />);
    chooseFiles(["정상.csv", "확인할_파일.csv"]);
    await confirmBatch();

    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toContain("확인할_파일.csv");
    expect(createProblemSet).not.toHaveBeenCalled();
    expect(createProblemSets).not.toHaveBeenCalled();
    expect(onBatchCreated).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "문제를 일괄 등록할까요?" })).toBeNull());
    expect((screen.getByLabelText("CSV 파일") as HTMLInputElement).disabled).toBe(false);
  });

  it("allows a fresh selection after a later file cannot be read", async () => {
    vi.mocked(readCsvFileText).mockResolvedValueOnce(oxCsv).mockRejectedValueOnce(new Error("read failed"));
    render(<CsvUploadPanel />);
    chooseFiles(["정상.csv", "읽기_실패.csv"]);
    await confirmBatch();
    expect((await screen.findByRole("alert")).textContent).toContain("읽기_실패.csv");
    expect(createProblemSets).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "문제를 일괄 등록할까요?" })).toBeNull());

    vi.mocked(readCsvFileText).mockResolvedValue(oxCsv);
    chooseFiles(["다시_선택한_문제.csv", "나머지_문제.csv"]);
    await confirmBatch();
    await waitFor(() => expect(createProblemSets).toHaveBeenCalledTimes(1));
    expect(createProblemSets).toHaveBeenCalledWith([
      expect.objectContaining({ title: "다시 선택한 문제" }),
      expect.objectContaining({ title: "나머지 문제" }),
    ]);
    expect(createProblemSet).not.toHaveBeenCalled();
  });

  it("ignores pending file reads after the upload panel closes", async () => {
    let finishRead!: (value: string) => void;
    vi.mocked(readCsvFileText)
      .mockImplementationOnce(() => new Promise((resolve) => { finishRead = resolve; }))
      .mockResolvedValueOnce(shortCsv);
    const onBatchCreated = vi.fn();
    const view = render(<CsvUploadPanel onBatchCreated={onBatchCreated} />);
    chooseFiles(["느린_파일.csv", "나머지_파일.csv"]);
    await confirmBatch();
    await waitFor(() => expect(readCsvFileText).toHaveBeenCalled());
    view.unmount();
    await act(async () => { finishRead(oxCsv); });

    expect(createProblemSet).not.toHaveBeenCalled();
    expect(createProblemSets).not.toHaveBeenCalled();
    expect(onBatchCreated).not.toHaveBeenCalled();
  });

  it("saves once when batch confirmation is clicked repeatedly during file reading", async () => {
    let finishRead!: (value: string) => void;
    vi.mocked(readCsvFileText)
      .mockImplementationOnce(() => new Promise((resolve) => { finishRead = resolve; }))
      .mockResolvedValueOnce(shortCsv);
    const onBatchCreated = vi.fn();
    render(<CsvUploadPanel onBatchCreated={onBatchCreated} />);
    chooseFiles(["첫_파일.csv", "둘째_파일.csv"]);
    const dialog = await screen.findByRole("dialog", { name: "문제를 일괄 등록할까요?" });
    const confirm = within(dialog).getByRole("button", { name: "일괄 등록" });
    fireEvent.click(confirm);
    fireEvent.click(confirm);
    await act(async () => { finishRead(oxCsv); });

    await waitFor(() => expect(onBatchCreated).toHaveBeenCalledTimes(1));
    expect(readCsvFileText).toHaveBeenCalledTimes(2);
    expect(createProblemSets).toHaveBeenCalledTimes(1);
    expect(createProblemSet).not.toHaveBeenCalled();
  });
});
