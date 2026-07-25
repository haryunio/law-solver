import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { IconCloseButton } from "./IconCloseButton";

interface LegalDocumentModalProps {
  eyebrow: string;
  title: string;
  titleId: string;
  effectiveDate: string;
  closeLabel: string;
  onClose: () => void;
  children: ReactNode;
}

export function LegalDocumentModal({
  eyebrow,
  title,
  titleId,
  effectiveDate,
  closeLabel,
  onClose,
  children,
}: LegalDocumentModalProps) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  return createPortal(
    <div
      className="fixed inset-0 z-[100]"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <button
        type="button"
        onClick={onClose}
        className="app-modal-backdrop absolute inset-0"
        aria-label={`${closeLabel} 바깥 영역 닫기`}
      />
      <div className="absolute left-1/2 top-1/2 w-[calc(100%_-_2rem)] max-w-4xl -translate-x-1/2 -translate-y-1/2">
        <section
          className="app-modal-surface flex max-h-[calc(100vh-2rem)] flex-col overflow-hidden rounded-2xl border shadow-2xl"
          style={{ maxHeight: "calc(100dvh - 2rem)" }}
        >
          <header className="flex shrink-0 items-start justify-between gap-4 border-b border-stone-200 px-5 py-4 dark:border-stone-800 sm:px-7 sm:py-5">
            <div className="min-w-0">
              <p className="text-xs font-bold tracking-[0.16em] text-red-600 dark:text-red-400">
                {eyebrow}
              </p>
              <h2
                id={titleId}
                className="mt-2 text-xl font-bold text-stone-950 dark:text-stone-100 sm:text-2xl"
              >
                {title}
              </h2>
              <p className="mt-2 text-xs text-stone-500 dark:text-stone-400">
                시행일: {effectiveDate}
              </p>
            </div>
            <IconCloseButton onClick={onClose} label={`${closeLabel} 닫기`} />
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-7 sm:py-6">
            {children}
          </div>

          <footer className="flex shrink-0 justify-end border-t border-stone-200 px-5 py-3 dark:border-stone-800 sm:px-7">
            <button
              type="button"
              onClick={onClose}
              className="app-button-secondary rounded-lg px-5 py-2.5 text-sm font-semibold"
            >
              닫기
            </button>
          </footer>
        </section>
      </div>
    </div>,
    document.body,
  );
}
