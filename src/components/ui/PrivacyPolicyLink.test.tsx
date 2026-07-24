// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { PrivacyPolicyLink } from "./PrivacyPolicyLink";

afterEach(cleanup);

describe("PrivacyPolicyLink", () => {
  it("distinguishes local-only learning data from Premium server records", () => {
    render(<PrivacyPolicyLink />);
    fireEvent.click(screen.getByRole("button", { name: "개인정보처리방침" }));

    const dialog = screen.getByRole("dialog");
    expect(dialog.textContent).toContain("오프라인 학습 데이터는 브라우저 저장소에만 저장");
    expect(dialog.textContent).toContain("문항별 선택·입력 답안");
    expect(dialog.textContent).toContain("Supabase 기반 서버에 저장");
    expect(dialog.textContent).toContain("Google Analytics를 통한 이용 통계 수집과는 구분");
  });

  it("covers retention, processors, user rights, deletion, and the privacy contact", () => {
    render(<PrivacyPolicyLink />);
    fireEvent.click(screen.getByRole("button", { name: "개인정보처리방침" }));

    const dialog = screen.getByRole("dialog");
    expect(dialog.textContent).toContain("처리하는 개인정보의 항목·목적·보유기간");
    expect(dialog.textContent).toContain("Supabase, Inc.");
    expect(dialog.textContent).toContain("정보주체의 권리와 행사 방법");
    expect(dialog.textContent).toContain("개인정보의 파기");
    expect(dialog.textContent).toContain("haryun@knu.ac.kr");
    expect(dialog.textContent).toContain("시행일: 2026년 7월 25일");
  });

  it("states that detailed learning records are excluded from Analytics", () => {
    render(<PrivacyPolicyLink />);
    fireEvent.click(screen.getByRole("button", { name: "개인정보처리방침" }));

    const analyticsSection = screen.getByText("6. Google Analytics에서 제외하는 정보").parentElement;
    expect(analyticsSection?.textContent).toContain("오프라인·온라인 문제");
    expect(analyticsSection?.textContent).toContain("사용자의 선택·입력 답안");
    expect(analyticsSection?.textContent).toContain("Google Analytics로 보내지");
    expect(analyticsSection?.textContent).toContain("학습 데이터 원본");
  });
});
