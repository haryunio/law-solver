import { forwardRef, type ButtonHTMLAttributes } from "react";
import { ButtonLoadingContent } from "./AsyncLoading";

export type ButtonVariant = "primary" | "secondary" | "danger" | "success";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
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
        "rounded-lg px-4 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60",
        variantClasses[variant],
        className,
      ].join(" ")}
    >
      {pending ? <ButtonLoadingContent label={pendingLabel} /> : children}
    </button>
  );
});
