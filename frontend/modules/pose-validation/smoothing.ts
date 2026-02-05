import type { Point2D, TrackedPoints } from "./types";
import type { TrackedPoint } from "@/types";

const SMOOTHING_FACTOR = 0.4; // 0 = full smoothing, 1 = no smoothing

const TRACKED_KEYS: TrackedPoint[] = [
  "head",
  "left_shoulder",
  "right_shoulder",
  "left_elbow",
  "right_elbow",
  "left_hand",
  "right_hand",
];

function lerpPoint(prev: Point2D, curr: Point2D, alpha: number): Point2D {
  return {
    x: prev.x + alpha * (curr.x - prev.x),
    y: prev.y + alpha * (curr.y - prev.y),
  };
}

export function smoothPoints(
  prev: TrackedPoints | null,
  curr: TrackedPoints,
): TrackedPoints {
  if (!prev) return curr;

  const result = {} as TrackedPoints;
  for (const key of TRACKED_KEYS) {
    result[key] = lerpPoint(prev[key], curr[key], SMOOTHING_FACTOR);
  }
  return result;
}
