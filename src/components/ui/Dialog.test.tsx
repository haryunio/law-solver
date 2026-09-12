// @vitest-environment jsdom

import { StrictMode, useState } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Dialog } from "./Dialog";

afterEach(() => {
  cleanup();
  document.body.style.overflow = "";
});

function DialogExample() {
  const [open, setOpen] = useState(false);
  return (
    <div className="app-focus-page">
      <button onClick={() => setOpen(true)}>안내 열기</button>
      {open ? (
        <Dialog labelledBy="example-title" onClose={() => setOpen(false)}>
          <h2 id="example-title">안내</h2>
          <button>처음</button>
          <button onClick={() => setOpen(false)}>닫기</button>
        </Dialog>
      ) : null}
    </div>
  );
}

describe("Dialog", () => {
  it("keeps focus inside the portal and restores focus and scrolling after Escape", () => {
    document.body.style.overflow = "auto";
    render(<StrictMode><DialogExample /></StrictMode>);
    const trigger = screen.getByRole("button", { name: "안내 열기" });
    trigger.focus();
    fireEvent.click(trigger);

    const dialog = screen.getByRole("dialog", { name: "안내" });
    const first = screen.getByRole("button", { name: "처음" });
    const last = screen.getByRole("button", { name: "닫기" });
    expect(dialog.parentElement).toBe(document.body);
    expect(dialog.classList.contains("app-focus-page")).toBe(true);
    expect(document.body.style.overflow).toBe("hidden");
    expect(document.activeElement).toBe(first);

    fireEvent.keyDown(first, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(last);
    fireEvent.keyDown(last, { key: "Tab" });
    expect(document.activeElement).toBe(first);
    trigger.focus();
    expect(document.activeElement).toBe(first);

    fireEvent.keyDown(first, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(trigger);
    expect(document.body.style.overflow).toBe("auto");
  });

  it("closes only the top dialog and keeps the parent scroll lock and focus", () => {
    function NestedDialogs() {
      const [innerOpen, setInnerOpen] = useState(false);
      return (
        <Dialog labelledBy="outer-title" onClose={outerClose}>
          <h2 id="outer-title">바깥 안내</h2>
          <button onClick={() => setInnerOpen(true)}>추가 안내</button>
          {innerOpen ? (
            <Dialog labelledBy="inner-title" onClose={() => setInnerOpen(false)}>
              <h2 id="inner-title">안쪽 안내</h2>
              <button>안쪽 버튼</button>
            </Dialog>
          ) : null}
        </Dialog>
      );
    }
    const outerClose = vi.fn();
    render(<NestedDialogs />);
    const trigger = screen.getByRole("button", { name: "추가 안내" });
    fireEvent.click(trigger);
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "안쪽 버튼" }));

    fireEvent.keyDown(document.activeElement!, { key: "Escape" });
    expect(screen.queryByRole("dialog", { name: "안쪽 안내" })).toBeNull();
    expect(outerClose).not.toHaveBeenCalled();
    expect(document.body.style.overflow).toBe("hidden");
    expect(document.activeElement).toBe(trigger);

    fireEvent.keyDown(trigger, { key: "Escape" });
    expect(outerClose).toHaveBeenCalledOnce();
  });

  it("blocks Escape and backdrop dismissal while the operation cannot close", () => {
    const close = vi.fn();
    const view = render(
      <Dialog labelledBy="pending-title" onClose={close}>
        <h2 id="pending-title">저장</h2>
      </Dialog>,
    );
    view.rerender(
      <Dialog labelledBy="pending-title">
        <h2 id="pending-title">저장</h2>
      </Dialog>,
    );
    fireEvent.keyDown(document.activeElement!, { key: "Escape" });
    fireEvent.click(screen.getByRole("button", { name: "대화상자 바깥 영역 닫기" }));
    expect(close).not.toHaveBeenCalled();
    expect(document.body.style.overflow).toBe("hidden");
  });

  it("keeps focus in the current dialog if an older dialog unmounts first", () => {
    const view = render(
      <>
        <Dialog labelledBy="first-title"><h2 id="first-title">첫 안내</h2></Dialog>
        <Dialog labelledBy="last-title"><h2 id="last-title">마지막 안내</h2><button>현재 버튼</button></Dialog>
      </>,
    );
    const button = screen.getByRole("button", { name: "현재 버튼" });
    view.rerender(
      <>
        {null}
        <Dialog labelledBy="last-title"><h2 id="last-title">마지막 안내</h2><button>현재 버튼</button></Dialog>
      </>,
    );
    expect(document.activeElement).toBe(button);
    expect(document.body.style.overflow).toBe("hidden");
    view.unmount();
    expect(document.body.style.overflow).toBe("");
  });
});
