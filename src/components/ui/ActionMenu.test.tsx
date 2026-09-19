// @vitest-environment jsdom

import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ActionMenu } from "./ActionMenu";

afterEach(cleanup);

function renderMenu() {
  const rename = vi.fn();
  const remove = vi.fn();
  render(
    <>
      <ActionMenu label="풀이 세션 관리" items={[
        { id: "rename", label: "이름 수정", onSelect: rename },
        { id: "remove", label: "삭제", onSelect: remove, danger: true },
      ]} />
      <button type="button">다음 작업</button>
    </>,
  );
  return { trigger: screen.getByRole("button", { name: "풀이 세션 관리" }), rename, remove };
}

describe("ActionMenu", () => {
  it("opens from either arrow key, navigates menu items and restores focus on Escape", () => {
    const { trigger, rename, remove } = renderMenu();
    trigger.focus();
    fireEvent.keyDown(trigger, { key: "ArrowUp" });
    const first = screen.getByRole("menuitem", { name: "이름 수정" });
    const last = screen.getByRole("menuitem", { name: "삭제" });
    expect(document.activeElement).toBe(last);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");

    fireEvent.keyDown(last, { key: "ArrowDown" });
    expect(document.activeElement).toBe(first);
    fireEvent.keyDown(first, { key: "ArrowUp" });
    expect(document.activeElement).toBe(last);
    fireEvent.keyDown(last, { key: "Home" });
    expect(document.activeElement).toBe(first);
    fireEvent.keyDown(first, { key: "End" });
    expect(document.activeElement).toBe(last);

    fireEvent.keyDown(last, { key: "Escape" });
    expect(screen.queryByRole("menu")).toBeNull();
    expect(document.activeElement).toBe(trigger);
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(rename).not.toHaveBeenCalled();
    expect(remove).not.toHaveBeenCalled();

    fireEvent.keyDown(trigger, { key: "ArrowDown" });
    expect(document.activeElement).toBe(screen.getByRole("menuitem", { name: "이름 수정" }));
  });

  it("accepts native button activation with Enter or Space and selects an action once", () => {
    const { trigger, rename, remove } = renderMenu();

    for (const key of ["Enter", " "]) {
      trigger.focus();
      // jsdom does not synthesize the native button click from keyboard events.
      // Ensure the menu leaves that browser action available, then dispatch it.
      expect(fireEvent.keyDown(trigger, { key })).toBe(true);
      fireEvent.keyUp(trigger, { key });
      fireEvent.click(trigger, { detail: 0 });
      const item = screen.getByRole("menuitem", { name: "이름 수정" });
      expect(document.activeElement).toBe(item);
      expect(fireEvent.keyDown(item, { key })).toBe(true);
      fireEvent.keyUp(item, { key });
      fireEvent.click(item, { detail: 0 });
      expect(screen.queryByRole("menu")).toBeNull();
      expect(document.activeElement).toBe(trigger);
    }

    expect(rename).toHaveBeenCalledTimes(2);
    expect(remove).not.toHaveBeenCalled();
  });

  it("dismisses on an outside pointer or focus move without running an action", () => {
    const { trigger, rename, remove } = renderMenu();
    const outside = screen.getByRole("button", { name: "다음 작업" });
    fireEvent.click(trigger);
    fireEvent.pointerDown(screen.getByRole("menuitem", { name: "삭제" }));
    expect(screen.queryByRole("menu")).not.toBeNull();

    fireEvent.pointerDown(outside);
    expect(screen.queryByRole("menu")).toBeNull();
    fireEvent.click(trigger);
    act(() => outside.focus());
    expect(screen.queryByRole("menu")).toBeNull();
    expect(document.activeElement).toBe(outside);
    expect(rename).not.toHaveBeenCalled();
    expect(remove).not.toHaveBeenCalled();
  });
});
