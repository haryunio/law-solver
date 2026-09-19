import { forwardRef, type ButtonHTMLAttributes } from "react";
import { ButtonLoadingContent } from "./AsyncLoading";

export type ButtonVariant = "primary" | "secondary" | "danger" | "success";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: "sm" | "md";
  pending?: boolean;
  pendingLabel?: string;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: "app-button-primary",
  secondary: "app-button-secondary",
  danger: "app-button-danger",
  success: "app-button-success",
};

/** Standard form and dialog action. Page-specific placement stays in className. */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button({
  variant = "secondary",
  size = "md",
  type = "button",
  pending = false,
  pendingLabel = "처리 중",
  disabled,
  className = "",
  children,
  ...props
}, ref) {
  return (
    <button
      {...props}
      ref={ref}
      type={type}
      disabled={disabled || pending}
      aria-busy={pending || undefined}
      className={[
        "rounded-lg font-semibold disabled:cursor-not-allowed disabled:opacity-60",
        size === "sm" ? "px-3 py-2 text-xs" : "px-4 py-2.5 text-sm",
        variantClasses[variant],
        className,
      ].join(" ")}
    >
      {pending ? <ButtonLoadingContent label={pendingLabel} /> : children}
    </button>
  );
});
