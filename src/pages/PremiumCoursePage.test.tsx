// @vitest-environment jsdom

import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { listPremiumCourses, listPremiumProblemSets, listPremiumProblemSetAttempts, type PremiumAttemptSummary } from "../lib/premiumApi";
import { PremiumCoursePage } from "./PremiumCoursePage";

vi.mock("../lib/premiumApi", async () => {
  const actual = await vi.importActual<typeof import("../lib/premiumApi")>("../lib/premiumApi");
  return {
    ...actual,
    listPremiumCourses: vi.fn(),
    listPremiumProblemSets: vi.fn(),
    listPremiumProblemSetAttempts: vi.fn(),
  };
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("PremiumCoursePage", () => {
  it("renders exactly one server-defined question type tag", async () => {
    vi.mocked(listPremiumCourses).mockResolvedValue([{
      id: "course-1",
      code: "civil",
      name: "민법",
      description: "",
      sort_order: 1,
      entitlement_valid_until: "2026-12-31T00:00:00Z",
    }]);
    vi.mocked(listPremiumProblemSets).mockResolvedValue([{
      id: "problem-set-1",
      course_id: "course-1",
      code: "sample",
      title: "민법 가상 문제",
      description: "",
      revision: 1,
      question_type: "multiple_choice",
      question_count: 3,
      attempt_count: 0,
      sort_order: 1,
    }]);

    render(
      <MemoryRouter initialEntries={["/premium/courses/course-1"]}>
        <Routes>
          <Route path="/premium/courses/:courseId" element={<PremiumCoursePage />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getByText("민법 가상 문제")).toBeTruthy());
    expect(screen.getByText("5지선다")).toBeTruthy();
    expect(screen.queryByText("OX")).toBeNull();
    expect(screen.queryByText("단답형")).toBeNull();
    expect(screen.queryByText("혼합형")).toBeNull();
    expect(screen.getByText("(0 풀이 중)")).toBeTruthy();
    expect(listPremiumProblemSetAttempts).not.toHaveBeenCalled();
  });

  it("counts active and paused sessions together and excludes submitted sessions", async () => {
    vi.mocked(listPremiumCourses).mockResolvedValue([]);
    vi.mocked(listPremiumProblemSets).mockResolvedValue([{
      id: "problem-1", course_id: "course-1", code: "demo", title: "세션 집계 예시",
      description: "", revision: 1, question_type: "ox", question_count: 15, attempt_count: 3, sort_order: 1,
    }]);
    vi.mocked(listPremiumProblemSetAttempts).mockResolvedValue(
      (["in_progress", "paused", "submitted"] as const).map((status, index): PremiumAttemptSummary => ({
        id: `attempt-${index}`, problemSetId: "problem-1", title: "예시 세션", attemptNumber: index + 1,
        status, retryMode: null, orderMode: "number", questionType: "ox", totalQuestions: 15,
        solvedQuestions: 0, scorePercent: null, elapsedSeconds: 0, createdAt: "2026-09-20T00:00:00Z",
      })),
    );
    render(<MemoryRouter initialEntries={["/premium/courses/course-1"]}><Routes>
      <Route path="/premium/courses/:courseId" element={<PremiumCoursePage />} />
    </Routes></MemoryRouter>);
    expect(await screen.findByText("(2 풀이 중)")).toBeTruthy();
    expect(screen.getByText("3")).toBeTruthy();
    expect(listPremiumProblemSetAttempts).toHaveBeenCalledExactlyOnceWith("problem-1");
  });
});
