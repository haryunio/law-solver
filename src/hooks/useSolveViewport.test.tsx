// @vitest-environment jsdom
import { useRef } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useSolveViewport } from "./useSolveViewport";

function SolveSurface({ enabled = true }: { enabled?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useSolveViewport(ref, enabled);
  return <div ref={ref} data-testid="solve-surface" />;
}

function createViewport() {
  return Object.assign(new EventTarget(), {
    height: 780,
    offsetTop: 0,
    scale: 1,
  });
}

beforeEach(() => {
  vi.stubGlobal("innerWidth", 390);
  vi.stubGlobal("innerHeight", 844);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("useSolveViewport", () => {
  it("follows keyboard height and visible viewport offset without a React render", () => {
    const viewport = createViewport();
    vi.stubGlobal("visualViewport", viewport);
    render(<SolveSurface />);
    const surface = screen.getByTestId("solve-surface");
    expect(surface.style.getPropertyValue("--cbt-viewport-height")).toBe("780px");
    expect(surface.style.getPropertyValue("--cbt-viewport-top")).toBe("0px");

    viewport.height = 410;
    viewport.dispatchEvent(new Event("resize"));
    expect(surface.style.getPropertyValue("--cbt-viewport-height")).toBe("410px");

    viewport.offsetTop = 48;
    viewport.dispatchEvent(new Event("scroll"));
    expect(surface.style.getPropertyValue("--cbt-viewport-top")).toBe("48px");

    viewport.height = 780;
    viewport.offsetTop = 0;
    viewport.dispatchEvent(new Event("resize"));
    expect(surface.style.getPropertyValue("--cbt-viewport-height")).toBe("780px");
    expect(surface.style.getPropertyValue("--cbt-viewport-top")).toBe("0px");
  });

  it("keeps the last dimensions while the user pinches, then resumes after zoom resets", () => {
    const viewport = createViewport();
    vi.stubGlobal("visualViewport", viewport);
    render(<SolveSurface />);
    const surface = screen.getByTestId("solve-surface");

    viewport.scale = 2;
    viewport.height = 390;
    viewport.offsetTop = 90;
    viewport.dispatchEvent(new Event("resize"));
    viewport.dispatchEvent(new Event("scroll"));
    fireEvent.resize(window);
    expect(surface.style.getPropertyValue("--cbt-viewport-height")).toBe("780px");
    expect(surface.style.getPropertyValue("--cbt-viewport-top")).toBe("0px");

    viewport.scale = 1;
    viewport.height = 720;
    viewport.offsetTop = 12;
    viewport.dispatchEvent(new Event("resize"));
    expect(surface.style.getPropertyValue("--cbt-viewport-height")).toBe("720px");
    expect(surface.style.getPropertyValue("--cbt-viewport-top")).toBe("12px");
  });

  it("follows the visible height through tablet browser chrome, rotation, split view, and desktop changes", () => {
    const viewport = createViewport();
    vi.stubGlobal("innerWidth", 820);
    vi.stubGlobal("innerHeight", 1180);
    viewport.height = 1080;
    vi.stubGlobal("visualViewport", viewport);
    render(<SolveSurface />);
    const surface = screen.getByTestId("solve-surface");
    expect(surface.style.getPropertyValue("--cbt-viewport-height")).toBe("1080px");

    // Safari's browser bars can change the visible height without a layout resize.
    viewport.height = 1120;
    viewport.dispatchEvent(new Event("resize"));
    expect(surface.style.getPropertyValue("--cbt-viewport-height")).toBe("1120px");
    viewport.height = 1040;
    viewport.dispatchEvent(new Event("resize"));
    expect(surface.style.getPropertyValue("--cbt-viewport-height")).toBe("1040px");

    vi.stubGlobal("innerWidth", 1024);
    vi.stubGlobal("innerHeight", 768);
    viewport.height = 680;
    fireEvent.resize(window);
    expect(surface.style.getPropertyValue("--cbt-viewport-height")).toBe("680px");
    expect(surface.style.getPropertyValue("--cbt-viewport-top")).toBe("0px");

    vi.stubGlobal("innerWidth", 390);
    vi.stubGlobal("innerHeight", 1180);
    viewport.height = 1080;
    fireEvent.resize(window);
    expect(surface.style.getPropertyValue("--cbt-viewport-height")).toBe("1080px");

    vi.stubGlobal("innerWidth", 1440);
    vi.stubGlobal("innerHeight", 900);
    viewport.height = 900;
    fireEvent.resize(window);
    expect(surface.style.getPropertyValue("--cbt-viewport-height")).toBe("900px");
    expect(surface.style.getPropertyValue("--cbt-viewport-top")).toBe("0px");
    expect(document.documentElement.classList.contains("cbt-viewport")).toBe(true);
  });

  it("falls back to the window height without VisualViewport", () => {
    vi.stubGlobal("visualViewport", undefined);
    render(<SolveSurface />);
    const surface = screen.getByTestId("solve-surface");
    expect(surface.style.getPropertyValue("--cbt-viewport-height")).toBe("844px");
    expect(surface.style.getPropertyValue("--cbt-viewport-top")).toBe("0px");

    vi.stubGlobal("innerHeight", 600);
    fireEvent.resize(window);
    expect(surface.style.getPropertyValue("--cbt-viewport-height")).toBe("600px");
  });

  it("removes the class, listeners, and dimensions on unmount without changing body styles", () => {
    const viewport = createViewport();
    vi.stubGlobal("visualViewport", viewport);
    const viewportAdded = vi.spyOn(viewport, "addEventListener");
    const viewportRemoved = vi.spyOn(viewport, "removeEventListener");
    const windowAdded = vi.spyOn(window, "addEventListener");
    const windowRemoved = vi.spyOn(window, "removeEventListener");
    const bodyStyles = document.body.style.cssText;
    const { unmount } = render(<SolveSurface />);
    const surface = screen.getByTestId("solve-surface");
    expect(document.documentElement.classList.contains("cbt-viewport")).toBe(true);

    unmount();
    expect(document.documentElement.classList.contains("cbt-viewport")).toBe(false);
    expect(surface.style.getPropertyValue("--cbt-viewport-height")).toBe("");
    expect(surface.style.getPropertyValue("--cbt-viewport-top")).toBe("");
    expect(document.body.style.cssText).toBe(bodyStyles);
    for (const [event, listener] of viewportAdded.mock.calls) {
      expect(viewportRemoved).toHaveBeenCalledWith(event, listener);
    }
    const resizeListener = windowAdded.mock.calls.find(([event]) => event === "resize")?.[1];
    expect(resizeListener).toBeDefined();
    expect(windowRemoved).toHaveBeenCalledWith("resize", resizeListener);
    viewport.dispatchEvent(new Event("resize"));
    expect(surface.style.getPropertyValue("--cbt-viewport-height")).toBe("");
  });

  it("does not activate when disabled and cleans up when disabled after activation", () => {
    vi.stubGlobal("visualViewport", createViewport());
    const { rerender } = render(<SolveSurface enabled={false} />);
    const surface = screen.getByTestId("solve-surface");
    expect(document.documentElement.classList.contains("cbt-viewport")).toBe(false);
    expect(surface.style.getPropertyValue("--cbt-viewport-height")).toBe("");

    rerender(<SolveSurface enabled />);
    expect(document.documentElement.classList.contains("cbt-viewport")).toBe(true);
    rerender(<SolveSurface enabled={false} />);
    expect(document.documentElement.classList.contains("cbt-viewport")).toBe(false);
    expect(surface.style.getPropertyValue("--cbt-viewport-height")).toBe("");
  });
});
