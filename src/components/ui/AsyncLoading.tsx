import type { ReactNode } from "react";

interface SkeletonBlockProps {
  className: string;
}

export function SkeletonBlock({ className }: SkeletonBlockProps) {
  return <span aria-hidden="true" className={`app-skeleton block ${className}`} />;
}

interface LoadingRegionProps {
  label: string;
  className?: string;
  children: ReactNode;
}

export function LoadingRegion({ label, className = "", children }: LoadingRegionProps) {
  return (
    <div role="status" aria-live="polite" aria-label={label} className={className}>
      {children}
      <span className="sr-only">{label}</span>
    </div>
  );
}

export function ButtonLoadingContent({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center justify-center gap-2">
      <span className="app-spinner app-spinner-sm" aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
}

export function AsyncTransitionOverlay({ label }: { label: string }) {
  return (
    <div className="app-async-overlay fixed inset-0 z-[70] flex items-center justify-center px-4" role="status" aria-live="assertive">
      <div className="app-modal-surface flex items-center gap-3 rounded-2xl border px-5 py-4 shadow-2xl">
        <span className="app-spinner text-red-600 dark:text-red-400" aria-hidden="true" />
        <span className="text-sm font-semibold text-stone-800 dark:text-stone-200">{label}</span>
      </div>
    </div>
  );
}
