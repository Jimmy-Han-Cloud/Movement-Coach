"use client";

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
  fullWidth?: boolean;
  loading?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: "bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white shadow-md hover:shadow-lg",
  secondary: "bg-[var(--color-surface-elevated)] hover:bg-[var(--color-neutral-700)] text-[var(--color-foreground)] border border-[var(--color-neutral-600)]",
  ghost: "bg-transparent hover:bg-[var(--color-surface)] text-[var(--color-foreground)]",
  danger: "bg-[var(--color-error)] hover:bg-[var(--color-error-muted)] text-white",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-sm rounded-[var(--radius-md)]",
  md: "px-4 py-2 text-base rounded-[var(--radius-lg)]",
  lg: "px-6 py-3 text-lg rounded-[var(--radius-xl)]",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", children, fullWidth = false, loading = false, disabled, className = "", ...props }, ref) => {
    const isDisabled = disabled || loading;

    const classes = [
      "inline-flex items-center justify-center font-medium transition-all duration-[var(--duration-normal)] ease-[var(--ease-out)] no-select",
      variantStyles[variant],
      sizeStyles[size],
      fullWidth ? "w-full" : "",
      isDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
      className,
    ].filter(Boolean).join(" ");

    return (
      <button ref={ref} disabled={isDisabled} className={classes} {...props}>
        {loading ? (
          <span className="flex items-center gap-2">
            <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            <span>{children}</span>
          </span>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = "Button";
