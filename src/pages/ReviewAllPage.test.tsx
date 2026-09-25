// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SessionPageProvider, type SessionPageAdapter } from "../components/session/SessionPageContext";
import type { TestSession } from "../types/test";
import { useSettingsStore } from "../store/useSettingsStore";
import { ReviewAllPage } from "./ReviewAllPage";
import { ResultPage } from "./ResultPage";
import { WrongAnswersPage } from "./WrongAnswersPage";

beforeEach(() => {
  useSettingsStore.setState(useSettingsStore.getInitialState());
  vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });
  HTMLElement.prototype.scrollTo = vi.fn();
  HTMLElement.prototype.scrollIntoView = vi.fn();
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  useSettingsStore.setState(useSettingsStore.getInitialState());
});

const session: TestSession = {
  id: "multiple-answers-session", title: "복수 정답 복기", type: "5-choice", order_mode: "number",
  total_questions: 2, solved_questions: 2, score: 50, elapsed_time: 12,
  created_at: "2026-09-20T00:00:00Z", status: "completed",
  questions: [
    { id: "accepted", no: 1, question: "허용된 답을 선택한 문제", choices: ["첫 선지", "둘째 선지", "셋째 선지", "넷째 선지", "다섯째 선지"], answer: "1, 2", my_answer: "2", originalRow: {} },
    { id: "incorrect", no: 2, question: "다른 답을 선택한 문제", choices: ["첫 선지", "둘째 선지", "셋째 선지", "넷째 선지", "다섯째 선지"], answer: "1,2", my_answer: "3", originalRow: {} },
  ],
};

function renderReview(page: "all" | "wrong" | "result", example = session) {
  const adapter: SessionPageAdapter = {
    session: example, dashboardPath: "/dashboard",
    solvePath: (id) => `/solve/${id}`, resultPath: (id) => `/result/${id}`,
    wrongPath: (id) => `/wrong/${id}`, reviewPath: (id) => `/review/${id}`,
    createRetry: vi.fn(),
  };
  return render(<MemoryRouter><SessionPageProvider adapter={adapter}>
    {page === "all" ? <ReviewAllPage /> : page === "wrong" ? <WrongAnswersPage /> : <ResultPage />}
  </SessionPageProvider></MemoryRouter>);
}

describe("explanation and source case links in review screens", () => {
  it.each(["all", "wrong"] as const)("links explanation and source citations in %s review without linking questions or choices", (page) => {
    const example: TestSession = {
      ...session,
      total_questions: 1,
      solved_questions: 1,
      questions: [{
        ...session.questions[1]!,
        question: "99다1234를 검토한 문제",
        choices: ["2001므1250의 판단", "둘째 선지", "셋째 선지", "넷째 선지", "다섯째 선지"],
        explanation: "<p>99다1234 및 <strong>2001므1250</strong> 판결을 참조한다.</p>",
        source: "대법원 2005다73105 판결 <strong>참고 자료</strong>",
      }],
    };
    renderReview(page, example);
    const main = within(screen.getByRole("main"));
    expect(main.getAllByRole("link")).toHaveLength(3);
    for (const caseNumber of ["99다1234", "2001므1250", "2005다73105"]) {
      const link = main.getByRole("link", { name: `${caseNumber}, 국가법령정보센터에서 새 탭으로 열기` });
      expect(link.getAttribute("href")).toBe(`https://www.law.go.kr/LSW/precInfoP.do?mode=0&evtNo=${encodeURIComponent(caseNumber)}`);
      expect(link.getAttribute("target")).toBe("_blank");
      expect(link.getAttribute("rel")).toContain("noopener");
    }
    expect(main.getByText("99다1234를 검토한 문제").closest("a")).toBeNull();
    expect(main.getByText("2001므1250의 판단").closest("a")).toBeNull();
    expect(main.getByRole("link", { name: "2001므1250, 국가법령정보센터에서 새 탭으로 열기" }).closest("strong")).not.toBeNull();
    const source = main.getByRole("link", { name: "2005다73105, 국가법령정보센터에서 새 탭으로 열기" }).closest("p")!;
    expect(source.textContent).toBe("대법원 2005다73105 판결 <strong>참고 자료</strong>");
    expect(source.querySelector("strong")).toBeNull();
  });
});

