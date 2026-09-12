import { useId } from "react";
import { IconCloseButton } from "./IconCloseButton";
import { Button } from "./Button";
import { Dialog } from "./Dialog";

type ConfirmVariant = "default" | "danger" | "success";

interface ConfirmDialogProps {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmVariant;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
  pending?: boolean;
  pendingLabel?: string;
}

export function ConfirmDialog({
  title,
  description,
  confirmLabel = "확인",
  cancelLabel = "취소",
  variant = "default",
  onConfirm,
  onCancel,
  pending = false,
  pendingLabel = "처리 중",
}: ConfirmDialogProps) {
  const hasCancel = Boolean(onCancel);
  const titleId = useId();
  const descriptionId = useId();
  const close = pending ? undefined : onCancel ?? (() => void onConfirm());

  return (
    <Dialog
      labelledBy={titleId}
      describedBy={description ? descriptionId : undefined}
      onClose={close}
      surfaceClassName="max-h-[calc(100dvh-2rem)] max-w-[28rem] overflow-y-auto rounded-2xl border p-5"
    >
      <div className="flex items-start justify-between gap-4">
        <h2 id={titleId} className="min-w-0 flex-1 text-base font-semibold text-stone-900 dark:text-stone-100">
          {title}
        </h2>
        <IconCloseButton
          onClick={() => close?.()}
          disabled={pending}
          label="대화상자 닫기"
        />
      </div>

      {description ? (
        <p id={descriptionId} className="mt-4 w-full whitespace-pre-wrap text-sm leading-6 text-stone-600 dark:text-stone-400">
          {description}
        </p>
      ) : null}

      <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        {hasCancel ? (
          <Button
            onClick={onCancel}
            disabled={pending}
          >
            {cancelLabel}
          </Button>
        ) : null}
        <Button
          variant={variant === "default" ? "primary" : variant}
          onClick={() => void onConfirm()}
          pending={pending}
          pendingLabel={pendingLabel}
        >
          {confirmLabel}
        </Button>
      </div>
    </Dialog>
  );
}
