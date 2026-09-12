import type { ReactNode } from "react";
import { Button } from "./Button";
import { Dialog } from "./Dialog";
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
  return (
    <Dialog
      labelledBy={titleId}
      onClose={onClose}
      closeLabel={`${closeLabel} 바깥 영역 닫기`}
      surfaceClassName="flex max-h-[calc(100dvh-2rem)] max-w-4xl flex-col overflow-hidden rounded-2xl border"
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
        <Button
          onClick={onClose}
          className="px-5"
        >
          닫기
        </Button>
      </footer>
    </Dialog>
  );
}
