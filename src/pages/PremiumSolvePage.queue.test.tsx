// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ComponentProps } from "react";
import * as api from "../lib/premiumApi";
import type { CbtSolveScreen } from "../components/cbt/CbtSolveScreen";
import { PremiumSolvePage } from "./PremiumSolvePage";

vi.mock("../lib/premiumApi", async (original) => ({
  ...await original<typeof import("../lib/premiumApi")>(),
  getPremiumAttempt: vi.fn(),
  savePremiumAnswer: vi.fn(),
  setPremiumBookmark: vi.fn(),
  submitPremiumAttempt: vi.fn(),
}));

vi.mock("../components/cbt/CbtSolveScreen", () => ({
  CbtSolveScreen: (props: ComponentProps<typeof CbtSolveScreen>) => <div>
    <p>내 답안: {props.sessionOverride?.questions[0]?.my_answer}</p>
    <button onClick={() => props.onAnswerChange?.("question", "O")}>O 선택</button>
    <button onClick={() => props.onAnswerChange?.("question", "X")}>X 선택</button>
    <button onClick={() => props.onQuestionLeave?.("question")}>문항 이동</button>
    <button onClick={() => props.onBookmarkChange?.("question")}>책갈피 전환</button>
    <button onClick={() => props.onSubmitted?.("attempt")}>제출</button>
  </div>,
}));

const attempt: api.PremiumAttempt = {
  id: "attempt", problemSetId: "set", courseId: "course", title: "가상 문제",
  sourceAttemptId: null, retryMode: null, orderMode: "number", status: "in_progress",
  revision: 1, elapsedSeconds: 0, startedAt: "2026-01-01T00:00:00Z",
  questions: [{ id: "question", position: 1, type: "ox", chapter: "", prompt: "가상 지문", boxes: null, choices: null, source: "", points: 1, answer: null, bookmarked: false }],
};

function savedAttempt(revision: number, answer: string | null, bookmarked = false): api.PremiumAttempt {
  return { ...attempt, revision, questions: attempt.questions.map((question) => ({ ...question, answer, bookmarked })) };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((complete) => { resolve = complete; });
  return { promise, resolve };
}

beforeEach(() => {
  vi.mocked(api.getPremiumAttempt).mockResolvedValue(attempt);
  vi.mocked(api.submitPremiumAttempt).mockResolvedValue({ id: "attempt" } as api.PremiumAttemptResult);
});
afterEach(() => { cleanup(); vi.resetAllMocks(); });

async function openAttempt() {
  render(<MemoryRouter initialEntries={["/premium/attempts/attempt"]}><Routes>
    <Route path="/premium/attempts/:attemptId" element={<PremiumSolvePage />} />
    <Route path="/premium/results/:attemptId" element={<p>결과 도착</p>} />
  </Routes></MemoryRouter>);
  await screen.findByText("O 선택");
}

describe("Premium queue repeated values", () => {
  it("ignores edits while the final submission is already in flight", async () => {
    const submission = deferred<api.PremiumAttemptResult>();
    vi.mocked(api.submitPremiumAttempt).mockReturnValueOnce(submission.promise);
    await openAttempt();
    fireEvent.click(screen.getByText("제출"));
    await waitFor(() => expect(api.submitPremiumAttempt).toHaveBeenCalledTimes(1));
    // A visual overlay alone does not prevent a focused control's keyboard events.
    fireEvent.click(screen.getByText("O 선택"));
    fireEvent.click(screen.getByText("책갈피 전환"));
    expect(screen.queryByText("내 답안: O")).toBeNull();
    expect(api.setPremiumBookmark).not.toHaveBeenCalled();
    await act(async () => submission.resolve({ id: "attempt" } as api.PremiumAttemptResult));
    await screen.findByText("결과 도착");
  });

  it("keeps the newest answer dirty when an older save has the same value", async () => {
    const first = deferred<api.PremiumAttempt>();
    vi.mocked(api.savePremiumAnswer)
      .mockRejectedValue(new TypeError("network unavailable"))
      .mockReturnValueOnce(first.promise)
      .mockResolvedValueOnce(savedAttempt(3, "X"));
    vi.mocked(api.getPremiumAttempt).mockResolvedValue(savedAttempt(3, "X")).mockResolvedValueOnce(attempt);
    await openAttempt();
    fireEvent.click(screen.getByText("O 선택"));
    fireEvent.click(screen.getByText("문항 이동"));
    await waitFor(() => expect(api.savePremiumAnswer).toHaveBeenCalledTimes(1));
    fireEvent.click(screen.getByText("X 선택"));
    fireEvent.click(screen.getByText("문항 이동"));
    fireEvent.click(screen.getByText("O 선택"));
    fireEvent.click(screen.getByText("문항 이동"));
    await act(async () => first.resolve(savedAttempt(2, "O")));
    await waitFor(() => expect(api.savePremiumAnswer).toHaveBeenCalledTimes(3));
    await screen.findByText(/인터넷 연결을 확인/);
    fireEvent.click(screen.getByText("제출"));
    await waitFor(() => expect(screen.queryByRole("status")).toBeNull());
    expect(api.submitPremiumAttempt).not.toHaveBeenCalled();
    expect(api.savePremiumAnswer).toHaveBeenLastCalledWith("attempt", "question", "O", 3);
    expect(api.savePremiumAnswer).toHaveBeenCalledTimes(4);
    expect(screen.getByText("내 답안: O")).toBeTruthy();
  });

  it("keeps the newest bookmark dirty after toggling back to an earlier value", async () => {
    const first = deferred<api.PremiumAttempt>();
    vi.mocked(api.setPremiumBookmark)
      .mockRejectedValue(new TypeError("network unavailable"))
      .mockReturnValueOnce(first.promise)
      .mockResolvedValueOnce(savedAttempt(3, null, false));
    vi.mocked(api.getPremiumAttempt).mockResolvedValue(savedAttempt(3, null, false)).mockResolvedValueOnce(attempt);
    await openAttempt();
    fireEvent.click(screen.getByText("책갈피 전환"));
    await waitFor(() => expect(api.setPremiumBookmark).toHaveBeenCalledTimes(1));
    fireEvent.click(screen.getByText("책갈피 전환"));
    fireEvent.click(screen.getByText("책갈피 전환"));
    await act(async () => first.resolve(savedAttempt(2, null, true)));
    await waitFor(() => expect(api.setPremiumBookmark).toHaveBeenCalledTimes(3));
    await screen.findByText(/인터넷 연결을 확인/);
    fireEvent.click(screen.getByText("제출"));
    await waitFor(() => expect(screen.queryByRole("status")).toBeNull());
    expect(api.submitPremiumAttempt).not.toHaveBeenCalled();
    expect(api.setPremiumBookmark).toHaveBeenLastCalledWith("attempt", "question", true, 3);
    expect(api.setPremiumBookmark).toHaveBeenCalledTimes(4);
  });
});
