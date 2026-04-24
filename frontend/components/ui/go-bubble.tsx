"use client";

import { useEffect, useRef, useState } from "react";

interface GoBubbleProps {
  onTrigger: () => void;
  disabled?: boolean;
  handPositions?: Array<{ x: number; y: number }>;
  dwellTime?: number;
  stickyTime?: number;
  className?: string;
}

// 50 petals — cherry blossom rain effect, cascading outward in all directions
const SAKURA_PETALS: Array<{
  tx: number; ty: number; rot: number;
  w: number;  h: number;  color: string; delay: number;
}> = [
  // ── Close ring (radius ~50) ─────────────────────────────────────
  { tx:  50,  ty:  10, rot:   90, w:  9, h:  6, color: "#ffd1dc", delay:   0 },
  { tx:  35,  ty:  40, rot: -120, w: 10, h:  7, color: "#ffb7c5", delay:  15 },
  { tx:   5,  ty:  52, rot:  200, w:  8, h:  5, color: "#ffe4e8", delay:  25 },
  { tx: -38,  ty:  38, rot:  -60, w:  9, h:  6, color: "#ffd1dc", delay:  10 },
  { tx: -52,  ty:   5, rot:  150, w: 10, h:  7, color: "#ffb7c5", delay:  35 },
  { tx: -40,  ty: -35, rot:  -90, w:  8, h:  5, color: "#ff8fab", delay:  20 },
  { tx:  -5,  ty: -50, rot:  270, w:  9, h:  6, color: "#ffd1dc", delay:  45 },
  { tx:  42,  ty: -32, rot: -200, w: 10, h:  7, color: "#ffb7c5", delay:   5 },

  // ── Mid ring (radius ~80-90) ────────────────────────────────────
  { tx:  88,  ty:  18, rot:   60, w: 14, h:  9, color: "#ff8fab", delay:  30 },
  { tx:  70,  ty:  58, rot: -150, w: 13, h:  8, color: "#ffd1dc", delay:  50 },
  { tx:  35,  ty:  82, rot:  110, w: 12, h:  8, color: "#ffc8d8", delay:  18 },
  { tx:  -8,  ty:  90, rot: -240, w: 14, h:  9, color: "#ffb7c5", delay:  60 },
  { tx: -52,  ty:  72, rot:  180, w: 13, h:  8, color: "#ffe4e8", delay:  40 },
  { tx: -85,  ty:  25, rot:  -80, w: 12, h:  8, color: "#ff8fab", delay:  22 },
  { tx: -88,  ty: -22, rot:  130, w: 14, h:  9, color: "#ffd1dc", delay:  55 },
  { tx: -62,  ty: -60, rot: -170, w: 13, h:  8, color: "#ffb7c5", delay:  12 },
  { tx: -18,  ty: -85, rot:  220, w: 12, h:  8, color: "#ffc8d8", delay:  42 },
  { tx:  40,  ty: -78, rot:  -50, w: 14, h:  9, color: "#ff8fab", delay:  28 },
  { tx:  80,  ty: -48, rot:  300, w: 13, h:  8, color: "#ffd1dc", delay:   8 },

  // ── Outer ring (radius ~110-150) ────────────────────────────────
  { tx: 145,  ty:  30, rot:  -30, w: 20, h: 13, color: "#ffd1dc", delay:  20 },
  { tx: 130,  ty:  80, rot:  140, w: 18, h: 12, color: "#ffb7c5", delay:  55 },
  { tx:  90,  ty: 120, rot: -280, w: 21, h: 14, color: "#ff85a1", delay:  35 },
  { tx:  45,  ty: 130, rot:   70, w: 19, h: 13, color: "#ffdde5", delay:  70 },
  { tx:  -8,  ty: 125, rot: -110, w: 20, h: 13, color: "#ffd1dc", delay:  15 },
  { tx: -60,  ty: 118, rot:  250, w: 18, h: 12, color: "#ffb7c5", delay:  80 },
  { tx:-112,  ty:  85, rot:  -40, w: 22, h: 15, color: "#ff8fab", delay:  45 },
  { tx:-140,  ty:  32, rot:  190, w: 20, h: 13, color: "#ffdde5", delay:  25 },
  { tx:-148,  ty: -28, rot: -320, w: 21, h: 14, color: "#ffd1dc", delay:  65 },
  { tx:-122,  ty: -80, rot:   80, w: 19, h: 13, color: "#ffb7c5", delay:  38 },
  { tx: -75,  ty:-118, rot: -160, w: 20, h: 13, color: "#ff85a1", delay:  90 },
  { tx: -20,  ty:-120, rot:  310, w: 18, h: 12, color: "#ffd1dc", delay:  48 },
  { tx:  42,  ty:-115, rot:  -70, w: 22, h: 15, color: "#ffb7c5", delay:  18 },
  { tx:  95,  ty: -95, rot:  230, w: 20, h: 13, color: "#ff8fab", delay:  75 },
  { tx: 135,  ty: -55, rot: -190, w: 19, h: 13, color: "#ffdde5", delay:  32 },

  // ── Extra scatter — fills gaps, adds chaos ───────────────────────
  { tx:  58,  ty:  95, rot:  -45, w: 12, h:  8, color: "#f9c0cb", delay:  85 },
  { tx: -28,  ty:  60, rot:  160, w: 10, h:  7, color: "#ffe4e8", delay:  95 },
  { tx:  22,  ty: -68, rot: -280, w: 11, h:  7, color: "#ffc8d8", delay: 100 },
  { tx: -70,  ty: -45, rot:   35, w: 12, h:  8, color: "#ff85a1", delay:  62 },
  { tx: 110,  ty: -12, rot:  -95, w: 16, h: 10, color: "#ffd1dc", delay:  52 },
  { tx:  12,  ty: 108, rot:  275, w: 15, h: 10, color: "#ffb7c5", delay: 110 },
  { tx: -98,  ty:  55, rot: -135, w: 16, h: 10, color: "#ffdde5", delay:  72 },
  { tx: -48,  ty:-100, rot:   55, w: 15, h: 10, color: "#ff8fab", delay: 105 },
  { tx:  65,  ty: -28, rot:  195, w:  9, h:  6, color: "#f9c0cb", delay:  88 },
  { tx: -18,  ty:  35, rot: -115, w:  8, h:  5, color: "#ffd1dc", delay:  68 },
  { tx: 115,  ty:  55, rot:   25, w: 18, h: 12, color: "#ffb7c5", delay:  42 },
  { tx: -30,  ty:-130, rot: -350, w: 19, h: 12, color: "#ff85a1", delay: 115 },
  { tx: 150,  ty: -10, rot:  120, w: 21, h: 14, color: "#ffdde5", delay:  58 },
  { tx:  25,  ty: -48, rot: -225, w: 10, h:  7, color: "#ffc8d8", delay:  78 },
  { tx: -82,  ty: 100, rot:  340, w: 17, h: 11, color: "#ff8fab", delay: 120 },
];

