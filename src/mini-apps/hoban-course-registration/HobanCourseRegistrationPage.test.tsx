// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";
import { useAccountStore } from "../../store/useAccountStore";
import { HobanCourseRegistrationPage } from "./HobanCourseRegistrationPage";

const initialAccountState = useAccountStore.getState();

const renderPage = () => render(
  <MemoryRouter initialEntries={["/apps/hoban-course-registration"]}>
    <HobanCourseRegistrationPage />
  </MemoryRouter>,
);

afterEach(() => {
  cleanup();
  useAccountStore.setState(initialAccountState, true);
});

describe("HobanCourseRegistrationPage Premium gate", () => {
  it("asks signed-out users to log in without rendering the static app", () => {
    useAccountStore.setState({
      initialized: true,
      isSignedIn: false,
      isPremiumActive: false,
    });

    renderPage();

    expect(screen.getByRole("dialog", { name: "로그인이 필요합니다" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "로그인하러 가기" }).getAttribute("href")).toBe("/account");
    expect(screen.queryByTitle("호반대학교 수강신청 연습")).toBeNull();
  });

  it("sends signed-in non-Premium users to the Premium tab", () => {
    useAccountStore.setState({
      initialized: true,
      isSignedIn: true,
      isPremiumActive: false,
    });

    renderPage();

    expect(screen.getByRole("dialog", { name: "Premium 회원 전용 미니 앱입니다" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Premium 확인하기" }).getAttribute("href")).toBe("/account?tab=premium");
    expect(screen.queryByTitle("호반대학교 수강신청 연습")).toBeNull();
  });

  it("renders the static app only for active Premium users", () => {
    useAccountStore.setState({
      initialized: true,
      isSignedIn: true,
      isPremiumActive: true,
    });

    renderPage();

    expect(screen.getByTitle("호반대학교 수강신청 연습").getAttribute("src")).toBe(
      "/mini-apps/hoban-course-registration/index.html",
    );
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
