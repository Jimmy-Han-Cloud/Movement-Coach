"use client";

interface ProgressBarProps {
  value: number; // 0-100
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "success" | "warning";
  className?: string;
}

const sizeStyles = {
  sm: "h-1",
  md: "h-2",
  lg: "h-3",
};

const variantColors = {
  default: "bg-[var(--color-primary)]",
  success: "bg-[var(--color-success)]",
  warning: "bg-[var(--color-warning)]",
};

export function ProgressBar({
  value,
  showLabel = false,
  size = "md",
  variant = "default",
  className = "",
}: ProgressBarProps) {
  const clampedValue = Math.min(100, Math.max(0, value));

  return (
    <div className={`w-full ${className}`}>
      <div
        className={`
          w-full bg-white/20 rounded-full overflow-hidden
          ${sizeStyles[size]}
        `}
      >
        <div
          className={`
            h-full rounded-full
            transition-all duration-[var(--duration-normal)] ease-[var(--ease-out)]
            ${variantColors[variant]}
          `}
          style={{ width: `${clampedValue}%` }}
        />
      </div>
      {showLabel && (
        <div className="mt-1 text-xs text-white/70 text-right">
          {Math.round(clampedValue)}%
        </div>
      )}
    </div>
  );
}
