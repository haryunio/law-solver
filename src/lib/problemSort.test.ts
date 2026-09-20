import { describe, expect, it } from "vitest";
import { sortProblemSets } from "./problemSort";

const problems = Object.freeze([
  { title: "민법 10", created_at: "2026-09-03T00:00:00Z" },
  { title: "헌법", created_at: "2026-09-01T00:00:00Z" },
  { title: "민법 2", created_at: "2026-09-02T00:00:00Z" },
]);

describe("problem list sorting", () => {
  it.each([
    ["title", "asc", ["민법 2", "민법 10", "헌법"]],
    ["title", "desc", ["헌법", "민법 10", "민법 2"]],
    ["created_at", "asc", ["헌법", "민법 2", "민법 10"]],
    ["created_at", "desc", ["민법 10", "민법 2", "헌법"]],
  ] as const)("sorts by %s %s without mutating the source", (key, direction, titles) => {
    expect(sortProblemSets(problems, key, direction).map((problem) => problem.title)).toEqual(titles);
  });

  it("preserves the original order for equal keys", () => {
    const tied = [problems[0]!, { ...problems[0]! }];
    const sorted = sortProblemSets(tied, "created_at", "desc");
    expect(sorted[0]).toBe(tied[0]);
    expect(sorted[1]).toBe(tied[1]);
  });
});
