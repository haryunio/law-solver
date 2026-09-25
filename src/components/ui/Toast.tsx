import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { IconCloseButton } from "./IconCloseButton";
import { useStandardUiScope } from "./StandardUiScope";

export type ToastTone = "error" | "success" | "warning" | "info";

interface ToastProps {
  message: string | null | undefined;
  tone?: ToastTone;
  onDismiss?: () => void;
  durationMs?: number;
}

function ToastIcon({ tone }: { tone: ToastTone }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {tone === "success" ? <path d="m5 10 3.2 3.2L15 6.5" /> : tone === "info" ? <><path d="M10 9v5" /><circle cx="10" cy="5.5" r=".9" fill="currentColor" stroke="none" /></> : <><path d="M10 5v6" /><circle cx="10" cy="14.5" r=".9" fill="currentColor" stroke="none" /></>}
    </svg>
  );
}

export function Toast({ message, tone = "error", onDismiss, durationMs }: ToastProps) {
  const standardUi = useStandardUiScope();
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
    <div className={`${standardUi ? "app-standard-ui " : ""}pointer-events-none fixed left-1/2 top-4 z-[120] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 sm:left-auto sm:right-5 sm:top-5 sm:translate-x-0`}>
      <div
        role={tone === "error" ? "alert" : "status"}
        aria-live={tone === "error" ? "assertive" : "polite"}
        aria-atomic="true"
        className={`app-toast app-toast-${tone} pointer-events-auto flex items-center gap-3 rounded-2xl border px-4 py-3`}
      >
        <span
          aria-hidden="true"
          className="app-toast-icon flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
        >
          <ToastIcon tone={tone} />
        </span>
        <p className="min-w-0 flex-1 break-words text-sm font-medium leading-6">{message}</p>
        {onDismiss ? (
          <IconCloseButton
            onClick={onDismiss}
            label="알림 닫기"
            className="app-toast-dismiss"
          />
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
