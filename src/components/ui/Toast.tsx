import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { IconCloseButton } from "./IconCloseButton";

export type ToastTone = "error" | "success" | "warning" | "info";

interface ToastProps {
  message: string | null | undefined;
  tone?: ToastTone;
  onDismiss?: () => void;
  durationMs?: number;
}

const toneIcon: Record<ToastTone, string> = {
  error: "!",
  success: "✓",
  warning: "!",
  info: "i",
};

export function Toast({ message, tone = "error", onDismiss, durationMs }: ToastProps) {
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;
  const resolvedDuration = durationMs ?? (tone === "success" ? 4_000 : 7_000);

  useEffect(() => {
    if (!message || !onDismissRef.current || resolvedDuration <= 0) return;
    const timer = window.setTimeout(() => onDismissRef.current?.(), resolvedDuration);
    return () => window.clearTimeout(timer);
  }, [message, resolvedDuration]);

  if (!message || typeof document === "undefined") return null;

  return createPortal(
    <div className="pointer-events-none fixed left-1/2 top-4 z-[120] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 sm:left-auto sm:right-5 sm:top-5 sm:translate-x-0">
      <div
        role={tone === "error" ? "alert" : "status"}
        aria-live={tone === "error" ? "assertive" : "polite"}
        aria-atomic="true"
        className={`app-toast app-toast-${tone} pointer-events-auto flex items-start gap-3 rounded-2xl border p-3 shadow-2xl`}
      >
        <span
          aria-hidden="true"
          className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-black"
        >
          {toneIcon[tone]}
        </span>
        <p className="min-w-0 flex-1 py-0.5 text-sm font-medium leading-5">{message}</p>
        {onDismiss ? (
          <IconCloseButton
            onClick={onDismiss}
            label="알림 닫기"
            className="h-7 w-7 border-current bg-transparent shadow-none"
          />
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
