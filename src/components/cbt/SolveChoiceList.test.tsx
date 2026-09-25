// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ParsedQuestion } from "../../types/test";
import { SolveChoiceList } from "./SolveChoiceList";

afterEach(cleanup);

const choiceQuestion: ParsedQuestion = {
  id: "choice-1",
  no: 1,
  question: "옳은 설명을 고르시오.",
  choices: ["첫 번째 설명", "두 번째 설명", "세 번째 설명", "네 번째 설명", "다섯 번째 설명"],
  answer: "2",
  my_answer: "",
  originalRow: {},
};

const oxQuestion: ParsedQuestion = {
  id: "ox-1",
  no: 1,
  question: "옳은 설명이다.",
  answer: "O",
  my_answer: "",
  originalRow: {},
};

describe("SolveChoiceList", () => {
  it("sends the selected answer immediately and reflects the caller's answer without remounting choices", () => {
    const onAnswer = vi.fn();
    const props = { type: "5-choice" as const, showAnswer: false, showNext: true, onAnswer, onInlineNext: vi.fn() };
    const { rerender } = render(<SolveChoiceList {...props} question={choiceQuestion} />);
    const option = screen.getByRole("button", { name: /2 두 번째 설명/ });
    fireEvent.click(option);
    expect(onAnswer).toHaveBeenCalledExactlyOnceWith("2");
    expect(option.getAttribute("aria-pressed")).toBe("false");
    expect(choiceQuestion.my_answer).toBe("");

    rerender(<SolveChoiceList {...props} question={{ ...choiceQuestion, my_answer: "2" }} />);
    expect(screen.getByRole("button", { name: /2 두 번째 설명/ })).toBe(option);
    expect(option.getAttribute("aria-pressed")).toBe("true");
    expect(option.classList.contains("border-red-600")).toBe(true);

    rerender(<SolveChoiceList {...props} question={{ ...choiceQuestion, id: "choice-2" }} />);
    expect(screen.getByRole("button", { name: /2 두 번째 설명/ })).toBe(option);
    expect(option.getAttribute("aria-pressed")).toBe("false");
  });

  it("keeps OX inline navigation separate from answer selection", () => {
    const onAnswer = vi.fn();
    const onInlineNext = vi.fn();
    const props = { type: "OX" as const, showAnswer: false, showNext: true, onAnswer, onInlineNext };
    const { rerender, container } = render(<SolveChoiceList {...props} question={oxQuestion} />);
    expect(screen.queryByRole("button", { name: "다음 문제로" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "O" }));
    expect(onAnswer).toHaveBeenCalledExactlyOnceWith("O");
    expect(onInlineNext).not.toHaveBeenCalled();

    rerender(<SolveChoiceList {...props} question={{ ...oxQuestion, my_answer: "O" }} />);
    const next = screen.getByRole("button", { name: "다음 문제로" });
    expect(next.classList.contains("absolute")).toBe(true);
    expect(next.parentElement).toBe(screen.getByRole("button", { name: "O" }).parentElement);
    expect(container.querySelector("button button")).toBeNull();
    fireEvent.click(next);
    expect(onInlineNext).toHaveBeenCalledOnce();
    expect(onAnswer).toHaveBeenCalledTimes(1);

    rerender(<SolveChoiceList {...props} question={{ ...oxQuestion, my_answer: "X" }} />);
    expect(screen.getByRole("button", { name: "다음 문제로" }).parentElement).toBe(screen.getByRole("button", { name: "X" }).parentElement);
  });

  it("hides inline navigation on the last question and while revealing answers", () => {
    const question = { ...oxQuestion, my_answer: "O" };
    const props = { question, type: "OX" as const, onAnswer: vi.fn(), onInlineNext: vi.fn() };
    const { rerender } = render(<SolveChoiceList {...props} showAnswer={false} showNext={false} />);
    expect(screen.queryByRole("button", { name: "다음 문제로" })).toBeNull();
    rerender(<SolveChoiceList {...props} showAnswer showNext />);
    expect(screen.queryByRole("button", { name: "다음 문제로" })).toBeNull();
    expect(screen.getByRole("button", { name: "O 정답" }).classList.contains("border-emerald-600")).toBe(true);
  });

  it("marks all accepted choices while keeping only the user's selected answer pressed", () => {
    render(<SolveChoiceList question={{ ...choiceQuestion, answer: "1, 2", my_answer: "2" }} type="5-choice" showAnswer showNext onAnswer={vi.fn()} onInlineNext={vi.fn()} />);
    const correct = screen.getByRole("button", { name: /1 첫 번째 설명 정답/ });
    const accepted = screen.getByRole("button", { name: /2 두 번째 설명 정답/ });
    expect(screen.getAllByText("정답")).toHaveLength(2);
    expect(correct.classList.contains("border-blue-600")).toBe(true);
    expect(correct.getAttribute("aria-pressed")).toBe("false");
    expect(accepted.classList.contains("border-emerald-600")).toBe(true);
    expect(accepted.getAttribute("aria-pressed")).toBe("true");
  });

  it("keeps a wrong selection red while displaying the correct choice", () => {
    render(<SolveChoiceList question={{ ...choiceQuestion, my_answer: "3" }} type="5-choice" showAnswer showNext onAnswer={vi.fn()} onInlineNext={vi.fn()} />);
    expect(screen.getByRole("button", { name: /3 세 번째 설명/ }).classList.contains("border-red-600")).toBe(true);
    expect(screen.getByRole("button", { name: /2 두 번째 설명 정답/ }).classList.contains("border-blue-600")).toBe(true);
  });

  it("accepts any chosen answer for answer 0 without marking all five choices as correct", () => {
    const props = { type: "5-choice" as const, showAnswer: true, showNext: true, onAnswer: vi.fn(), onInlineNext: vi.fn() };
    const { rerender } = render(<SolveChoiceList {...props} question={{ ...choiceQuestion, answer: "0", my_answer: "4" }} />);
    expect(screen.queryByText("정답")).toBeNull();
    expect(screen.getByRole("button", { name: /4 네 번째 설명/ }).classList.contains("border-emerald-600")).toBe(true);
    expect(screen.getAllByRole("button").filter((button) => button.classList.contains("border-emerald-600"))).toHaveLength(1);

    rerender(<SolveChoiceList {...props} question={{ ...choiceQuestion, answer: "0" }} />);
    expect(screen.queryByText("정답")).toBeNull();
    expect(screen.getAllByRole("button").every((button) => button.getAttribute("aria-pressed") === "false")).toBe(true);
    expect(screen.getAllByRole("button").some((button) => button.classList.contains("border-emerald-600"))).toBe(false);
  });

  it("keeps a narrow number column and places the answer badge below the full-width choice text", () => {
    const text = "긴 선지에서도 정답 표시는 본문 너비를 별도로 차지하지 않습니다.";
    render(<SolveChoiceList question={{ ...choiceQuestion, choices: [`<strong>${text}</strong><br>계속되는 설명`, "두 번째 설명", "세 번째 설명", "네 번째 설명", "다섯 번째 설명"], answer: "1" }} type="5-choice" showAnswer showNext onAnswer={vi.fn()} onInlineNext={vi.fn()} />);
    const option = screen.getByRole("button", { name: `1 ${text} 계속되는 설명 정답` });
    const badge = within(option).getByText("정답");
    const content = option.querySelector(".col-start-2.row-start-1")!;
    expect(option.classList.contains("grid-cols-[16px_minmax(0,1fr)]")).toBe(true);
    expect(badge.classList.contains("col-start-2")).toBe(true);
    expect(badge.classList.contains("row-start-2")).toBe(true);
    expect(badge.classList.contains("self-start")).toBe(true);
    expect(content.nextElementSibling).toBe(badge);
    expect(option.querySelector("strong")?.textContent).toBe(text);
    expect(option.querySelector("br")).not.toBeNull();
  });

  it("leaves short-answer rendering to the caller", () => {
    render(<SolveChoiceList question={oxQuestion} type="short" showAnswer={false} showNext onAnswer={vi.fn()} onInlineNext={vi.fn()} />);
    expect(screen.queryByRole("button")).toBeNull();
  });
});
