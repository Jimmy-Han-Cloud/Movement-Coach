"use client";

import { useEffect, useRef, useState } from "react";

interface GoBubbleProps {
  onTrigger: () => void;
  disabled?: boolean;
  handPositions?: Array<{ x: number; y: number }>;
  dwellTime?: number;
  stickyTime?: number; // Grace period before resetting hover
  className?: string;
}

export function GoBubble({
  onTrigger,
  disabled = false,
  handPositions = [],
  dwellTime = 200, // Default 200ms for quick trigger
  stickyTime = 200, // 200ms grace period
  className = "",
}: GoBubbleProps) {
  const bubbleRef = useRef<HTMLDivElement>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [isBursting, setIsBursting] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const dwellTimerRef = useRef<NodeJS.Timeout | null>(null);
  const leaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (disabled || isHidden || !bubbleRef.current || handPositions.length === 0) {
      // Clear timers if disabled or no hands detected
      if (dwellTimerRef.current) {
        clearTimeout(dwellTimerRef.current);
        dwellTimerRef.current = null;
      }
      // Don't reset hover immediately when no hands - use sticky behavior
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

    const rect = bubbleRef.current.getBoundingClientRect();
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    const bubbleBounds = {
      left: rect.left / windowWidth,
      right: rect.right / windowWidth,
      top: rect.top / windowHeight,
      bottom: rect.bottom / windowHeight,
    };

    // Increased padding for easier targeting (15%)
    const padding = 0.15;
    const isOverBubble = handPositions.some(
      (hand) =>
        1 - hand.x >= bubbleBounds.left - padding &&
        1 - hand.x <= bubbleBounds.right + padding &&
        hand.y >= bubbleBounds.top - padding &&
        hand.y <= bubbleBounds.bottom + padding
    );

    if (isOverBubble) {
      // Clear leave timer if hand comes back
      if (leaveTimerRef.current) {
        clearTimeout(leaveTimerRef.current);
        leaveTimerRef.current = null;
      }

      if (!isHovering) {
        setIsHovering(true);
        dwellTimerRef.current = setTimeout(() => {
          if (!disabled && !isHidden) {
            setIsBursting(true);
            onTrigger();
            setTimeout(() => setIsHidden(true), 400);
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
  }, [handPositions, disabled, isHidden, isHovering, dwellTime, stickyTime, onTrigger]);

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

  if (isHidden) return null;

  // Size: 150px, Position: right 25% of screen
  const baseClasses = "absolute right-[25%] top-1/2 -translate-y-1/2 w-[150px] h-[150px] flex items-center justify-center rounded-full bg-[var(--color-primary)] shadow-[var(--shadow-glow)] cursor-pointer no-select transition-all duration-[var(--duration-normal)]";
  const hoverClasses = isHovering ? "scale-125 shadow-[0_0_50px_rgb(59_130_246/0.8)]" : "";
  const burstClasses = isBursting ? "bubble-burst" : "";
  const disabledClasses = disabled ? "opacity-30 cursor-not-allowed" : "";

  return (
    <div
      ref={bubbleRef}
      onClick={() => {
        if (!disabled && !isHidden) {
          setIsBursting(true);
          onTrigger();
          setTimeout(() => setIsHidden(true), 400);
        }
      }}
      className={`${baseClasses} ${hoverClasses} ${burstClasses} ${disabledClasses} ${className}`}
    >
      <span className={`text-3xl font-bold text-white transition-transform duration-[var(--duration-fast)] ${isHovering ? "scale-110" : ""}`}>
        Go
      </span>
      {isHovering && !isBursting && (
        <span className="absolute inset-0 rounded-full border-4 border-white/50 animate-ping" />
      )}
    </div>
  );
}
