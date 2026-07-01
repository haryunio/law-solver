import { IconCloseButton } from "./IconCloseButton";

type ConfirmVariant = "default" | "danger" | "success";

interface ConfirmDialogProps {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmVariant;
  onConfirm: () => void;
  onCancel?: () => void;
}

const variantClass = {
  default: "bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700",
  danger: "bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700",
  success: "bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700",
} as const;

export function ConfirmDialog({
  title,
  description,
  confirmLabel = "확인",
  cancelLabel = "취소",
  variant = "default",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const hasCancel = Boolean(onCancel);

  return (
    <div className="fixed inset-0 z-[60]">
      <button
        onClick={onCancel ?? onConfirm}
        className="absolute inset-0 bg-black/35 dark:bg-black/60"
        aria-label="대화상자 닫기"
      />
      <div className="absolute left-1/2 top-1/2 w-[92vw] max-w-[28rem] -translate-x-1/2 -translate-y-1/2">
        <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-2xl dark:border-stone-800 dark:bg-stone-900">
          <div className="flex items-start justify-between gap-4">
            <h2 className="min-w-0 flex-1 text-base font-semibold text-stone-900 dark:text-stone-100">
              {title}
            </h2>
            <IconCloseButton onClick={onCancel ?? onConfirm} label="대화상자 닫기" />
          </div>

          {description ? (
            <p className="mt-4 w-full whitespace-pre-wrap text-sm leading-6 text-stone-600 dark:text-stone-400">
              {description}
            </p>
          ) : null}

          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            {hasCancel ? (
              <button
                type="button"
                onClick={onCancel}
                className="rounded-lg border border-stone-300 bg-white px-4 py-2.5 text-sm font-semibold text-stone-700 transition hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-300 dark:hover:bg-stone-700"
              >
                {cancelLabel}
              </button>
            ) : null}
            <button
              type="button"
              onClick={onConfirm}
              className={[
                "rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition",
                variantClass[variant],
              ].join(" ")}
            >
              {confirmLabel}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
