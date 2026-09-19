// @vitest-environment jsdom

import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { listPremiumCourses } from "../lib/premiumApi";
import { useAccountStore } from "../store/useAccountStore";
import { PremiumDashboardPage } from "./PremiumDashboardPage";
import { getPremiumSubjectCoverStyle } from "../lib/subjectCover";

vi.mock("../lib/premiumApi", async () => {
  const actual = await vi.importActual<typeof import("../lib/premiumApi")>("../lib/premiumApi");
  return {
    ...actual,
    listPremiumCourses: vi.fn(),
  };
});

const initialAccountState = useAccountStore.getState();

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  useAccountStore.setState(initialAccountState, true);
});

describe("PremiumDashboardPage course covers", () => {
  it("uses the course name to assign the online course gradient", async () => {
    useAccountStore.setState({
      initialized: true,
      isSignedIn: true,
      isPremiumActive: true,
    });
    vi.mocked(listPremiumCourses).mockResolvedValue([{
      id: "course-1",
      code: "legal-ethics",
      name: "법조윤리",
      description: "",
      sort_order: 1,
      entitlement_valid_until: "2026-12-31T00:00:00Z",
    }]);

    render(
      <MemoryRouter initialEntries={["/premium"]}>
        <PremiumDashboardPage />
      </MemoryRouter>,
    );

    const heading = await waitFor(() => screen.getByRole("heading", { name: "법조윤리" }));
    const card = heading.closest("a");
    const artwork = card?.querySelector<HTMLElement>('[aria-hidden="true"][style]');
    const book = card?.querySelector(".app-subject-book");

    expect(artwork?.style.background).toBe(getPremiumSubjectCoverStyle("법조윤리").background);
    expect(book?.getAttribute("style")).toContain("--subject-accent");
    expect(card?.getAttribute("href")).toBe("/premium/courses/course-1");
    expect(card?.textContent).toContain("2026. 12. 31.까지");
    expect(card?.textContent).toContain("Premium");
    expect(card?.textContent).toContain("문제 목록");
  });
});
