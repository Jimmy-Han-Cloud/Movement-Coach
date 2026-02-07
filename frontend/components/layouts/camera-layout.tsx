"use client";

import { type ReactNode, type RefObject } from "react";

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
  children?: ReactNode;
}

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
  children,
}: CameraLayoutProps) {
  const avatarOpacity = pageType === "avatar-setup"
    ? "opacity-[var(--opacity-avatar-setup)]"
    : "opacity-[var(--opacity-avatar-game)]";

  const videoClasses = [
    "absolute inset-0 w-full h-full object-cover -scale-x-100 transition-all duration-[var(--duration-normal)]",
    dimmed ? "brightness-50" : "",
  ].filter(Boolean).join(" ");

  const avatarClasses = [
    "absolute inset-0 flex items-center justify-center pointer-events-none",
    avatarOpacity,
  ].join(" ");

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black">
      <video ref={videoRef} autoPlay playsInline muted className={videoClasses} />

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
