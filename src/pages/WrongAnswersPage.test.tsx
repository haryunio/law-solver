// @vitest-environment jsdom

import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SessionPageProvider, type SessionPageAdapter } from "../components/session/SessionPageContext";
import type { TestSession } from "../types/test";
import { WrongAnswersPage } from "./WrongAnswersPage";

const session: TestSession = {
  id: "note-session", title: "노트 저장 확인", type: "OX", order_mode: "number",
  total_questions: 3, solved_questions: 3, score: 33, elapsed_time: 12,
  created_at: "2026-09-26T00:00:00Z", status: "completed",
  questions: [
    { id: "correct", no: 10, question: "맞힌 문제", answer: "O", my_answer: "O", originalRow: {} },
    { id: "first-wrong", no: 20, question: "첫 번째 오답", answer: "O", my_answer: "X", wrong_note: "기존 메모", originalRow: {} },
    { id: "second-wrong", no: 30, question: "두 번째 오답", answer: "X", my_answer: "O", originalRow: {} },
  ],
};

beforeEach(() => {
  vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });
  HTMLElement.prototype.scrollTo = vi.fn();
  HTMLElement.prototype.scrollIntoView = vi.fn();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function renderWrong(saveWrongNote: NonNullable<SessionPageAdapter["saveWrongNote"]>) {
  const adapter: SessionPageAdapter = {
    session, dashboardPath: "/dashboard",
    solvePath: (id) => `/solve/${id}`, resultPath: (id) => `/result/${id}`,
    wrongPath: (id) => `/wrong/${id}`, reviewPath: (id) => `/review/${id}`,
    createRetry: vi.fn(), saveWrongNote,
  };
  render(
    <MemoryRouter initialEntries={["/wrong/note-session"]}>
      <SessionPageProvider adapter={adapter}>
        <Routes>
          <Route path="/wrong/:sessionId" element={<WrongAnswersPage />} />
          <Route path="/result/:sessionId" element={<p>결과 도착</p>} />
        </Routes>
      </SessionPageProvider>
    </MemoryRouter>,
  );
}

describe("wrong-answer review navigation", () => {
  it("keeps original solve numbers after filtering and saves before moving to the next question", async () => {
    let finishSave!: () => void;
    const saveWrongNote = vi.fn(() => new Promise<void>((resolve) => { finishSave = resolve; }));
    renderWrong(saveWrongNote);
    expect(screen.getByText(/풀이순번 2번/)).toBeTruthy();
    expect(within(screen.getByRole("complementary")).getByRole("button", { name: "2 X O •" })).toBeTruthy();
    fireEvent.change(screen.getByRole("textbox", { name: "오답 노트" }), { target: { value: "수정한 메모" } });
    fireEvent.click(screen.getByRole("button", { name: /다음 오답/ }));
    expect(saveWrongNote).toHaveBeenCalledWith("first-wrong", "수정한 메모");
    expect(screen.getByText("첫 번째 오답")).toBeTruthy();
    expect(screen.getByText("오답 노트를 저장하는 중입니다")).toBeTruthy();
    await act(async () => finishSave());
    expect(screen.getByText("두 번째 오답")).toBeTruthy();
    expect(screen.getByText(/풀이순번 3번/)).toBeTruthy();
    expect((screen.getByRole("textbox", { name: "오답 노트" }) as HTMLTextAreaElement).value).toBe("");
    expect(screen.queryByText("오답 노트를 저장하는 중입니다")).toBeNull();
  });

  it.each(["next", "result", "omr"] as const)("keeps the question and draft when saving fails during %s navigation", async (destination) => {
    const saveWrongNote = vi.fn().mockRejectedValue(new Error("save failed"));
    renderWrong(saveWrongNote);
    fireEvent.change(screen.getByRole("textbox", { name: "오답 노트" }), { target: { value: "저장되지 않은 메모" } });
    if (destination === "omr") fireEvent.click(screen.getByRole("button", { name: "OMR" }));
    await act(async () => {
      if (destination === "omr") {
        fireEvent.click(within(screen.getByRole("region", { name: "오답 OMR 이동" })).getByRole("button", { name: "3 O X" }));
      } else {
        fireEvent.click(screen.getByRole("button", { name: destination === "next" ? /다음 오답/ : /결과로/ }));
      }
    });
    expect(saveWrongNote).toHaveBeenCalledWith("first-wrong", "저장되지 않은 메모");
    expect(screen.getByText("첫 번째 오답")).toBeTruthy();
    expect(screen.queryByText("결과 도착")).toBeNull();
    expect((screen.getByRole("textbox", { name: "오답 노트" }) as HTMLTextAreaElement).value).toBe("저장되지 않은 메모");
    expect(screen.queryByText("오답 노트를 저장하는 중입니다")).toBeNull();
    if (destination === "omr") expect(screen.getByRole("region", { name: "오답 OMR 이동" })).toBeTruthy();
    // A failed request releases the saving state so the same draft can be retried.
    saveWrongNote.mockResolvedValue(undefined);
    await act(async () => fireEvent.click(screen.getByRole("button", { name: /다음 오답/ })));
    expect(screen.getByText("두 번째 오답")).toBeTruthy();
  });

  it("does not save an unchanged draft and closes mobile OMR after selecting a question", async () => {
    const saveWrongNote = vi.fn().mockResolvedValue(undefined);
    renderWrong(saveWrongNote);
    fireEvent.click(screen.getByRole("button", { name: "OMR" }));
    await act(async () => fireEvent.click(within(screen.getByRole("region", { name: "오답 OMR 이동" })).getByRole("button", { name: "3 O X" })));
    expect(saveWrongNote).not.toHaveBeenCalled();
    expect(screen.getByText("두 번째 오답")).toBeTruthy();
    expect(screen.queryByRole("region", { name: "오답 OMR 이동" })).toBeNull();
  });
});
