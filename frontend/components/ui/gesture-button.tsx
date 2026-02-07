"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

interface GestureButtonProps {
  children: ReactNode;
  onTrigger: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary";
  position?: "left" | "right" | "center";
  className?: string;
  handPositions?: Array<{ x: number; y: number }>;
  dwellTime?: number;
  debounceTime?: number;
}

export function GestureButton({
  children,
  onTrigger,
  disabled = false,
  variant = "primary",
  position = "center",
  className = "",
  handPositions = [],
  dwellTime = 500,
  debounceTime = 2000,
}: GestureButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [isTriggered, setIsTriggered] = useState(false);
  const [canTrigger, setCanTrigger] = useState(true);
  const dwellTimerRef = useRef<NodeJS.Timeout | null>(null);

  const variantStyles = {
    primary: "bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white",
    secondary: "bg-[var(--color-surface-elevated)] hover:bg-[var(--color-neutral-700)] text-white border border-white/20",
  };

  const positionStyles = {
    left: "left-[var(--spacing-8)]",
    right: "right-[var(--spacing-8)]",
    center: "left-1/2 -translate-x-1/2",
  };

  useEffect(() => {
    if (disabled || !canTrigger || !buttonRef.current || handPositions.length === 0) {
      if (dwellTimerRef.current) {
        clearTimeout(dwellTimerRef.current);
        dwellTimerRef.current = null;
      }
      setIsHovering(false);
      return;
    }

    const rect = buttonRef.current.getBoundingClientRect();
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    const buttonBounds = {
      left: rect.left / windowWidth,
      right: rect.right / windowWidth,
      top: rect.top / windowHeight,
      bottom: rect.bottom / windowHeight,
    };

    const isOverButton = handPositions.some(
      (hand) =>
        1 - hand.x >= buttonBounds.left &&
        1 - hand.x <= buttonBounds.right &&
        hand.y >= buttonBounds.top &&
        hand.y <= buttonBounds.bottom
    );

    if (isOverButton && !isHovering) {
      setIsHovering(true);
      dwellTimerRef.current = setTimeout(() => {
        if (!disabled && canTrigger) {
          setIsTriggered(true);
          setCanTrigger(false);
          onTrigger();
          setTimeout(() => setIsTriggered(false), 400);
          setTimeout(() => setCanTrigger(true), debounceTime);
        }
      }, dwellTime);
    } else if (!isOverButton && isHovering) {
      setIsHovering(false);
      if (dwellTimerRef.current) {
        clearTimeout(dwellTimerRef.current);
        dwellTimerRef.current = null;
      }
    }
    // Note: No cleanup here - timer is managed by the logic above
    // Cleanup on unmount is handled by the separate useEffect below
  }, [handPositions, disabled, canTrigger, isHovering, dwellTime, debounceTime, onTrigger]);

  useEffect(() => {
    return () => {
      if (dwellTimerRef.current) {
        clearTimeout(dwellTimerRef.current);
      }
    };
  }, []);

  const classes = [
    "absolute bottom-[var(--spacing-8)]",
    positionStyles[position],
    "px-8 py-4 text-lg font-semibold rounded-[var(--radius-2xl)]",
    variantStyles[variant],
    "gesture-target no-select transition-all duration-[var(--duration-normal)]",
    disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
    isHovering ? "ring-4 ring-white/50 scale-110" : "",
    isTriggered ? "scale-95" : "",
    className,
  ].filter(Boolean).join(" ");

  return (
    <button
      ref={buttonRef}
      onClick={() => {
        if (!disabled && canTrigger) {
          onTrigger();
          setCanTrigger(false);
          setTimeout(() => setCanTrigger(true), debounceTime);
        }
      }}
      disabled={disabled}
      data-hovering={isHovering}
      data-triggered={isTriggered}
      className={classes}
    >
      {children}
    </button>
  );
}
