// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AppRoutes } from "./AppRoutes";

vi.mock("../components/storage/OfflineDataHydrationGate", () => ({
  OfflineDataHydrationGate: () => <p>오프라인 저장소 확인</p>,
}));
vi.mock("../pages/LandingPage", () => ({ LandingPage: () => <p>서비스 소개</p> }));
vi.mock("../pages/AppHomePage", () => ({ AppHomePage: () => <p>서비스 홈</p> }));
vi.mock("../pages/PremiumDashboardPage", () => ({ PremiumDashboardPage: () => <p>온라인 학습</p> }));
vi.mock("../pages/SideAppsPage", () => ({ SideAppsPage: () => <p>미니 앱</p> }));
vi.mock("../pages/PremiumCoursePage", () => ({ PremiumCoursePage: () => { throw new Error("internal render detail"); } }));

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe("application route boundaries", () => {
  it.each([["/", "서비스 소개"], ["/home", "서비스 홈"], ["/premium", "온라인 학습"], ["/apps", "미니 앱"]])(
    "opens %s independently of offline storage", async (path, heading) => {
      render(<MemoryRouter initialEntries={[path]}><AppRoutes /></MemoryRouter>);
      expect(await screen.findByText(heading)).toBeTruthy();
      expect(screen.queryByText("오프라인 저장소 확인")).toBeNull();
    },
  );

  it.each(["/settings", "/dashboard", "/dashboard/subject", "/solve/session", "/result/session", "/wrong/session", "/review/session"])(
    "requires restored data before opening %s", async (path) => {
      render(<MemoryRouter initialEntries={[path]}><AppRoutes /></MemoryRouter>);
      expect(await screen.findByText("오프라인 저장소 확인")).toBeTruthy();
    },
  );

  it("offers recovery from rendering failures without showing internal details", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    render(<MemoryRouter initialEntries={["/premium/courses/broken"]}><AppRoutes /></MemoryRouter>);
    expect(await screen.findByRole("heading", { name: "화면을 열지 못했습니다" })).toBeTruthy();
    expect(screen.queryByText("internal render detail")).toBeNull();
    fireEvent.click(screen.getByRole("link", { name: "홈으로" }));
    expect(await screen.findByText("서비스 홈")).toBeTruthy();
  });
});
