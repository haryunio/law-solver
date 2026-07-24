// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import {
  AsyncTransitionOverlay,
  ButtonLoadingContent,
  LoadingRegion,
  SkeletonBlock,
} from "./AsyncLoading";

afterEach(cleanup);

describe("async loading UI", () => {
  it("announces a skeleton region without exposing decorative blocks", () => {
    render(
      <LoadingRegion label="문제 목록을 불러오는 중입니다">
        <SkeletonBlock className="h-10 rounded-xl" />
      </LoadingRegion>,
    );

    expect(screen.getByRole("status", { name: "문제 목록을 불러오는 중입니다" })).toBeTruthy();
  });

  it("keeps progress labels visible in buttons and transition overlays", () => {
    render(
      <>
        <button><ButtonLoadingContent label="결제 처리 중" /></button>
        <AsyncTransitionOverlay label="답안을 제출하고 채점하는 중입니다" />
      </>,
    );

    expect(screen.getByRole("button").textContent).toContain("결제 처리 중");
    expect(screen.getByRole("status").textContent).toContain("답안을 제출하고 채점하는 중입니다");
  });
});
