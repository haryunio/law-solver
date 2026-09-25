// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ParsedQuestion } from "../../types/test";
import { StudyOmrTable } from "./StudyOmrTable";

afterEach(cleanup);

const question = (id: string, values: Partial<ParsedQuestion> = {}): ParsedQuestion => ({
  id,
  no: 1,
  question: "예시 문제",
  answer: "O",
  my_answer: "",
  originalRow: {},
  ...values,
});

describe("StudyOmrTable", () => {
  it("keeps solve rows to number, response, and bookmark without revealing answers", () => {
    render(<StudyOmrTable
      questions={[
        question("first", { answer: "아직 공개하지 않은 정답", bookmark: true }),
        question("second", { my_answer: "X" }),
        question("third"),
      ]}
      currentIndex={0}
      mode="solve"
      onSelect={vi.fn()}
    />);

    const rows = screen.getAllByRole("button");
    expect(rows[0]!.children).toHaveLength(3);
    expect(rows[0]!.getAttribute("aria-current")).toBe("step");
    expect(within(rows[0]!).getByTitle("책갈피").textContent).toBe("★");
    expect(rows[1]!.classList.contains("bg-red-50")).toBe(true);
    expect(rows[2]!.classList.contains("app-study-option-neutral")).toBe(true);
    expect(screen.queryByText("아직 공개하지 않은 정답")).toBeNull();
    expect(screen.queryByText("정답", { exact: true })).toBeNull();
  });

  it("passes the local row index to navigation, updates the current row, and does not submit a surrounding form", () => {
    const onSelect = vi.fn();
    const onSubmit = vi.fn((event: React.FormEvent) => event.preventDefault());
    const questions = [question("first"), question("second")];
    const view = (currentIndex: number) => (
      <form onSubmit={onSubmit}>
        <StudyOmrTable questions={questions} currentIndex={currentIndex} mode="solve" onSelect={onSelect} />
      </form>
    );
    const { rerender } = render(view(0));

    const second = screen.getByRole("button", { name: "2 -" });
    second.focus();
    expect(document.activeElement).toBe(second);
    fireEvent.click(second);
    expect(onSelect).toHaveBeenCalledExactlyOnceWith(1);
    expect(onSubmit).not.toHaveBeenCalled();

    rerender(view(1));
    expect(screen.getByRole("button", { name: "1 -" }).getAttribute("aria-current")).toBeNull();
    expect(second.getAttribute("aria-current")).toBe("step");
  });

  it("preserves multiple-answer and no-correct-choice grading in review rows", () => {
    const choices: ParsedQuestion["choices"] = ["가", "나", "다", "라", "마"];
    render(<StudyOmrTable
      questions={[
        question("multiple", { choices, answer: "1, 2", my_answer: "2" }),
        question("no-correct", { choices, answer: "0", my_answer: "" }),
        question("incorrect", { choices, answer: "3", my_answer: "4" }),
        question("unanswered", { choices, answer: "3", my_answer: "" }),
        question("current", { choices, answer: "3", my_answer: "3" }),
      ]}
      currentIndex={4}
      mode="review"
      onSelect={vi.fn()}
    />);

    expect(screen.getByRole("button", { name: "1 2 1, 2" }).classList.contains("bg-emerald-50")).toBe(true);
    expect(screen.getByRole("button", { name: "2 - 정답 없음" }).classList.contains("bg-emerald-50")).toBe(true);
    expect(screen.getByRole("button", { name: "3 4 3" }).classList.contains("bg-red-50")).toBe(true);
    expect(screen.getByRole("button", { name: "4 - 3" }).classList.contains("bg-red-50")).toBe(true);
    expect(screen.getByRole("button", { name: "5 3 3" }).getAttribute("aria-current")).toBe("step");
    expect(screen.getAllByRole("button")[0]!.children).toHaveLength(4);
  });

  it("uses original solve numbers for filtered review lists and falls back safely when the number is unavailable", () => {
    const questions = [question("filtered", { no: 99 }), question("missing", { no: 100 })];
    const getQuestionNumber = vi.fn((item: ParsedQuestion) => item.id === "filtered" ? 7 : undefined);
    const onSelect = vi.fn();
    render(<StudyOmrTable questions={questions} currentIndex={0} mode="review" getQuestionNumber={getQuestionNumber} onSelect={onSelect} />);

    expect(screen.getByRole("button", { name: "7 - O" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "2 - O" }));
    expect(onSelect).toHaveBeenCalledWith(1);
    expect(getQuestionNumber).toHaveBeenCalledWith(questions[0], 0);
  });

  it("keeps long short answers available in titles while constraining them to their cells", () => {
    const answer = "매우 긴 단답형 정답의 전체 내용";
    const response = "사용자가 작성한 긴 단답형 답안의 전체 내용";
    render(<StudyOmrTable
      questions={[question("short", { answer, my_answer: response, wrong_note: "복습할 내용" }), question("blank-note", { wrong_note: " \n " })]}
      currentIndex={0}
      mode="review"
      onSelect={vi.fn()}
    />);

    for (const text of [answer, response]) {
      const cell = screen.getByTitle(text);
      expect(cell.textContent).toBe(text);
      expect(cell.classList.contains("truncate")).toBe(true);
      expect(cell.classList.contains("min-w-0")).toBe(true);
    }
    expect(screen.getAllByTitle("오답 노트 있음")).toHaveLength(1);
    expect(screen.getByRole("button", { name: "2 - O" }).textContent).not.toContain("•");
  });

  it("exposes row elements for caller-owned scrolling and clears them on unmount", () => {
    const rowRef = vi.fn();
    const { unmount } = render(<StudyOmrTable
      questions={[question("first"), question("second")]}
      currentIndex={0}
      mode="solve"
      onSelect={vi.fn()}
      rowRef={rowRef}
    />);

    const rows = screen.getAllByRole("button");
    expect(rowRef).toHaveBeenCalledWith(0, rows[0]);
    expect(rowRef).toHaveBeenCalledWith(1, rows[1]);
    unmount();
    expect(rowRef).toHaveBeenCalledWith(0, null);
    expect(rowRef).toHaveBeenCalledWith(1, null);
  });
});