describe("multiple accepted choices in review screens", () => {
  it("marks an accepted choice as correct in the question and both OMR views", () => {
    renderReview("all");
    const main = screen.getByRole("main");
    expect(within(main).getByText("허용된 답을 선택한 문제")).toBeTruthy();
    expect(within(main).queryByText("오답")).toBeNull();
    // One result badge and two accepted-choice badges.
    expect(within(main).getAllByText("정답")).toHaveLength(3);
    expect(within(main).getByText("내 답").classList.contains("bg-emerald-100")).toBe(true);
    expect(within(main).getByText("내 답").classList.contains("bg-red-100")).toBe(false);

    fireEvent.click(screen.getByRole("button", { name: /다음 문제/ }));
    expect(within(main).getByText("오답")).toBeTruthy();
    const desktopRows = within(screen.getByRole("complementary")).getAllByRole("button");
    expect(desktopRows[0]!.classList.contains("bg-emerald-50")).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: "OMR" }));
    const mobilePanel = screen.getByRole("heading", { name: "문항 이동" }).parentElement!.parentElement!;
    const mobileRow = within(mobilePanel).getByRole("button", { name: "1 2 1, 2" });
    expect(mobileRow.classList.contains("bg-emerald-50")).toBe(true);
    fireEvent.click(mobileRow);
    expect(within(main).getByText("허용된 답을 선택한 문제")).toBeTruthy();
    expect(within(main).queryByText("오답")).toBeNull();
  });

  it("excludes an accepted response from wrong-answer review and shows all correct choices for a wrong response", () => {
    renderReview("wrong");
    const main = screen.getByRole("main");
    expect(within(main).queryByText("허용된 답을 선택한 문제")).toBeNull();
    expect(within(main).getByText("다른 답을 선택한 문제")).toBeTruthy();
    expect(within(main).getByText(/오답 1 \/ 1/)).toBeTruthy();
    expect(within(main).getAllByText("정답")).toHaveLength(2);
    expect(within(main).getByText("내 답").classList.contains("bg-red-100")).toBe(true);
  });

  it.each(["", "3"])("treats a no-correct-choice question as correct without false answer badges (response: %s)", (response) => {
    const example: TestSession = {
      ...session,
      questions: [{ ...session.questions[0]!, answer: "0", my_answer: response }, session.questions[1]!],
    };
    renderReview("all", example);
    const main = screen.getByRole("main");
    expect(within(main).getByText("정답 없음")).toBeTruthy();
    expect(within(main).getAllByText("정답")).toHaveLength(1);
    expect(within(main).queryByText("오답")).toBeNull();
    if (response) {
      expect(within(main).getByText("내 답").classList.contains("bg-emerald-100")).toBe(true);
    }
    fireEvent.click(screen.getByRole("button", { name: /다음 문제/ }));
    const desktopRow = within(screen.getByRole("complementary")).getByRole("button", { name: `1 ${response || "-"} 정답 없음` });
    expect(desktopRow.classList.contains("bg-emerald-50")).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "OMR" }));
    const mobilePanel = screen.getByRole("heading", { name: "문항 이동" }).parentElement!.parentElement!;
    const mobileRow = within(mobilePanel).getByRole("button", { name: `1 ${response || "-"} 정답 없음` });
    expect(mobileRow.classList.contains("bg-emerald-50")).toBe(true);
  });

  it("has no wrong answers when the only unanswered question has no correct choice", () => {
    renderReview("wrong", {
      ...session, total_questions: 1, solved_questions: 0, score: 100,
      questions: [{ ...session.questions[0]!, answer: "0", my_answer: "" }],
    });
    expect(screen.getByText("오답이 없습니다.")).toBeTruthy();
  });

  it("counts an unanswered no-correct-choice question once as correct in results and chapter analysis", () => {
    renderReview("result", {
      ...session, solved_questions: 0,
      questions: [
        { ...session.questions[0]!, answer: "0", my_answer: "", chapter: "테스트 파트" },
        { ...session.questions[1]!, my_answer: "", chapter: "테스트 파트" },
      ],
    });
    for (const [label, count] of [["전체", "2"], ["정답", "1"], ["오답", "0"], ["미응답", "1"]]) {
      expect(screen.getByText(label!, { selector: "dt" }).nextElementSibling?.textContent).toBe(count);
    }
    const resultRow = screen.getByTitle("정답 없음").parentElement!;
    expect(resultRow.classList.contains("bg-emerald-50/70")).toBe(true);
    expect(within(resultRow).getByText("정답")).toBeTruthy();
    expect(within(resultRow).queryByText("미응답")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "파트별 분석" }));
    const chapterRow = screen.getByText("테스트 파트").parentElement!;
    expect(Array.from(chapterRow.children).map((cell) => cell.textContent)).toEqual(["테스트 파트", "2", "1", "0", "1", "50%"]);
  });
});
