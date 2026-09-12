import { useLayoutEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";

interface DialogProps {
  labelledBy: string;
  describedBy?: string;
  onClose?: () => void;
  closeLabel?: string;
  className?: string;
  surfaceClassName?: string;
  children: ReactNode;
}

const openDialogs: HTMLElement[] = [];
let originalBodyOverflow = "";

function getFocusableElements(surface: HTMLElement) {
  return Array.from(surface.querySelectorAll<HTMLElement>(
    'button, a[href], input, select, textarea, [tabindex], [contenteditable="true"]',
  )).filter((element) => (
    element.tabIndex >= 0
    && !element.matches(":disabled")
    && !element.closest('[hidden], [inert], [aria-hidden="true"]')
    && getComputedStyle(element).display !== "none"
    && getComputedStyle(element).visibility !== "hidden"
  ));
}

/** Mount while open. The caller owns the heading, content, and panel layout. */
export function Dialog({
  labelledBy,
  describedBy,
  onClose,
  closeLabel = "대화상자 바깥 영역 닫기",
  className = "z-[100]",
  surfaceClassName = "max-h-[calc(100dvh-2rem)] max-w-lg overflow-y-auto rounded-2xl border p-5",
  children,
}: DialogProps) {
  const sourceRef = useRef<HTMLSpanElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);

  useLayoutEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useLayoutEffect(() => {
    const surface = surfaceRef.current;
    if (!surface) return;

    // Portals retain the solve screen's static visual behavior.
    layerRef.current?.classList.toggle("app-focus-page", Boolean(sourceRef.current?.closest(".app-focus-page")));
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    if (openDialogs.length === 0) {
      originalBodyOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
    }
    openDialogs.push(surface);
    (getFocusableElements(surface)[0] ?? surface).focus({ preventScroll: true });

    const isTopDialog = () => openDialogs[openDialogs.length - 1] === surface;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isTopDialog()) return;
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopImmediatePropagation();
        onCloseRef.current?.();
        return;
      }
      if (event.key !== "Tab") return;

      const focusable = getFocusableElements(surface);
      const first = focusable[0] ?? surface;
      const last = focusable[focusable.length - 1] ?? surface;
      if (!surface.contains(document.activeElement) || document.activeElement === surface) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    const handleFocusIn = (event: FocusEvent) => {
      if (isTopDialog() && event.target instanceof Node && !surface.contains(event.target)) {
        (getFocusableElements(surface)[0] ?? surface).focus({ preventScroll: true });
      }
    };
    document.addEventListener("keydown", handleKeyDown, true);
    document.addEventListener("focusin", handleFocusIn);

    return () => {
      document.removeEventListener("keydown", handleKeyDown, true);
      document.removeEventListener("focusin", handleFocusIn);
      const wasTop = isTopDialog();
      openDialogs.splice(openDialogs.indexOf(surface), 1);
      const remainingDialog = openDialogs[openDialogs.length - 1];
      if (!remainingDialog) document.body.style.overflow = originalBodyOverflow;
      if (wasTop) {
        if (previousFocus?.isConnected && (!remainingDialog || remainingDialog.contains(previousFocus))) {
          previousFocus.focus({ preventScroll: true });
        } else if (remainingDialog) {
          (getFocusableElements(remainingDialog)[0] ?? remainingDialog).focus({ preventScroll: true });
        }
      }
    };
  }, []);

  return (
    <>
      <span ref={sourceRef} hidden />
      {createPortal(
        <div
          ref={layerRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={labelledBy}
          aria-describedby={describedBy}
          className={`fixed inset-0 flex items-center justify-center p-4 ${className}`}
        >
          <button
            type="button"
            tabIndex={-1}
            onClick={onClose}
            disabled={!onClose}
            className="app-modal-backdrop absolute inset-0"
            aria-label={closeLabel}
          />
          <div
            ref={surfaceRef}
            tabIndex={-1}
            className={`app-modal-surface relative w-full outline-none ${surfaceClassName}`}
          >
            {children}
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
