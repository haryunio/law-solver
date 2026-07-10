interface IconCloseButtonProps {
  onClick: () => void;
  label?: string;
  className?: string;
}

export function IconCloseButton({ onClick, label = "닫기", className = "" }: IconCloseButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={[
        "app-icon-button inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-stone-500 shadow-sm transition hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-200 dark:text-stone-400 dark:hover:text-red-400 dark:focus:ring-red-900/50",
        className,
      ].join(" ")}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 20 20"
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      >
        <path d="M5 5l10 10M15 5L5 15" />
      </svg>
    </button>
  );
}
