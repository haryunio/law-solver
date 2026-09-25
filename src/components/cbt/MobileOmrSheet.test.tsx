// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MobileOmrSheet } from "./MobileOmrSheet";

const originalAnimate = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "animate");

afterEach(() => {
  cleanup();
  if (originalAnimate) Object.defineProperty(HTMLElement.prototype, "animate", originalAnimate);
  else Reflect.deleteProperty(HTMLElement.prototype, "animate");
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function setup(reduced = false) {
  const preference = Object.assign(new EventTarget(), { matches: reduced });
  const motions: Array<{
    element: HTMLElement;
    frames: Keyframe[];
    options: KeyframeAnimationOptions;
    finish: () => void;
    cancel: ReturnType<typeof vi.fn>;
  }> = [];
  const animate = vi.fn(function (this: HTMLElement, frames: Keyframe[], options: KeyframeAnimationOptions) {
    let finish!: () => void;
    const finished = new Promise<void>((resolve) => { finish = resolve; });
    // Keep completion independently controllable to reproduce a queued finish
    // arriving after cancellation or a rapid reopen.
    const cancel = vi.fn();
    motions.push({ element: this, frames, options, finish, cancel });
    return { finished, cancel };
  });
  vi.stubGlobal("matchMedia", vi.fn(() => preference));
  Object.defineProperty(HTMLElement.prototype, "animate", { configurable: true, value: animate });
  return { animate, motions, preference };
}

function sheet(open: boolean, onClose = vi.fn()) {
  return <MobileOmrSheet open={open} onClose={onClose}><button type="button">1번 문제로 이동</button></MobileOmrSheet>;
}

describe("MobileOmrSheet", () => {
  it("stays absent while closed and opens immediately with a short sheet and backdrop animation", () => {
    const { animate, motions } = setup();
    const onClose = vi.fn();
    const { rerender, container } = render(sheet(false, onClose));
    expect(container.firstChild).toBeNull();
    expect(animate).not.toHaveBeenCalled();

    rerender(sheet(true, onClose));
    expect(screen.getByRole("region", { name: "OMR 빠른 이동" })).toBeTruthy();
    const layer = container.querySelector<HTMLDivElement>(".cbt-omr-layer")!;
    expect(layer.inert).toBe(false);
    expect(layer.hasAttribute("aria-hidden")).toBe(false);
    expect(motions).toHaveLength(2);
    expect(motions.every(({ options }) => options.duration === 160)).toBe(true);
    expect(motions[0]?.frames).toEqual([
      { opacity: 0.96, transform: "translateY(12px)" },
      { opacity: 1, transform: "none" },
    ]);
    fireEvent.click(screen.getByRole("button", { name: "닫기" }));
    fireEvent.click(screen.getByRole("button", { name: "OMR 닫기" }));
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it("stops blocking input immediately on close and unmounts only when the sheet exit finishes", async () => {
    const { motions } = setup();
    const { rerender, container } = render(sheet(true));
    rerender(sheet(false));
    const layer = container.querySelector<HTMLDivElement>(".cbt-omr-layer")!;
    expect(layer).toBeTruthy();
    expect(layer.classList.contains("pointer-events-none")).toBe(true);
    expect(layer.inert).toBe(true);
    expect(layer.getAttribute("aria-hidden")).toBe("true");
    expect(screen.queryByRole("region", { name: "OMR 빠른 이동" })).toBeNull();
    expect(motions.slice(0, 2).every(({ cancel }) => cancel.mock.calls.length === 1)).toBe(true);
    const closing = motions.slice(2);
    expect(closing).toHaveLength(2);
    expect(closing.every(({ options }) => options.duration === 120)).toBe(true);

    await act(async () => { closing.find(({ element }) => element.tagName === "BUTTON")!.finish(); });
    expect(container.querySelector(".cbt-omr-layer")).toBe(layer);
    await act(async () => { closing.find(({ element }) => element.classList.contains("cbt-omr-sheet"))!.finish(); });
    expect(container.firstChild).toBeNull();
  });

  it("ignores an old exit completion when the sheet is reopened before it finishes", async () => {
    const { motions } = setup();
    const { rerender, container } = render(sheet(true));
    rerender(sheet(false));
    const closing = motions.slice(2);
    rerender(sheet(true));
    const layer = container.querySelector<HTMLDivElement>(".cbt-omr-layer")!;
    expect(layer.inert).toBe(false);
    expect(layer.classList.contains("pointer-events-none")).toBe(false);
    expect(layer.hasAttribute("aria-hidden")).toBe(false);
    expect(closing.every(({ cancel }) => cancel.mock.calls.length === 1)).toBe(true);

    await act(async () => { closing.forEach(({ finish }) => finish()); });
    expect(screen.getByRole("region", { name: "OMR 빠른 이동" })).toBeTruthy();
    expect(container.querySelector(".cbt-omr-layer")).toBe(layer);
  });

  it("opens and closes immediately when reduced motion is already enabled", () => {
    const { animate } = setup(true);
    const { rerender, container } = render(sheet(true));
    expect(screen.getByRole("region", { name: "OMR 빠른 이동" })).toBeTruthy();
    rerender(sheet(false));
    expect(container.firstChild).toBeNull();
    expect(animate).not.toHaveBeenCalled();
  });

  it("cancels an entry in progress when reduced motion is enabled while keeping the sheet usable", () => {
    const { motions, preference } = setup();
    render(sheet(true));
    act(() => {
      preference.matches = true;
      preference.dispatchEvent(new Event("change"));
    });
    expect(motions.every(({ cancel }) => cancel.mock.calls.length === 1)).toBe(true);
    expect(screen.getByRole("button", { name: "1번 문제로 이동" })).toBeTruthy();
  });

  it("finishes an exit immediately when reduced motion is enabled during closing", async () => {
    const { motions, preference } = setup();
    const { rerender, container } = render(sheet(true));
    rerender(sheet(false));
    const closing = motions.slice(2);
    act(() => {
      preference.matches = true;
      preference.dispatchEvent(new Event("change"));
    });
    expect(container.firstChild).toBeNull();
    expect(closing.every(({ cancel }) => cancel.mock.calls.length > 0)).toBe(true);
    await act(async () => { closing.forEach(({ finish }) => finish()); });
    expect(container.firstChild).toBeNull();
  });

  it.each(["animate", "matchMedia"] as const)("uses immediate open and close without %s support", (missing) => {
    const { animate } = setup();
    if (missing === "animate") Reflect.deleteProperty(HTMLElement.prototype, "animate");
    else vi.stubGlobal("matchMedia", undefined);
    const { rerender, container } = render(sheet(true));
    expect(screen.getByRole("region", { name: "OMR 빠른 이동" })).toBeTruthy();
    rerender(sheet(false));
    expect(container.firstChild).toBeNull();
    expect(animate).not.toHaveBeenCalled();
  });

  it("cancels active animations and removes the preference listener on unmount", async () => {
    const { motions, preference } = setup();
    const added = vi.spyOn(preference, "addEventListener");
    const removed = vi.spyOn(preference, "removeEventListener");
    const { unmount, container } = render(sheet(true));
    unmount();
    expect(motions.every(({ cancel }) => cancel.mock.calls.length === 1)).toBe(true);
    expect(added).toHaveBeenCalledOnce();
    expect(removed).toHaveBeenCalledWith("change", added.mock.calls[0]?.[1]);
    await act(async () => { motions.forEach(({ finish }) => finish()); });
    expect(container.firstChild).toBeNull();
  });
});
