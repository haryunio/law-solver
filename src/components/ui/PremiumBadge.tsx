interface PremiumBadgeProps {
  label?: string;
  className?: string;
}

export function PremiumBadge({ label = "Premium", className = "" }: PremiumBadgeProps) {
  return (
    <span
      className={[
        "app-premium-badge inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-extrabold tracking-[0.04em]",
        className,
      ].join(" ")}
    >
      <span aria-hidden="true">◆</span>
      {label}
    </span>
  );
}
