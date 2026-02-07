"use client";

export type StatusType =
  | "generating"
  | "previewing"
  | "locked"
  | "failed"
  | "connected"
  | "disconnected"
  | "switching"
  | "idle"
  | "playing"
  | "paused";

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

const statusConfig: Record<
  StatusType,
  { label: string; color: string; pulse?: boolean }
> = {
  generating: {
    label: "Generating...",
    color: "bg-[var(--color-primary)] text-white",
    pulse: true,
  },
  previewing: {
    label: "Previewing",
    color: "bg-[var(--color-warning)] text-black",
  },
  locked: {
    label: "Locked",
    color: "bg-[var(--color-success)] text-white",
  },
  failed: {
    label: "Generation failed. Retry.",
    color: "bg-[var(--color-error)] text-white",
  },
  connected: {
    label: "Connected",
    color: "bg-[var(--color-success)] text-white",
  },
  disconnected: {
    label: "Not connected",
    color: "bg-[var(--color-neutral-600)] text-white",
  },
  switching: {
    label: "Switching...",
    color: "bg-[var(--color-primary)] text-white",
    pulse: true,
  },
  idle: {
    label: "Ready",
    color: "bg-[var(--color-neutral-600)] text-white",
  },
  playing: {
    label: "Playing",
    color: "bg-[var(--color-success)] text-white",
  },
  paused: {
    label: "Paused",
    color: "bg-[var(--color-warning)] text-black",
  },
};

export function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span
      className={`
        inline-flex items-center gap-1.5
        px-2.5 py-1
        text-xs font-medium
        rounded-full
        ${config.color}
        ${config.pulse ? "status-generating" : ""}
        ${className}
      `}
    >
      {config.pulse && (
        <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
      )}
      {config.label}
    </span>
  );
}
