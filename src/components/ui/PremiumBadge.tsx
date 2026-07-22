interface PremiumBadgeProps {
  className?: string;
}

export function PremiumBadge({ className = "" }: PremiumBadgeProps) {
  return (
    <span
      className={[
        "app-premium-badge inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11px] font-extrabold tracking-[0.04em]",
        className,
      ].join(" ")}
    >
      <svg
        viewBox="0 0 16 16"
        aria-hidden="true"
        className="h-3.5 w-3.5 shrink-0"
        fill="none"
      >
        <path
          d="m2.75 8.1 3.15 3.15 7.35-8"
          stroke="currentColor"
          strokeWidth="2.25"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      Premium
    </span>
  );
}
