import { ReactNode } from "react";

interface ReturnLinkLabelProps {
  children: ReactNode;
  variant?: "neutral" | "solid";
}

export function ReturnLinkLabel({ children, variant = "neutral" }: ReturnLinkLabelProps) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        aria-hidden="true"
        className={[
          "text-xs leading-none",
          variant === "solid" ? "text-stone-300" : "text-stone-400 dark:text-stone-500",
        ].join(" ")}
      >
        ↖
      </span>
      <span>{children}</span>
    </span>
  );
}
