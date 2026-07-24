// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { TermsOfServiceLink } from "./TermsOfServiceLink";

afterEach(cleanup);

describe("TermsOfServiceLink", () => {
  it("renders all chapters and articles without draft placeholders", () => {
    render(<TermsOfServiceLink />);
    fireEvent.click(screen.getByRole("button", { name: "이용약관" }));

    const dialog = screen.getByRole("dialog");
    expect(dialog.textContent).toContain("제1장 총칙");
    expect(dialog.textContent).toContain("제13조 (Premium 회원권과 과목 이용권의 관계)");
    expect(dialog.textContent).toContain("제29조 (이전 약관의 확인)");
    expect(dialog.textContent).not.toContain("[확인 필요");
  });

  it("uses paragraph and item markers in the legal hierarchy", () => {
    render(<TermsOfServiceLink />);
    fireEvent.click(screen.getByRole("button", { name: "이용약관" }));

    expect(screen.getAllByLabelText("제1항").length).toBeGreaterThan(0);
    expect(screen.getByText("타인의 명의·이메일 또는 허위 정보를 이용한 경우").parentElement?.parentElement?.textContent)
      .toContain("1.");
  });
});
