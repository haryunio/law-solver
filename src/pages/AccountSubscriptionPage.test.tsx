// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";
import { useAccountStore } from "../store/useAccountStore";
import { AccountSubscriptionPage } from "./AccountSubscriptionPage";
import type { MarketplaceProduct } from "../lib/premiumApi";

const initialAccountState = useAccountStore.getState();

const courseProduct: MarketplaceProduct = {
  id: "course-product",
  code: "civil-law_90d",
  name: "민법 기본 문제 90일 이용권",
  description: "",
  kind: "course_pass",
  courseId: "civil-law",
  courseCode: "civil-law",
  courseName: "민법",
  priceKrw: 15000,
  currency: "KRW",
  durationDays: 90,
  maxAttempts: 5,
  requiresPremium: true,
};

afterEach(() => {
  cleanup();
  useAccountStore.setState(initialAccountState, true);
});

describe("AccountSubscriptionPage course products", () => {
  const renderProducts = (state: Partial<ReturnType<typeof useAccountStore.getState>> = {}) => {
    useAccountStore.setState({
      configured: true,
      initialized: true,
      isLoading: false,
      isSignedIn: true,
      isPremiumActive: true,
      packageIds: [],
      purchasingCode: null,
      marketplaceProducts: [courseProduct],
      ...state,
    });
    render(
      <MemoryRouter initialEntries={["/account?tab=packages"]}>
        <AccountSubscriptionPage />
      </MemoryRouter>,
    );
  };

  it("keeps the selected product and price when opening the purchase methods", () => {
    renderProducts();
    const product = screen.getByRole("article");
    expect(within(product).getByRole("heading", { name: courseProduct.name })).toBeTruthy();
    expect(within(product).getByText("15,000원")).toBeTruthy();
    expect(within(product).getByText("90일")).toBeTruthy();
    expect(within(product).getByText("문제별 5회")).toBeTruthy();

    fireEvent.click(within(product).getByRole("button", { name: "이용권 구매" }));
    const dialog = screen.getByRole("dialog", { name: "결제 방법 선택" });
    expect(within(dialog).getByText(courseProduct.name)).toBeTruthy();
    expect(within(dialog).getByText("15,000원")).toBeTruthy();
  });

  it("keeps an owned product unavailable for another purchase", () => {
    renderProducts({ packageIds: [courseProduct.code] });
    expect(screen.getByRole("button", { name: "이용 중" })).toHaveProperty("disabled", true);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it.each([
    { isSignedIn: false, isPremiumActive: false, action: "로그인 후 구매", tab: "계정" },
    { isSignedIn: true, isPremiumActive: false, action: "Premium 회원권 필요", tab: "Law Solver Premium" },
  ])("keeps the prerequisite navigation for $action", ({ isSignedIn, isPremiumActive, action, tab }) => {
    renderProducts({ isSignedIn, isPremiumActive });
    fireEvent.click(screen.getByRole("button", { name: action }));
    expect(screen.getByRole("tab", { name: tab }).getAttribute("aria-selected")).toBe("true");
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});

describe("AccountSubscriptionPage Premium membership", () => {
  it("shows the current start date and final scheduled end date", () => {
    useAccountStore.setState({
      configured: true,
      initialized: true,
      isLoading: false,
      isSignedIn: true,
      isPremiumActive: true,
      entitlements: [
        {
          id: "active",
          product_code: "premium_30d",
          kind: "premium",
          course_id: null,
          status: "active",
          starts_at: "2026-07-01T03:00:00Z",
          ends_at: "2026-07-31T03:00:00Z",
        },
        {
          id: "scheduled",
          product_code: "premium_30d",
          kind: "premium",
          course_id: null,
          status: "scheduled",
          starts_at: "2026-07-31T03:00:00Z",
          ends_at: "2026-08-30T03:00:00Z",
        },
      ],
      marketplaceProducts: [{
        id: "premium-product",
        code: "premium_30d",
        name: "Law Solver Premium 30일 회원권",
        description: "",
        kind: "premium",
        courseId: null,
        courseCode: null,
        courseName: null,
        priceKrw: 9900,
        currency: "KRW",
        durationDays: 30,
        maxAttempts: null,
        requiresPremium: false,
      }],
    });

    render(
      <MemoryRouter initialEntries={["/account?tab=premium"]}>
        <AccountSubscriptionPage />
      </MemoryRouter>,
    );

    expect(screen.getByText("현재 이용 중")).toBeTruthy();
    expect(screen.getByText("이용 시작 일자").parentElement?.textContent).toContain("2026. 7. 1.");
    expect(screen.getByText("종료 예정 일자").parentElement?.textContent).toContain("2026. 8. 30.");
    expect(screen.getByText("온라인 문제 풀이 기능 사용")).toBeTruthy();
    expect(screen.getByText("Premium 전용 과목 이용권 구매 가능")).toBeTruthy();
    expect(screen.getByText("오프라인 문제 풀이 데이터 클라우드 백업 기능")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Premium 30일 연장" })).toBeTruthy();
    expect(screen.queryByText(/추가 결제하면/)).toBeNull();
  });

  it("shows a concise inactive state with the purchase action", () => {
    useAccountStore.setState({
      configured: true,
      initialized: true,
      isLoading: false,
      isSignedIn: true,
      isPremiumActive: false,
      entitlements: [],
      marketplaceProducts: [{
        id: "premium-product",
        code: "premium_30d",
        name: "Law Solver Premium 30일 회원권",
        description: "",
        kind: "premium",
        courseId: null,
        courseCode: null,
        courseName: null,
        priceKrw: 9900,
        currency: "KRW",
        durationDays: 30,
        maxAttempts: null,
        requiresPremium: false,
      }],
    });

    render(
      <MemoryRouter initialEntries={["/account?tab=premium"]}>
        <AccountSubscriptionPage />
      </MemoryRouter>,
    );

    expect(screen.getByText("이용 중이 아닙니다")).toBeTruthy();
    expect(screen.queryByText("이용 시작 일자")).toBeNull();
    expect(screen.queryByText("종료 예정 일자")).toBeNull();
    expect(screen.getByText("온라인 문제 풀이 기능 사용")).toBeTruthy();
    expect(screen.getByText("Premium 전용 과목 이용권 구매 가능")).toBeTruthy();
    expect(screen.getByText("오프라인 문제 풀이 데이터 클라우드 백업 기능")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Premium 30일 구매" })).toBeTruthy();
  });

  it("requires both legal agreements before signup", () => {
    useAccountStore.setState({
      configured: true,
      initialized: true,
      isLoading: false,
      isSignedIn: false,
    });

    render(
      <MemoryRouter initialEntries={["/account"]}>
        <AccountSubscriptionPage />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("tab", { name: "회원가입" }));

    const termsAgreement = screen.getByRole("checkbox", { name: "이용약관 확인 및 동의" });
    const privacyAgreement = screen.getByRole("checkbox", { name: "개인정보처리방침 확인 및 동의" });
    const signupButton = screen.getByRole("button", { name: "회원가입" });

    expect(signupButton).toHaveProperty("disabled", true);
    fireEvent.click(termsAgreement);
    expect(signupButton).toHaveProperty("disabled", true);
    fireEvent.click(privacyAgreement);
    expect(signupButton).toHaveProperty("disabled", false);
  });
});
