// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TabContentMotion } from "./TabContentMotion";

const originalAnimate = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "animate");
afterEach(() => {
  cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals();
  if (originalAnimate) Object.defineProperty(HTMLElement.prototype, "animate", originalAnimate);
  else Reflect.deleteProperty(HTMLElement.prototype, "animate");
});

describe("TabContentMotion", () => {
  function setup(reduced = false) {
    const cancel = vi.fn();
    const animate = vi.fn((_frames: Keyframe[], _options: KeyframeAnimationOptions) => ({ cancel }));
    vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: reduced, addEventListener: vi.fn(), removeEventListener: vi.fn() })));
    Object.defineProperty(HTMLElement.prototype, "animate", { configurable: true, value: animate });
    return { animate, cancel };
  }

  it("preserves input and focus while animating tab direction, including rapid changes", () => {
    const { animate, cancel } = setup();
    const panel = (index: number) => <TabContentMotion activeIndex={index}><input aria-label="이메일" defaultValue="" /></TabContentMotion>;
    const { rerender } = render(panel(0));
    const input = screen.getByRole("textbox") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "student@example.com" } });
    input.focus();
    expect(animate).not.toHaveBeenCalled();
    rerender(panel(1));
    expect(screen.getByRole("textbox")).toBe(input);
    expect(input.value).toBe("student@example.com");
    expect(document.activeElement).toBe(input);
    expect(animate.mock.calls[0]?.[0]?.[0]?.transform).toBe("translateX(8px)");
    rerender(panel(3));
    expect(cancel).toHaveBeenCalledTimes(1);
    rerender(panel(0));
    expect(animate.mock.calls[2]?.[0]?.[0]?.transform).toBe("translateX(-8px)");
    rerender(panel(0));
    expect(animate).toHaveBeenCalledTimes(3);
  });

  it("does not animate when reduced motion is enabled", () => {
    const { animate } = setup(true);
    const { rerender } = render(<TabContentMotion activeIndex={0}>첫 탭</TabContentMotion>);
    rerender(<TabContentMotion activeIndex={1}>다음 탭</TabContentMotion>);
    expect(screen.getByText("다음 탭")).toBeTruthy();
    expect(animate).not.toHaveBeenCalled();
  });
});
