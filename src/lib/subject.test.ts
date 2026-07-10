import { describe, expect, it } from "vitest";
import { Subject } from "../types/test";
import { reorderSubjects } from "./subject";

const subjects: Subject[] = ["a", "b", "c", "d"].map((id) => ({
  id,
  name: id.toUpperCase(),
  created_at: "2026-07-11T00:00:00.000Z",
}));

describe("reorderSubjects", () => {
  it("moves a subject before the indicated target", () => {
    expect(reorderSubjects(subjects, "d", "b", "before").map((subject) => subject.id)).toEqual([
      "a",
      "d",
      "b",
      "c",
    ]);
  });

  it("moves a subject after the indicated target", () => {
    expect(reorderSubjects(subjects, "a", "c", "after").map((subject) => subject.id)).toEqual([
      "b",
      "c",
      "a",
      "d",
    ]);
  });

  it("preserves the original array for an invalid move", () => {
    expect(reorderSubjects(subjects, "missing", "b")).toBe(subjects);
    expect(reorderSubjects(subjects, "a", "a")).toBe(subjects);
  });
});
