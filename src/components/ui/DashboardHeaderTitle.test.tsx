// @vitest-environment jsdom

import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter, Link } from "react-router-dom";
import { DashboardHeaderTitle } from "./DashboardHeaderTitle";

describe("DashboardHeaderTitle", () => {
  afterEach(cleanup);

  it("aligns a single mobile action to the right at its natural width", () => {
    render(
      <MemoryRouter>
        <DashboardHeaderTitle logoTo="/" logoLabel="메인으로 이동">
          <Link to="/">메인으로</Link>
        </DashboardHeaderTitle>
      </MemoryRouter>,
    );

    const actionGroup = screen.getByRole("link", { name: "메인으로" }).parentElement;

    expect(actionGroup?.className).toContain("flex");
    expect(actionGroup?.className).toContain("justify-end");
    expect(actionGroup?.className).toContain("[&>*]:w-auto");
    expect(actionGroup?.className).not.toContain("grid-cols-2");
  });

  it("keeps multiple mobile actions in the two-column layout", () => {
    render(
      <MemoryRouter>
        <DashboardHeaderTitle title="과목" logoTo="/" logoLabel="메인으로 이동">
          <button type="button">새 문제 등록</button>
          <Link to="/">메인으로</Link>
        </DashboardHeaderTitle>
      </MemoryRouter>,
    );

    const actionGroup = screen.getByRole("button", { name: "새 문제 등록" }).parentElement;

    expect(actionGroup?.className).toContain("grid");
    expect(actionGroup?.className).toContain("grid-cols-2");
    expect(actionGroup?.className).toContain("[&>*]:w-full");
  });
});