export function GoBubble({
  onTrigger,
  disabled = false,
  handPositions = [],
  dwellTime = 200,
  stickyTime = 200,
  className = "",
}: GoBubbleProps) {
  // bubbleRef lives on the outer wrapper so getBoundingClientRect() is stable
  // even while the inner bubble is animating scale(0)
  const bubbleRef = useRef<HTMLDivElement>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [isBursting, setIsBursting] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const dwellTimerRef = useRef<NodeJS.Timeout | null>(null);
  const leaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (disabled || isHidden || !bubbleRef.current || handPositions.length === 0) {
      if (dwellTimerRef.current) {
        clearTimeout(dwellTimerRef.current);
        dwellTimerRef.current = null;
      }
      if (!isHovering) return;
      if (!leaveTimerRef.current) {
        leaveTimerRef.current = setTimeout(() => {
          setIsHovering(false);
          leaveTimerRef.current = null;
        }, stickyTime);
      }
      return;
    }

    const rect = bubbleRef.current.getBoundingClientRect();
    const windowWidth  = window.innerWidth;
    const windowHeight = window.innerHeight;

    const bubbleBounds = {
      left:   rect.left   / windowWidth,
      right:  rect.right  / windowWidth,
      top:    rect.top    / windowHeight,
      bottom: rect.bottom / windowHeight,
    };

    const padding = 0.15;
    const isOverBubble = handPositions.some(
      (hand) =>
        1 - hand.x >= bubbleBounds.left   - padding &&
        1 - hand.x <= bubbleBounds.right  + padding &&
        hand.y     >= bubbleBounds.top    - padding &&
        hand.y     <= bubbleBounds.bottom + padding,
    );

    if (isOverBubble) {
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
            setTimeout(() => setIsHidden(true), 1400);
          }
        }, dwellTime);
      }
    } else if (isHovering) {
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

  useEffect(() => {
    return () => {
      if (dwellTimerRef.current) clearTimeout(dwellTimerRef.current);
      if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current);
    };
  }, []);

  if (isHidden) return null;

  return (
    // Outer wrapper: stable position/size for gesture hit-testing.
    // Petals are direct children here so they're NOT subject to the
    // bubble's scale(0) burst animation.
    <div
      ref={bubbleRef}
      className={`relative mr-[25%] w-[150px] h-[150px] pointer-events-auto flex-shrink-0 ${className}`}
    >
      {/* ── Sakura bubble ────────────────────────────────────────── */}
      <div
        onClick={() => {
          if (!disabled && !isHidden) {
            setIsBursting(true);
            onTrigger();
            setTimeout(() => setIsHidden(true), 1400);
          }
        }}
        className={[
          "w-full h-full rounded-full cursor-pointer no-select",
          "flex items-center justify-center",
          "transition-transform duration-[var(--duration-normal)]",
          isBursting  ? "bubble-burst"          : "",
          disabled    ? "opacity-30 cursor-not-allowed" : "",
        ].filter(Boolean).join(" ")}
        style={{
          background:  "linear-gradient(135deg, #ffd6e0 0%, #ffb7c5 45%, #ff8fab 100%)",
          boxShadow:   isHovering
            ? "0 0 55px rgba(255,143,171,0.85), 0 0 22px rgba(255,183,197,0.6)"
            : "0 0 22px rgba(255,183,197,0.55)",
          transform:   !isBursting && isHovering ? "scale(1.25)" : undefined,
        }}
      >
        <span
          className={`text-3xl font-bold text-white/90 transition-transform duration-[var(--duration-fast)] ${isHovering ? "scale-110" : ""}`}
        >
          Go
        </span>

        {/* Ping ring on hover */}
        {isHovering && !isBursting && (
          <span className="absolute inset-0 rounded-full border-4 border-[#ffb7c5]/60 animate-ping" />
        )}
      </div>

      {/* ── Sakura petals — siblings of bubble so scale(0) doesn't kill them ── */}
      {isBursting && SAKURA_PETALS.map((p, i) => (
        <div
          key={i}
          className="sakura-petal absolute pointer-events-none"
          style={{
            width:       `${p.w}px`,
            height:      `${p.h}px`,
            borderRadius: "50%",
            backgroundColor: p.color,
            top:         "50%",
            left:        "50%",
            marginTop:   `${-p.h / 2}px`,
            marginLeft:  `${-p.w / 2}px`,
            "--petal-tx":  `${p.tx}px`,
            "--petal-ty":  `${p.ty}px`,
            "--petal-rot": `${p.rot}deg`,
            animationDelay: `${p.delay}ms`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}
