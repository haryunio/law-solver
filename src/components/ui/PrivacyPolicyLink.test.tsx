// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { PrivacyPolicyLink } from "./PrivacyPolicyLink";

afterEach(cleanup);

describe("PrivacyPolicyLink", () => {
  it("distinguishes local-only learning data from Premium server records", () => {
    render(<PrivacyPolicyLink />);
    fireEvent.click(screen.getByRole("button", { name: "개인정보처리방침" }));

    const serviceSection = screen.getByText("Premium 온라인 문제 풀이").parentElement;
    expect(serviceSection?.textContent).toContain("오프라인 학습 데이터는 브라우저 저장소에만 저장");
    expect(serviceSection?.textContent).toContain("문항별 선택·입력 답안");
    expect(serviceSection?.textContent).toContain("Supabase 기반 서버에 저장");
    expect(serviceSection?.textContent).toContain("Google Analytics를 통한 이용 통계 수집과는 구분");
  });

  it("states that detailed online records are excluded from Analytics, not from Premium storage", () => {
    render(<PrivacyPolicyLink />);
    fireEvent.click(screen.getByRole("button", { name: "개인정보처리방침" }));

    const analyticsSection = screen.getByText("① 쿠키 등 사용 목적").parentElement;
    expect(analyticsSection?.textContent).toContain("오프라인·온라인 문제");
    expect(analyticsSection?.textContent).toContain("Google Analytics로 보내지 않으며");
    expect(analyticsSection?.textContent).toContain("Premium 온라인 기능 제공");
  });
});
