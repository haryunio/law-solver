// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";
import { useAccountStore } from "../store/useAccountStore";
import { AccountSubscriptionPage } from "./AccountSubscriptionPage";

const initialAccountState = useAccountStore.getState();

afterEach(() => {
  cleanup();
  useAccountStore.setState(initialAccountState, true);
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
    expect(screen.getByRole("button", { name: "Premium 30일 구매" })).toBeTruthy();
  });
});
