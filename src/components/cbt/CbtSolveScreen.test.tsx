// @vitest-environment jsdom

import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import type { TestSession } from "../../types/test";
import { CbtSolveScreen } from "./CbtSolveScreen";

beforeAll(() => {
  vi.stubGlobal("ResizeObserver", class {
    observe() {}
    unobserve() {}
    disconnect() {}
  });
  HTMLElement.prototype.scrollTo = vi.fn();
  HTMLElement.prototype.scrollIntoView = vi.fn();
});

afterEach(cleanup);

const session: TestSession = {
  id: "online-attempt",
  title: "온라인 테스트",
  type: "5-choice",
  total_questions: 2,
  solved_questions: 0,
  score: 0,
  elapsed_time: 0,
  created_at: "2026-07-22T00:00:00Z",
  status: "in-progress",
  questions: [
    {
      id: "question-1",
      no: 1,
      question: "첫 번째 문제",
      choices: ["가", "나", "다", "라", "마"],
      answer: "2",
      explanation: "첫 번째 해설",
      my_answer: "",
      originalRow: {},
    },
    {
      id: "question-2",
      no: 2,
      question: "두 번째 문제",
      choices: ["가", "나", "다", "라", "마"],
      answer: "1",
      explanation: "두 번째 해설",
      my_answer: "",
      originalRow: {},
    },
  ],
};

describe("CbtSolveScreen online adapter", () => {
  it("does not expose CSV downloads for premium attempts", () => {
    render(
      <MemoryRouter>
        <CbtSolveScreen
          sessionId={session.id}
          sessionOverride={session}
          allowCsvDownload={false}
        />
      </MemoryRouter>,
    );

    expect(screen.queryByRole("button", { name: "CSV 다운로드" })).toBeNull();
  });

  it("keeps selection local until the learner leaves the question", () => {
    const onAnswerChange = vi.fn();
    const onQuestionLeave = vi.fn();
    render(
      <MemoryRouter>
        <CbtSolveScreen
          sessionId={session.id}
          sessionOverride={session}
          onAnswerChange={onAnswerChange}
          onQuestionLeave={onQuestionLeave}
        />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: "② 나" }));
    expect(onAnswerChange).toHaveBeenCalledWith("question-1", "2");
    expect(onQuestionLeave).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: /다음 문제/ }));
    expect(onQuestionLeave).toHaveBeenCalledTimes(1);
    expect(onQuestionLeave).toHaveBeenCalledWith("question-1");
  });

  it("opens the existing answer panel after a one-question reveal succeeds", async () => {
    const onAnswerRevealRequest = vi.fn().mockResolvedValue(true);
    render(
      <MemoryRouter>
        <CbtSolveScreen
          sessionId={session.id}
          sessionOverride={session}
          canRevealAnswer={false}
          onAnswerRevealRequest={onAnswerRevealRequest}
        />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: "?" }));
    await waitFor(() => expect(screen.getByText("첫 번째 해설")).toBeTruthy());
    expect(onAnswerRevealRequest).toHaveBeenCalledWith("question-1");
  });

  it("shows an in-place loading indicator while one answer is fetched", async () => {
    let resolveReveal: ((value: boolean) => void) | undefined;
    const onAnswerRevealRequest = vi.fn(() => new Promise<boolean>((resolve) => {
      resolveReveal = resolve;
    }));
    render(
      <MemoryRouter>
        <CbtSolveScreen
          sessionId={session.id}
          sessionOverride={session}
          canRevealAnswer={false}
          onAnswerRevealRequest={onAnswerRevealRequest}
        />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: "?" }));
    expect(
      (screen.getByRole("button", { name: "정답과 해설을 불러오는 중" }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);

    await act(async () => resolveReveal?.(true));
    await waitFor(() => expect(screen.getByText("첫 번째 해설")).toBeTruthy());
  });
});
