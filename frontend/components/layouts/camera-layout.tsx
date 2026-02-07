"use client";

import { type ReactNode, type RefObject, useState, useEffect, useRef } from "react";

interface CameraLayoutProps {
  videoRef: RefObject<HTMLVideoElement | null>;
  avatarOverlay?: ReactNode;
  topLeft?: ReactNode;
  topRight?: ReactNode;
  bottomOverlay?: ReactNode;
  rightOverlay?: ReactNode;
  centerOverlay?: ReactNode;
  pageType: "avatar-setup" | "game";
  dimmed?: boolean;
  /** Head Y position from MediaPipe (0-1, top to bottom) */
  headY?: number;
  /** Shoulder Y position from MediaPipe (0-1, top to bottom) */
  shoulderY?: number;
  children?: ReactNode;
}

// Default offset when MediaPipe not detecting (25% from top)
const DEFAULT_OFFSET = 25;
// Boundary limits
const MIN_OFFSET = 10;
const MAX_OFFSET = 40;
// Smoothing factor (0-1, lower = smoother but slower)
const SMOOTHING_FACTOR = 0.1;

export function CameraLayout({
  videoRef,
  avatarOverlay,
  topLeft,
  topRight,
  bottomOverlay,
  rightOverlay,
  centerOverlay,
  pageType,
  dimmed = false,
  headY,
  shoulderY,
  children,
}: CameraLayoutProps) {
  const avatarOpacity = pageType === "avatar-setup"
    ? "opacity-[var(--opacity-avatar-setup)]"
    : "opacity-[var(--opacity-avatar-game)]";

  // Smoothed offset for object-position
  const [smoothedOffset, setSmoothedOffset] = useState(DEFAULT_OFFSET);
  const targetOffsetRef = useRef(DEFAULT_OFFSET);

  // Calculate target offset from MediaPipe data
  useEffect(() => {
    if (headY !== undefined && shoulderY !== undefined) {
      // Calculate head-shoulder midpoint
      const midpointY = (headY + shoulderY) / 2;
      // Convert to percentage and clamp to bounds
      const targetOffset = Math.max(MIN_OFFSET, Math.min(MAX_OFFSET, midpointY * 100));
      targetOffsetRef.current = targetOffset;
    }
  }, [headY, shoulderY]);

  // Smooth animation loop
  useEffect(() => {
    let animationId: number;

    const animate = () => {
      setSmoothedOffset((current) => {
        const target = targetOffsetRef.current;
        const diff = target - current;
        // Stop updating if very close to target
        if (Math.abs(diff) < 0.1) return target;
        // Exponential moving average
        return current + diff * SMOOTHING_FACTOR;
      });
      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, []);

  const videoClasses = [
    "absolute inset-0 w-full h-full -scale-x-100 object-cover transition-all duration-[var(--duration-normal)]",
    dimmed ? "brightness-50" : "",
  ].filter(Boolean).join(" ");

  // Dynamic object-position based on smoothed offset
  const videoStyle = {
    objectPosition: `center ${smoothedOffset}%`,
  };

  const avatarClasses = [
    "absolute inset-0 flex items-center justify-center pointer-events-none",
    avatarOpacity,
  ].join(" ");

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black">
      <video ref={videoRef} autoPlay playsInline muted className={videoClasses} style={videoStyle} />

      {avatarOverlay && (
        <div className={avatarClasses}>
          {avatarOverlay}
        </div>
      )}

      <div className="absolute top-0 left-0 right-0 p-[var(--spacing-4)] flex justify-between items-start pointer-events-none z-[var(--z-hud)]">
        <div className="pointer-events-auto">{topLeft}</div>
        <div className="pointer-events-auto">{topRight}</div>
      </div>

      {bottomOverlay && (
        <div className="absolute bottom-0 left-0 right-0 p-[var(--spacing-4)] z-[var(--z-floating)]">
          {bottomOverlay}
        </div>
      )}

      {rightOverlay && (
        <div className="absolute right-0 top-0 bottom-0 flex items-center z-[var(--z-floating)]">
          {rightOverlay}
        </div>
      )}

      {centerOverlay && (
        <div className="absolute inset-0 flex items-center justify-center z-[var(--z-overlay)]">
          {centerOverlay}
        </div>
      )}

      {children}
    </div>
  );
}
