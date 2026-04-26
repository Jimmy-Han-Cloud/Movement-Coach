"use client";

import { useEffect, useRef, useState } from "react";
import { useRive } from "@rive-app/react-canvas";

interface RiveCoachProps {
  animationName?: string;
  opacity?: number;
  /** Path to the .riv file — defaults to coach.riv */
  rivSrc?: string;
  /** Real shoulder width in pixels from MediaPipe */
  shoulderWidthPx?: number;
  /** Real shoulder Y position (normalized 0-1) from MediaPipe */
  shoulderY?: number;
  /** Cartoon face data URL from avatar generation — overlaid on character head */
  avatarImageUrl?: string;
}

const RIVE_W = 400;
const RIVE_H = 480;
const RIVE_SHOULDER_Y_FRAC = 295 / 480;  // shoulder Y inside artboard
const RIVE_SHOULDER_W_PX = 136;           // shoulder width inside artboard
const SMOOTH = 0.12;
const DEFAULT_HEIGHT_VH = 58;   // 72 × 0.8 — scaled down 20% so arms stay in frame
const VERTICAL_OFFSET = 60;

// Head position inside artboard (from avatar-body.svg: head circle center 200,155 radius 80)
const RIVE_HEAD_X_FRAC = 200 / 400;      // 0.5 — center of artboard
const RIVE_HEAD_Y_FRAC = 155 / 480;
const RIVE_HEAD_R_FRAC = 80 / 480;       // radius as fraction of artboard height

export function RiveCoach({
  animationName = "idle",
  opacity = 0.85,
  rivSrc = "/animations/coach.riv",
  shoulderWidthPx,
  shoulderY,
  avatarImageUrl,
}: RiveCoachProps) {
  const smoothWidthRef  = useRef<number | null>(null);
  const smoothYRef      = useRef<number | null>(null);
  const prevAnimRef     = useRef<string>("idle");
  const [screenSize, setScreenSize] = useState({ w: 1280, h: 800 });

  useEffect(() => {
    const update = () => setScreenSize({ w: window.innerWidth, h: window.innerHeight });
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const { rive, RiveComponent } = useRive({
    src: rivSrc,
    animations: "idle",
    autoplay: true,
  });

  useEffect(() => {
    if (!rive) return;
    if (prevAnimRef.current !== animationName) {
      rive.stop(prevAnimRef.current);
      prevAnimRef.current = animationName;

      if (animationName === "idle") {
        rive.play("idle");
      } else {
        // Play one frame of idle to reset all bones to rest position,
        // then immediately switch to the target animation.
        // This prevents bone state from bleeding between animations.
        rive.play("idle");
        requestAnimationFrame(() => {
          rive.stop("idle");
          rive.play(animationName);
        });
      }
    } else {
      rive.play(animationName);
    }
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

  const { w: screenW, h: screenH } = screenSize;

  // Size: scale cartoon to match real shoulder width, or fallback to viewport
  let w: number, h: number;
  if (smoothWidthRef.current !== null && smoothWidthRef.current > 40) {
    const scale = (smoothWidthRef.current / RIVE_SHOULDER_W_PX) * 0.72; // 0.9 × 0.8
    w = RIVE_W * scale;
    h = RIVE_H * scale;
  } else {
    h = screenH * (DEFAULT_HEIGHT_VH / 100);
    w = h * (RIVE_W / RIVE_H);
  }

  // Vertical: anchor cartoon shoulder to real shoulder position + 60px downward offset
  let top: number;
  if (smoothYRef.current !== null) {
    const realShoulderYPx = smoothYRef.current * screenH;
    top = realShoulderYPx - h * RIVE_SHOULDER_Y_FRAC + VERTICAL_OFFSET;
  } else {
    top = (screenH - h) / 2;
  }

  // Head overlay position — anchored to character's head within the rendered artboard
  const headDiameter = RIVE_HEAD_R_FRAC * 2 * h;
  const headLeft = (screenW - w) / 2 + w * RIVE_HEAD_X_FRAC - headDiameter / 2;
  const headTop  = top + h * RIVE_HEAD_Y_FRAC - headDiameter / 2;

  return (
    <>
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

      {avatarImageUrl && (
        <div
          style={{
            position: "absolute",
            top: `${headTop}px`,
            left: `${headLeft}px`,
            width: `${headDiameter}px`,
            height: `${headDiameter}px`,
            borderRadius: "50%",
            overflow: "hidden",
            opacity,
          }}
          className="pointer-events-none"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={avatarImageUrl}
            alt=""
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </div>
      )}
    </>
  );
}
