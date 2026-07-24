// @vitest-environment jsdom

import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Toast } from "./Toast";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("Toast", () => {
  it("renders through a fixed portal without entering the page layout", () => {
    const { container } = render(
      <main data-testid="page-layout">
        <Toast message="다시 로그인해 주세요." onDismiss={() => undefined} />
      </main>,
    );

    const alert = screen.getByRole("alert");
    expect(alert.textContent).toContain("다시 로그인해 주세요.");
    expect(alert.parentElement?.className).toContain("fixed");
    expect(container.querySelector('[role="alert"]')).toBeNull();
  });

  it("can be dismissed immediately or after its display duration", () => {
    vi.useFakeTimers();
    const onDismiss = vi.fn();
    render(<Toast message="저장하지 못했습니다." onDismiss={onDismiss} durationMs={1_000} />);

    fireEvent.click(screen.getByRole("button", { name: "알림 닫기" }));
    expect(onDismiss).toHaveBeenCalledTimes(1);

    act(() => vi.advanceTimersByTime(1_000));
    expect(onDismiss).toHaveBeenCalledTimes(2);
  });

  it("uses polite status semantics for success feedback", () => {
    render(<Toast message="로그인했습니다." tone="success" />);

    expect(screen.getByRole("status").textContent).toContain("로그인했습니다.");
  });
});
