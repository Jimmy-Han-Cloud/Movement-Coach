"use client";

import { useEffect, useRef, useCallback } from "react";

interface Point {
  x: number;
  y: number;
  t: number;
}

interface UseCheckmarkGestureOptions {
  /** Normalized hand positions from pose detection (0-1 range) */
  handPositions: Array<{ x: number; y: number }>;
  /** Called once when a checkmark gesture is confirmed */
  onDetected: () => void;
  /** Whether detection is active */
  enabled: boolean;
  /** Minimum vertical travel for each stroke (0-1 normalized). Default 0.10 */
  minStroke?: number;
  /** Cooldown between triggers in ms. Default 2000 */
  cooldownMs?: number;
  /** Time window to complete the gesture in ms. Default 1800 */
  windowMs?: number;
  /** How long to wait after enabled=true before starting detection (ms). Default 2500 */
  readyDelayMs?: number;
}

/**
 * Detect a ✓ (checkmark) drawn in the air with one hand.
 *
 * Algorithm:
 *  1. Buffer hand positions over a sliding time window.
 *  2. Find the lowest Y point (the corner of the ✓).
 *  3. Verify the segment before that point has significant downward motion.
 *  4. Verify the segment after that point has significant upward motion.
 *  5. Require minimum points on both sides to avoid noise triggers.
 */
export function useCheckmarkGesture({
  handPositions,
  onDetected,
  enabled,
  minStroke = 0.10,
  cooldownMs = 2000,
  windowMs = 1800,
  readyDelayMs = 2500,
}: UseCheckmarkGestureOptions) {
  const historyRef     = useRef<Point[]>([]);
  const lastTriggerRef = useRef<number>(0);
  const enabledAtRef   = useRef<number | null>(null);
  const onDetectedRef  = useRef(onDetected);
  onDetectedRef.current = onDetected;

  // Track when detection was enabled; reset history on each enable/disable
  useEffect(() => {
    if (enabled) {
      enabledAtRef.current = Date.now();
      historyRef.current = [];
    } else {
      enabledAtRef.current = null;
      historyRef.current = [];
    }
  }, [enabled]);

  const detect = useCallback(() => {
    // Don't trigger during startup stabilisation window
    if (enabledAtRef.current === null) return;
    if (Date.now() - enabledAtRef.current < readyDelayMs) return;

    const history = historyRef.current;
    if (history.length < 12) return;

    // Find the index of the lowest Y (bottom of V)
    let bottomIdx = 0;
    for (let i = 1; i < history.length; i++) {
      if (history[i].y > history[bottomIdx].y) bottomIdx = i;
    }

    // Require at least 4 points on each side of the bottom
    if (bottomIdx < 4 || bottomIdx > history.length - 4) return;

    const topStart = history[0].y;
    const bottomY  = history[bottomIdx].y;
    const topEnd   = history[history.length - 1].y;

    const downStroke = bottomY - topStart; // positive = hand moved down
    const upStroke   = bottomY - topEnd;   // positive = hand moved back up

    if (downStroke > minStroke && upStroke > minStroke) {
      const now = Date.now();
      if (now - lastTriggerRef.current < cooldownMs) return;

      lastTriggerRef.current = now;
      historyRef.current = [];
      onDetectedRef.current();
    }
  }, [minStroke, cooldownMs, readyDelayMs]);

  useEffect(() => {
    if (!enabled || handPositions.length === 0) return;
    if (enabledAtRef.current === null) return;
    // Don't accumulate history during startup delay — prevents initialization noise from firing
    if (Date.now() - enabledAtRef.current < readyDelayMs) return;

    const now = Date.now();
    const pos = handPositions[0];

    historyRef.current.push({ x: pos.x, y: pos.y, t: now });
    historyRef.current = historyRef.current.filter(p => now - p.t < windowMs);

    detect();
  }, [handPositions, enabled, detect, windowMs, readyDelayMs]);
}
