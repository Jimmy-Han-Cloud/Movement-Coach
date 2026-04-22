"use client";

import { useEffect, useRef } from "react";
import { useRive } from "@rive-app/react-canvas";

interface RiveCoachProps {
  animationName?: string;
  opacity?: number;
  /** Real shoulder width in pixels from MediaPipe */
  shoulderWidthPx?: number;
  /** Real shoulder Y position (normalized 0-1) from MediaPipe */
  shoulderY?: number;
}

const RIVE_W = 400;
const RIVE_H = 480;
const RIVE_SHOULDER_Y_FRAC = 295 / 480;  // shoulder Y inside artboard
const RIVE_SHOULDER_W_PX = 136;           // shoulder width inside artboard
const SMOOTH = 0.12;
const DEFAULT_HEIGHT_VH = 80;

export function RiveCoach({
  animationName = "idle",
  opacity = 0.85,
  shoulderWidthPx,
  shoulderY,
}: RiveCoachProps) {
  const smoothWidthRef = useRef<number | null>(null);
  const smoothYRef = useRef<number | null>(null);

  const { rive, RiveComponent } = useRive({
    src: "/animations/coach.riv",
    animations: "idle",
    autoplay: true,
  });

  useEffect(() => {
    if (!rive) return;
    rive.play(animationName);
  }, [rive, animationName]);

  // Apply EMA smoothing directly in render (safe: refs don't trigger re-render)
  if (shoulderWidthPx !== undefined && shoulderWidthPx > 40) {
    smoothWidthRef.current = smoothWidthRef.current === null
      ? shoulderWidthPx
      : smoothWidthRef.current + SMOOTH * (shoulderWidthPx - smoothWidthRef.current);
  }
  if (shoulderY !== undefined) {
    smoothYRef.current = smoothYRef.current === null
      ? shoulderY
      : smoothYRef.current + SMOOTH * (shoulderY - smoothYRef.current);
  }

  const screenH = typeof window !== "undefined" ? window.innerHeight : 800;
  const screenW = typeof window !== "undefined" ? window.innerWidth : 1280;

  // Size: scale cartoon to match real shoulder width, or fallback to viewport
  let w: number, h: number;
  if (smoothWidthRef.current !== null && smoothWidthRef.current > 40) {
    const scale = smoothWidthRef.current / RIVE_SHOULDER_W_PX;
    w = RIVE_W * scale;
    h = RIVE_H * scale;
  } else {
    h = screenH * (DEFAULT_HEIGHT_VH / 100);
    w = h * (RIVE_W / RIVE_H);
  }

  // Vertical: anchor cartoon shoulder to real shoulder position
  let top: number;
  if (smoothYRef.current !== null) {
    const realShoulderYPx = smoothYRef.current * screenH;
    top = realShoulderYPx - h * RIVE_SHOULDER_Y_FRAC;
  } else {
    top = (screenH - h) / 2;
  }

  return (
    <div
      style={{
        position: "absolute",
        top: `${top}px`,
        left: `${(screenW - w) / 2}px`,
        width: `${w}px`,
        height: `${h}px`,
        opacity,
      }}
      className="pointer-events-none"
    >
      <RiveComponent />
    </div>
  );
}
