// @vitest-environment jsdom

import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { PremiumQuestion } from "../../lib/premiumApi";
import { useSettingsStore } from "../../store/useSettingsStore";
import { PremiumQuestionContent } from "./PremiumQuestionContent";

beforeEach(() => useSettingsStore.setState(useSettingsStore.getInitialState()));
afterEach(() => {
  cleanup();
  useSettingsStore.setState(useSettingsStore.getInitialState());
});

describe("PremiumQuestionContent case links", () => {
  it("links source citations while preserving plain source text and leaving prompts and boxes alone", () => {
    const question: PremiumQuestion = {
      id: "question-with-source",
      position: 1,
      type: "ox",
      chapter: "",
      prompt: "99다1234를 검토한 문제",
      boxes: ["2001므1250의 판단"],
      choices: null,
      source: "대법원 2005다73105 판결 <strong>참고 자료</strong>",
      points: 1,
    };
    render(<PremiumQuestionContent question={question} />);
    expect(screen.getAllByRole("link")).toHaveLength(1);
    const link = screen.getByRole("link", { name: "2005다73105, 국가법령정보센터에서 새 탭으로 열기" });
    expect(link.getAttribute("href")).toBe(`https://www.law.go.kr/LSW/precInfoP.do?mode=0&evtNo=${encodeURIComponent("2005다73105")}`);
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toContain("noopener");
    const source = link.closest("p")!;
    expect(source.textContent).toBe("출처: 대법원 2005다73105 판결 <strong>참고 자료</strong>");
    expect(source.querySelector("strong")).toBeNull();
    expect(screen.getByText("99다1234를 검토한 문제").closest("a")).toBeNull();
    expect(screen.getByText("2001므1250의 판단").closest("a")).toBeNull();

    act(() => useSettingsStore.getState().setPrecedentLinkProvider("off"));
    expect(screen.queryAllByRole("link")).toHaveLength(0);
    expect(screen.getByText(question.source)).toBeTruthy();
  });
});
