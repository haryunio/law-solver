// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
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
  pausePremiumAttempt: vi.fn(),
}));

vi.mock("../components/cbt/CbtSolveScreen", () => ({
  CbtSolveScreen: (props: ComponentProps<typeof CbtSolveScreen>) => <div>
    <p>내 답안: {props.sessionOverride?.questions[0]?.my_answer}</p>
    <button onClick={() => props.onAnswerChange?.("question", "O")}>답안 선택</button>
    <button onClick={() => props.onQuestionLeave?.("question")}>다음 문항</button>
    <button onClick={() => props.onSubmitted?.("attempt")}>제출</button>
    <button onClick={() => props.onPaused?.("attempt")}>중단</button>
  </div>,
}));

const attempt: api.PremiumAttempt = {
  id: "attempt", problemSetId: "set", courseId: "course", title: "가상 문제",
  sourceAttemptId: null, retryMode: null, orderMode: "number", status: "in_progress",
  revision: 1, elapsedSeconds: 0, startedAt: "2026-01-01T00:00:00Z",
  questions: [{ id: "question", position: 1, type: "ox", chapter: "", prompt: "가상 지문", boxes: null, choices: null, source: "", points: 1, answer: null }],
};

beforeEach(() => {
  vi.mocked(api.getPremiumAttempt).mockResolvedValue(attempt);
  vi.mocked(api.savePremiumAnswer).mockRejectedValue(new TypeError("network unavailable"));
});
afterEach(() => { cleanup(); vi.resetAllMocks(); });

async function openAttempt() {
  render(<MemoryRouter initialEntries={["/premium/attempts/attempt"]}><Routes>
    <Route path="/premium/attempts/:attemptId" element={<PremiumSolvePage />} />
    <Route path="/premium/results/:attemptId" element={<p>결과 도착</p>} />
  </Routes></MemoryRouter>);
  fireEvent.click(await screen.findByText("답안 선택"));
}

describe("Premium unsaved answers", () => {
  it.each(["제출", "중단"])("keeps the local answer and blocks %s if saving fails", async (action) => {
    await openAttempt();
    fireEvent.click(screen.getByText(action));
    await waitFor(() => expect(api.savePremiumAnswer).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.queryByRole("status")).toBeNull());
    expect(screen.getByText("내 답안: O")).toBeTruthy();
    expect(api.submitPremiumAttempt).not.toHaveBeenCalled();
    expect(api.pausePremiumAttempt).not.toHaveBeenCalled();
  });

  it("retries an unsaved answer before submitting with the latest revision", async () => {
    await openAttempt();
    fireEvent.click(screen.getByText("다음 문항"));
    await screen.findByText(/인터넷 연결을 확인/);
    expect(screen.getByText("내 답안: O")).toBeTruthy();
    vi.mocked(api.savePremiumAnswer).mockResolvedValue({ ...attempt, revision: 2 });
    vi.mocked(api.submitPremiumAttempt).mockResolvedValue({ id: "attempt" } as api.PremiumAttemptResult);
    fireEvent.click(screen.getByText("제출"));
    await screen.findByText("결과 도착");
    expect(api.savePremiumAnswer).toHaveBeenLastCalledWith("attempt", "question", "O", 1);
    expect(api.submitPremiumAttempt).toHaveBeenCalledWith("attempt", 2);
  });
});
