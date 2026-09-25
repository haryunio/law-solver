// @vitest-environment jsdom

import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import type { TestSession } from "../../types/test";
import { useSettingsStore } from "../../store/useSettingsStore";
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

beforeEach(() => useSettingsStore.setState(useSettingsStore.getInitialState()));
afterEach(() => {
  cleanup();
  useSettingsStore.setState(useSettingsStore.getInitialState());
});

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

    fireEvent.click(screen.getByRole("button", { name: "2 나" }));
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

  it("links case numbers in revealed explanations and sources and follows the saved setting", () => {
    const example: TestSession = {
      ...session,
      questions: [{
        ...session.questions[0]!,
        question: "99다1234를 검토한 문제",
        choices: ["2001므1250의 판단", "나", "다", "라", "마"],
        explanation: "99다1234 및 2001므1250 판결을 참조한다.",
        source: "대법원 2005다73105 판결 <strong>참고 자료</strong>",
      }, session.questions[1]!],
    };
    render(<MemoryRouter><CbtSolveScreen sessionId={session.id} sessionOverride={example} /></MemoryRouter>);
    const main = within(screen.getByRole("main"));
    expect(main.queryAllByRole("link")).toHaveLength(0);

    fireEvent.click(screen.getByRole("button", { name: "?" }));
    expect(main.getAllByRole("link")).toHaveLength(3);
    for (const caseNumber of ["99다1234", "2001므1250", "2005다73105"]) {
      const link = main.getByRole("link", { name: `${caseNumber}, 국가법령정보센터에서 새 탭으로 열기` });
      expect(link.getAttribute("href")).toBe(`https://www.law.go.kr/LSW/precInfoP.do?mode=0&evtNo=${encodeURIComponent(caseNumber)}`);
      expect(link.getAttribute("target")).toBe("_blank");
      expect(link.getAttribute("rel")).toContain("noopener");
    }
    expect(main.getByText("99다1234를 검토한 문제").closest("a")).toBeNull();
    expect(main.getByText("2001므1250의 판단").closest("a")).toBeNull();
    const source = main.getByRole("link", { name: "2005다73105, 국가법령정보센터에서 새 탭으로 열기" }).closest("p")!;
    expect(source.textContent).toBe("출처: 대법원 2005다73105 판결 <strong>참고 자료</strong>");
    expect(source.querySelector("strong")).toBeNull();

    act(() => useSettingsStore.getState().setPrecedentLinkProvider("off"));
    expect(main.queryAllByRole("link")).toHaveLength(0);
    expect(main.getByText("99다1234 및 2001므1250 판결을 참조한다.")).toBeTruthy();
    expect(main.getByText("대법원 2005다73105 판결 <strong>참고 자료</strong>")).toBeTruthy();
  });

  it("reveals every accepted choice while continuing to submit one selected answer", () => {
    const onAnswerChange = vi.fn();
    const multipleAnswers: TestSession = {
      ...session,
      questions: [{ ...session.questions[0]!, answer: "1, 2", my_answer: "2" }, session.questions[1]!],
    };
    render(
      <MemoryRouter>
        <CbtSolveScreen sessionId={session.id} sessionOverride={multipleAnswers} onAnswerChange={onAnswerChange} />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByRole("button", { name: "?" }));
    expect(screen.getByRole("button", { name: "1 가 정답" })).toBeTruthy();
    const selected = screen.getByRole("button", { name: "2 나 정답" });
    expect(selected.classList.contains("bg-emerald-50")).toBe(true);
    expect(selected.classList.contains("bg-red-50")).toBe(false);
    expect(screen.getByRole("button", { name: "3 다" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "1 가 정답" }));
    expect(onAnswerChange).toHaveBeenCalledExactlyOnceWith("question-1", "1");
  });

  it.each(["", "3"])("reveals a no-correct-choice question without marking every option as an answer (response: %s)", (response) => {
    const noCorrectChoice: TestSession = {
      ...session,
      questions: [{ ...session.questions[0]!, answer: "0", my_answer: response }, session.questions[1]!],
    };
    render(<MemoryRouter><CbtSolveScreen sessionId={session.id} sessionOverride={noCorrectChoice} /></MemoryRouter>);
    fireEvent.click(screen.getByRole("button", { name: "?" }));
    expect(screen.getByText("정답 없음")).toBeTruthy();
    expect(screen.getByText("이 문항은 답을 고르지 않아도 정답으로 처리됩니다.")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /^[12345].*정답/ })).toBeNull();
    if (response) {
      const selected = screen.getByRole("button", { name: "3 다" });
      expect(selected.classList.contains("bg-emerald-50")).toBe(true);
      expect(selected.classList.contains("bg-red-50")).toBe(false);
    }
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
