import type { ReactNode } from "react";

export function ReviewOmrSheet({ open, title, onClose, children }: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-30 md:hidden">
      <button type="button" aria-label="OMR 닫기" onClick={onClose} className="app-modal-backdrop absolute inset-0" />
      <section aria-label={title} className="app-modal-surface app-study-sheet absolute bottom-0 left-0 right-0 border-t p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-2xl">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold dark:text-stone-100">{title}</h3>
          <button type="button" onClick={onClose} className="app-button-secondary app-study-control px-3 py-2 text-sm font-medium">
            닫기
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}
