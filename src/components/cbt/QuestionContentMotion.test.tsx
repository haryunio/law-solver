// @vitest-environment jsdom

import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { QuestionContentMotion } from "./QuestionContentMotion";

const originalAnimate = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "animate");

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  if (originalAnimate) Object.defineProperty(HTMLElement.prototype, "animate", originalAnimate);
  else Reflect.deleteProperty(HTMLElement.prototype, "animate");
});

function setup(reduced = false) {
  const preference = {
    matches: reduced,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  };
  const cancellations: ReturnType<typeof vi.fn>[] = [];
  const animate = vi.fn((_frames: Keyframe[], _options: KeyframeAnimationOptions) => {
    const cancel = vi.fn();
    cancellations.push(cancel);
    return { cancel };
  });
  vi.stubGlobal("matchMedia", vi.fn(() => preference));
  Object.defineProperty(HTMLElement.prototype, "animate", { configurable: true, value: animate });
  return { animate, cancellations, preference };
}

function content(questionKey: string, text = "문제", questionIndex = ["first", "second", "third"].indexOf(questionKey)) {
  return <QuestionContentMotion questionKey={questionKey} questionIndex={questionIndex} className="question-content">
    <p>{text}</p>
    <input aria-label="답안" defaultValue="" />
  </QuestionContentMotion>;
}

describe("QuestionContentMotion", () => {
  it("skips entry and ordinary updates, then animates a changed question immediately", () => {
    const { animate } = setup();
    const { rerender } = render(content("first"));
    expect(animate).not.toHaveBeenCalled();

    rerender(content("first", "해설을 연 문제"));
    expect(animate).not.toHaveBeenCalled();

    rerender(content("second", "다음 문제"));
    expect(screen.getByText("다음 문제")).toBeTruthy();
    expect(animate).toHaveBeenCalledOnce();
    expect(animate).toHaveBeenCalledWith([
      { opacity: 0.88, transform: "translateX(4px)" },
      { opacity: 1, transform: "none" },
    ], { duration: 120, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)" });
  });

  it("follows previous/next and OMR jump direction using question order", () => {
    const { animate } = setup();
    const { rerender } = render(content("question-5", "문제", 4));
    rerender(content("question-6", "문제", 5));
    rerender(content("question-5", "문제", 4));
    rerender(content("question-20", "문제", 19));
    rerender(content("question-1", "문제", 0));

    expect(animate.mock.calls.map(([frames]) => frames[0]?.transform)).toEqual([
      "translateX(4px)", "translateX(-4px)", "translateX(4px)", "translateX(-4px)",
    ]);
  });

  it("does not replay for an unchanged question even if its order changes", () => {
    const { animate } = setup();
    const { rerender } = render(content("same-question", "문제", 0));
    rerender(content("same-question", "문제", 2));
    expect(animate).not.toHaveBeenCalled();

    rerender(content("previous-question", "문제", 1));
    expect(animate.mock.calls[0]?.[0]?.[0]?.transform).toBe("translateX(-4px)");
  });

  it("preserves input state, focus and the existing DOM when the question changes", () => {
    setup();
    const { rerender } = render(content("first"));
    const input = screen.getByRole("textbox") as HTMLInputElement;
    const wrapper = input.parentElement;
    fireEvent.change(input, { target: { value: "작성 중인 답안" } });
    input.focus();

    rerender(content("second"));
    expect(screen.getByRole("textbox")).toBe(input);
    expect(input.parentElement).toBe(wrapper);
    expect(input.value).toBe("작성 중인 답안");
    expect(document.activeElement).toBe(input);
    expect(wrapper?.className).toBe("question-content");
  });

  it("cancels the previous animation before a rapid question change", () => {
    const { animate, cancellations } = setup();
    const { rerender } = render(content("first"));
    rerender(content("second"));
    rerender(content("third"));
    expect(animate).toHaveBeenCalledTimes(2);
    expect(cancellations[0]).toHaveBeenCalledOnce();
    expect(cancellations[1]).not.toHaveBeenCalled();

    rerender(content("third", "선택한 답안이 바뀐 문제"));
    expect(animate).toHaveBeenCalledTimes(2);
    expect(cancellations[1]).not.toHaveBeenCalled();
  });

  it("shows question changes without animation when reduced motion is enabled", () => {
    const { animate, preference } = setup(true);
    const { rerender } = render(content("first"));
    rerender(content("second", "다음 문제"));
    expect(screen.getByText("다음 문제")).toBeTruthy();
    expect(animate).not.toHaveBeenCalled();
    expect(preference.addEventListener).not.toHaveBeenCalled();
  });

  it("cancels running motion if the system preference changes", () => {
    const { cancellations, preference } = setup();
    const { rerender } = render(content("first"));
    rerender(content("second"));
    const onChange = preference.addEventListener.mock.calls[0]?.[1] as () => void;
    act(() => {
      preference.matches = true;
      onChange();
    });
    expect(cancellations[0]).toHaveBeenCalledOnce();
  });

  it.each(["animate", "matchMedia"] as const)("still shows content without %s support", (missing) => {
    const { animate } = setup();
    if (missing === "animate") Reflect.deleteProperty(HTMLElement.prototype, "animate");
    else vi.stubGlobal("matchMedia", undefined);

    const { rerender } = render(content("first"));
    rerender(content("second", "다음 문제"));
    expect(screen.getByText("다음 문제")).toBeTruthy();
    expect(animate).not.toHaveBeenCalled();
  });

  it("cleans up active motion and preference listeners on unmount", () => {
    const { cancellations, preference } = setup();
    const { rerender, unmount } = render(content("first"));
    rerender(content("second"));
    const onChange = preference.addEventListener.mock.calls[0]?.[1];
    unmount();
    expect(cancellations[0]).toHaveBeenCalledOnce();
    expect(preference.removeEventListener).toHaveBeenCalledWith("change", onChange);
  });

  it("supports the legacy media query listener API", () => {
    const { cancellations } = setup();
    const preference = { matches: false, addListener: vi.fn(), removeListener: vi.fn() };
    vi.stubGlobal("matchMedia", vi.fn(() => preference));
    const { rerender, unmount } = render(content("first"));
    rerender(content("second"));
    const onChange = preference.addListener.mock.calls[0]?.[0] as () => void;
    act(() => {
      preference.matches = true;
      onChange();
    });
    expect(cancellations[0]).toHaveBeenCalledOnce();
    unmount();
    expect(preference.removeListener).toHaveBeenCalledWith(onChange);
  });
});
