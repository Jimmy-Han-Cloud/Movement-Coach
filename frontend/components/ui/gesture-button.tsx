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
  stickyTime?: number; // Grace period before resetting hover
}

export function GestureButton({
  children,
  onTrigger,
  disabled = false,
  variant = "primary",
  position = "center",
  className = "",
  handPositions = [],
  dwellTime = 400, // Balanced between responsiveness and Spec (500ms)
  debounceTime = 2000,
  stickyTime = 200, // 200ms grace period
}: GestureButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [isTriggered, setIsTriggered] = useState(false);
  const [canTrigger, setCanTrigger] = useState(true);
  const dwellTimerRef = useRef<NodeJS.Timeout | null>(null);
  const leaveTimerRef = useRef<NodeJS.Timeout | null>(null);

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
      // Don't reset hover immediately - use sticky behavior
      if (!isHovering) return;

      // Start leave timer if not already running
      if (!leaveTimerRef.current) {
        leaveTimerRef.current = setTimeout(() => {
          setIsHovering(false);
          leaveTimerRef.current = null;
        }, stickyTime);
      }
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

    // Increased padding for easier targeting (15%)
    const padding = 0.15;
    const isOverButton = handPositions.some(
      (hand) =>
        1 - hand.x >= buttonBounds.left - padding &&
        1 - hand.x <= buttonBounds.right + padding &&
        hand.y >= buttonBounds.top - padding &&
        hand.y <= buttonBounds.bottom + padding
    );

    if (isOverButton) {
      // Clear leave timer if hand comes back
      if (leaveTimerRef.current) {
        clearTimeout(leaveTimerRef.current);
        leaveTimerRef.current = null;
      }

      if (!isHovering) {
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
      }
    } else if (isHovering) {
      // Hand left - start sticky timer instead of immediate reset
      if (!leaveTimerRef.current) {
        leaveTimerRef.current = setTimeout(() => {
          setIsHovering(false);
          if (dwellTimerRef.current) {
            clearTimeout(dwellTimerRef.current);
            dwellTimerRef.current = null;
          }
          leaveTimerRef.current = null;
        }, stickyTime);
      }
    }
  }, [handPositions, disabled, canTrigger, isHovering, dwellTime, debounceTime, stickyTime, onTrigger]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (dwellTimerRef.current) {
        clearTimeout(dwellTimerRef.current);
      }
      if (leaveTimerRef.current) {
        clearTimeout(leaveTimerRef.current);
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
