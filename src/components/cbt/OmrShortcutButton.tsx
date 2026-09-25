interface OmrShortcutButtonProps {
  onClick: () => void;
  expanded: boolean;
  className?: string;
}

export function OmrShortcutButton({ onClick, expanded, className = "" }: OmrShortcutButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="OMR 빠른 이동 열기"
      aria-expanded={expanded}
      title="OMR 빠른 이동"
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-stone-300 bg-white text-[9px] font-bold leading-none text-stone-500 hover:border-red-500 hover:text-red-500 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-400 dark:hover:border-red-500 dark:hover:text-red-500 ${className}`}
    >
      OMR
    </button>
  );
}
