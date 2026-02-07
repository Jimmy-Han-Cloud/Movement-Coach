"use client";

import { type ReactNode, type HTMLAttributes } from "react";

type CardVariant = "default" | "elevated" | "glass";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  padding?: "none" | "sm" | "md" | "lg";
  children: ReactNode;
}

const variantStyles: Record<CardVariant, string> = {
  default: "bg-[var(--color-surface)] border border-[var(--color-neutral-800)]",
  elevated: "bg-[var(--color-surface-elevated)] shadow-lg border border-[var(--color-neutral-700)]",
  glass: "bg-black/60 backdrop-blur-md border border-white/10",
};

const paddingStyles: Record<string, string> = {
  none: "",
  sm: "p-[var(--spacing-2)]",
  md: "p-[var(--spacing-4)]",
  lg: "p-[var(--spacing-6)]",
};

export function Card({ variant = "default", padding = "md", children, className = "", ...props }: CardProps) {
  const classes = [
    "rounded-[var(--radius-xl)]",
    variantStyles[variant],
    paddingStyles[padding],
    className,
  ].filter(Boolean).join(" ");

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
}
