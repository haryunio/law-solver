// @vitest-environment jsdom

import { useRef } from "react";
import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useQuestionPanelHeightMotion } from "./useQuestionPanelHeightMotion";

const originalAnimate = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "animate");

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  if (originalAnimate) Object.defineProperty(HTMLElement.prototype, "animate", originalAnimate);
  else Reflect.deleteProperty(HTMLElement.prototype, "animate");
});

function Panel({ question = "first", reveal = false }: { question?: string; reveal?: boolean }) {
  const ref = useRef<HTMLElement>(null);
  useQuestionPanelHeightMotion(ref, question, reveal);
  return <div data-testid="workspace">
    <main ref={ref} data-testid="panel">
      <div className="cbt-question-toolbar">문제 도구</div>
      <div className="cbt-question-content"><div data-testid="intrinsic-content">{question}{reveal ? " 해설" : ""}</div></div>
      <div className="cbt-navigation">이전 문제 / 다음 문제</div>
    </main>
  </div>;
}

function setup() {
  vi.stubGlobal("innerWidth", 1024);
  const geometry = { naturalHeight: 520, workspaceWidth: 1000, workspaceHeight: 800 };
  const preference = { matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() };
  vi.stubGlobal("matchMedia", vi.fn(() => preference));
  const viewport = new EventTarget();
  vi.stubGlobal("visualViewport", viewport);

  type MockMotion = { displayedHeight: number; cancel: ReturnType<typeof vi.fn>; finish: () => void; finished: Promise<void> };
  const motions: MockMotion[] = [];
  let current: MockMotion | null = null;
  const animate = vi.fn((frames: Keyframe[], _options: KeyframeAnimationOptions) => {
    let resolve!: () => void;
    let reject!: (reason: Error) => void;
    const finished = new Promise<void>((yes, no) => { resolve = yes; reject = no; });
    const motion: MockMotion = {
      displayedHeight: Number.parseFloat(String(frames[0]?.height)),
      finished,
      cancel: vi.fn(() => {
        if (current === motion) current = null;
        reject(new Error("Animation cancelled"));
      }),
      finish: () => {
        if (current === motion) current = null;
        resolve();
      },
    };
    current = motion;
    motions.push(motion);
    return motion;
  });
  Object.defineProperty(HTMLElement.prototype, "animate", { configurable: true, value: animate });
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (this: HTMLElement) {
    const workspace = this.dataset.testid === "workspace";
    return new DOMRect(0, 0, workspace ? geometry.workspaceWidth : 700, workspace ? geometry.workspaceHeight : current?.displayedHeight ?? geometry.naturalHeight);
  });

  const observers: MockObserver[] = [];
  class MockObserver {
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
    constructor(private callback: ResizeObserverCallback) { observers.push(this); }
    notify() { this.callback([], this); }
  }
  vi.stubGlobal("ResizeObserver", MockObserver);
  return { geometry, preference, viewport, animate, motions, observers };
}

