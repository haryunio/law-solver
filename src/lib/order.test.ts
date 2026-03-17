import { describe, expect, it } from "vitest";
import { orderQuestions } from "./order";
import { ParsedQuestion } from "../types/test";

const baseQuestions: ParsedQuestion[] = [
  {
    id: "q3",
    no: 3,
    chapter: "A",
    question: "q3",
    answer: "O",
    my_answer: "",
    originalRow: {},
  },
  {
    id: "q1",
    no: 1,
    chapter: "A",
    question: "q1",
    answer: "X",
    my_answer: "",
    originalRow: {},
  },
  {
    id: "q2",
    no: 2,
    chapter: "B",
    question: "q2",
    answer: "O",
    my_answer: "",
    originalRow: {},
  },
];

describe("orderQuestions", () => {
  it("sorts by number when number mode", () => {
    const ordered = orderQuestions(baseQuestions, "number");
    expect(ordered.map((q) => q.no)).toEqual([1, 2, 3]);
  });

  it("shuffles all questions when random mode", () => {
    const ordered = orderQuestions(baseQuestions, "random", () => 0);
    expect(ordered.map((q) => q.id)).toEqual(["q1", "q2", "q3"]);
  });

  it("shuffles inside each chapter in chapter-random mode", () => {
    const ordered = orderQuestions(baseQuestions, "chapter-random", () => 0);
    expect(ordered.map((q) => q.chapter)).toEqual(["A", "A", "B"]);
    expect(ordered.map((q) => q.id)).toEqual(["q1", "q3", "q2"]);
  });
});

