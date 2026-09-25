import { useId, useLayoutEffect, useRef, useState, type ReactNode } from "react";

/** Keep the closing sheet visible briefly without blocking the next question. */
export function MobileOmrSheet({ open, onClose, children, layerClassName = "cbt-omr-layer fixed inset-0 z-30 md:hidden" }: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  layerClassName?: string;
}) {
  const titleId = useId();
  const [present, setPresent] = useState(open);
  const layerRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLButtonElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  if (open && !present) setPresent(true);

  useLayoutEffect(() => {
    const layer = layerRef.current;
    const backdrop = backdropRef.current;
    const sheet = sheetRef.current;
    if (!present || !layer || !backdrop || !sheet) return;
    layer.inert = !open;

    const preference = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (!preference || preference.matches || !sheet.animate || !backdrop.animate) {
      if (!open) setPresent(false);
      return;
    }

    let active = true;
    const timing = { duration: open ? 160 : 120, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)", fill: "forwards" as const };
    const sheetMotion = sheet.animate(open ? [
      { opacity: 0.96, transform: "translateY(12px)" },
      { opacity: 1, transform: "none" },
    ] : [
      { opacity: 1, transform: "none" },
      { opacity: 0, transform: "translateY(8px)" },
    ], timing);
    const backdropMotion = backdrop.animate([{ opacity: open ? 0 : 1 }, { opacity: open ? 1 : 0 }], timing);
    const finish = () => { if (active && !open) setPresent(false); };
    void sheetMotion.finished.then(finish, () => {});
    const stop = () => {
      if (!preference.matches) return;
      sheetMotion.cancel();
      backdropMotion.cancel();
      finish();
    };
    if (preference.addEventListener) preference.addEventListener("change", stop);
    else preference.addListener?.(stop);
    return () => {
      active = false;
      sheetMotion.cancel();
      backdropMotion.cancel();
      if (preference.removeEventListener) preference.removeEventListener("change", stop);
      else preference.removeListener?.(stop);
    };
  }, [open, present]);

  if (!present) return null;
  return (
    <div ref={layerRef} aria-hidden={!open || undefined} className={`${layerClassName}${open ? "" : " pointer-events-none"}`}>
      <button ref={backdropRef} type="button" tabIndex={-1} onClick={onClose} className="app-modal-backdrop absolute inset-0" aria-label="OMR 닫기" />
      <div ref={sheetRef} role="region" aria-labelledby={titleId} className="cbt-omr-sheet app-modal-surface absolute bottom-0 left-0 right-0 rounded-t-2xl border-t p-4 shadow-2xl">
        <div className="mb-3 flex shrink-0 items-center justify-between">
          <h3 id={titleId} className="text-sm font-semibold dark:text-stone-100">OMR 빠른 이동</h3>
          <button type="button" onClick={onClose} className="text-sm text-stone-500 dark:text-stone-400">닫기</button>
        </div>
        {children}
      </div>
    </div>
  );
}