describe("useQuestionPanelHeightMotion", () => {
  it("keeps first render, unchanged content and subpixel changes immediate", () => {
    const { animate, geometry, observers } = setup();
    const { rerender } = render(<Panel />);
    expect(animate).not.toHaveBeenCalled();
    rerender(<Panel reveal />);
    expect(screen.getByText("first 해설")).toBeTruthy();
    geometry.naturalHeight = 520.5;
    act(() => observers[0]!.notify());
    expect(animate).not.toHaveBeenCalled();
  });

  it("smooths both expansion and contraction without holding a permanent inline height", async () => {
    const { animate, geometry, motions } = setup();
    const { rerender } = render(<Panel />);
    geometry.naturalHeight = 720;
    rerender(<Panel question="second" />);
    expect(screen.getByText("second")).toBeTruthy();
    expect(animate).toHaveBeenLastCalledWith([{ height: "520px" }, { height: "720px" }], {
      duration: 140, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)",
    });
    expect(screen.getByTestId("panel").style.height).toBe("");
    await act(async () => motions[0]!.finish());
    expect(animate).toHaveBeenCalledOnce();

    geometry.naturalHeight = 600;
    rerender(<Panel question="second" reveal />);
    expect(animate.mock.calls[1]?.[0]).toEqual([{ height: "720px" }, { height: "600px" }]);
    await act(async () => motions[1]!.finish());
    expect(screen.getByTestId("panel").style.height).toBe("");
  });

  it("retargets rapid question changes from the currently visible height", () => {
    const { animate, geometry, motions } = setup();
    const { rerender } = render(<Panel />);
    geometry.naturalHeight = 720;
    rerender(<Panel question="second" />);
    motions[0]!.displayedHeight = 587;
    geometry.naturalHeight = 420;
    rerender(<Panel question="third" />);
    expect(screen.getByText("third")).toBeTruthy();
    expect(motions[0]!.cancel).toHaveBeenCalledOnce();
    expect(animate.mock.calls[1]?.[0]).toEqual([{ height: "587px" }, { height: "420px" }]);
    expect(motions[1]!.cancel).not.toHaveBeenCalled();
  });

  it("observes natural content instead of animated panel height and avoids per-frame restarts", async () => {
    const { animate, geometry, motions, observers } = setup();
    render(<Panel />);
    const panel = screen.getByTestId("panel");
    const observed = observers[0]!.observe.mock.calls.map(([element]) => element);
    expect(observed).toEqual([
      screen.getByTestId("workspace"),
      panel.querySelector(".cbt-question-toolbar"),
      screen.getByTestId("intrinsic-content"),
      panel.querySelector(".cbt-navigation"),
    ]);
    expect(observed).not.toContain(panel);
    expect(observed).not.toContain(panel.querySelector(".cbt-question-content"));

    geometry.naturalHeight = 650;
    act(() => observers[0]!.notify());
    expect(animate).toHaveBeenCalledOnce();
    act(() => {
      observers[0]!.notify();
      observers[0]!.notify();
      observers[0]!.notify();
    });
    expect(animate).toHaveBeenCalledOnce();
    expect(motions[0]!.cancel).not.toHaveBeenCalled();
    await act(async () => motions[0]!.finish());
    expect(animate).toHaveBeenCalledOnce();
  });

  it("picks up intrinsic content changes that arrive while the panel is moving", async () => {
    const { animate, geometry, motions, observers } = setup();
    const { rerender } = render(<Panel />);
    geometry.naturalHeight = 650;
    rerender(<Panel question="second" />);
    geometry.naturalHeight = 700;
    act(() => observers[0]!.notify());
    expect(animate).toHaveBeenCalledOnce();
    await act(async () => motions[0]!.finish());
    expect(animate.mock.calls[1]?.[0]).toEqual([{ height: "650px" }, { height: "700px" }]);
    await act(async () => motions[1]!.finish());
    expect(animate).toHaveBeenCalledTimes(2);
  });

  it.each(["mobile", "reduced motion", "missing animate", "missing matchMedia"])("uses immediate natural layout with %s", (mode) => {
    const { animate, geometry, preference } = setup();
    if (mode === "mobile") vi.stubGlobal("innerWidth", 767);
    if (mode === "reduced motion") preference.matches = true;
    if (mode === "missing animate") Reflect.deleteProperty(HTMLElement.prototype, "animate");
    if (mode === "missing matchMedia") vi.stubGlobal("matchMedia", undefined);
    const { rerender } = render(<Panel />);
    geometry.naturalHeight = 700;
    rerender(<Panel question="second" reveal />);
    expect(screen.getByText("second 해설")).toBeTruthy();
    expect(screen.getByTestId("panel").getBoundingClientRect().height).toBe(700);
    expect(animate).not.toHaveBeenCalled();
  });

  it.each(["window resize", "viewport resize", "viewport scroll"])("cancels immediately for %s and uses the new viewport baseline", (event) => {
    const { animate, geometry, motions, viewport } = setup();
    const { rerender } = render(<Panel />);
    geometry.naturalHeight = 720;
    rerender(<Panel question="second" />);
    motions[0]!.displayedHeight = 590;
    geometry.naturalHeight = 480;
    act(() => {
      if (event === "window resize") window.dispatchEvent(new Event("resize"));
      else viewport.dispatchEvent(new Event(event === "viewport resize" ? "resize" : "scroll"));
    });
    expect(motions[0]!.cancel).toHaveBeenCalledOnce();
    expect(screen.getByTestId("panel").getBoundingClientRect().height).toBe(480);
    expect(animate).toHaveBeenCalledOnce();
    geometry.naturalHeight = 460;
    rerender(<Panel question="third" />);
    expect(animate.mock.calls[1]?.[0]).toEqual([{ height: "480px" }, { height: "460px" }]);
  });

  it("fits workspace changes immediately instead of treating them as content motion", () => {
    const { animate, geometry, motions, observers } = setup();
    const { rerender } = render(<Panel />);
    geometry.naturalHeight = 720;
    rerender(<Panel question="second" />);
    geometry.workspaceWidth = 800;
    geometry.workspaceHeight = 480;
    geometry.naturalHeight = 480;
    act(() => observers[0]!.notify());
    expect(motions[0]!.cancel).toHaveBeenCalledOnce();
    expect(animate).toHaveBeenCalledOnce();
    geometry.naturalHeight = 450;
    rerender(<Panel question="third" />);
    expect(animate.mock.calls[1]?.[0]).toEqual([{ height: "480px" }, { height: "450px" }]);
  });

  it("stops active motion when reduced motion is enabled", () => {
    const { animate, geometry, motions, preference } = setup();
    const { rerender } = render(<Panel />);
    geometry.naturalHeight = 720;
    rerender(<Panel question="second" />);
    const onChange = preference.addEventListener.mock.calls[0]?.[1] as () => void;
    act(() => { preference.matches = true; onChange(); });
    expect(motions[0]!.cancel).toHaveBeenCalledOnce();
    geometry.naturalHeight = 600;
    rerender(<Panel question="third" />);
    expect(animate).toHaveBeenCalledOnce();
    expect(screen.getByTestId("panel").getBoundingClientRect().height).toBe(600);
  });

  it("removes viewport observers, listeners and active animation on unmount", async () => {
    const { animate, geometry, motions, observers, viewport, preference } = setup();
    const added = vi.spyOn(viewport, "addEventListener");
    const removed = vi.spyOn(viewport, "removeEventListener");
    const windowAdded = vi.spyOn(window, "addEventListener");
    const windowRemoved = vi.spyOn(window, "removeEventListener");
    const { rerender, unmount } = render(<Panel />);
    geometry.naturalHeight = 720;
    rerender(<Panel question="second" />);
    unmount();
    expect(motions[0]!.cancel).toHaveBeenCalledOnce();
    expect(observers[0]!.disconnect).toHaveBeenCalledOnce();
    for (const [event, listener] of added.mock.calls) expect(removed).toHaveBeenCalledWith(event, listener);
    const resizeListener = windowAdded.mock.calls.find(([event]) => event === "resize")?.[1];
    expect(windowRemoved).toHaveBeenCalledWith("resize", resizeListener);
    expect(preference.removeEventListener).toHaveBeenCalledWith("change", preference.addEventListener.mock.calls[0]?.[1]);
    await act(async () => motions[0]!.finish());
    expect(animate).toHaveBeenCalledOnce();
  });
});
