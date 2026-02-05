import type { TrackedPoint } from "@/types";

/** Normalized 2D coordinate (0-1 range relative to frame) */
export interface Point2D {
  x: number;
  y: number;
}

/** All 7 tracked points with their current positions */
export type TrackedPoints = Record<TrackedPoint, Point2D>;

/** Calibration baseline captured during Phase 0 */
export type CalibrationBaseline = TrackedPoints;

/** Result from a single validation frame */
export interface ValidationFrame {
  /** Is the user's target point within tolerance of the target zone? */
  inTarget: boolean;
  /** How long (seconds) the user has been continuously in the target zone */
  holdDuration: number;
  /** Is the hold duration requirement met? */
  holdAchieved: boolean;
  /** Are elbows participating in the movement? */
  elbowParticipating: boolean;
  /** Overall participation detected this frame */
  participating: boolean;
}

/** Accumulated state for hand motion validation */
export interface MotionValidationFrame {
  /** Is the hand following the expected direction? */
  directionCorrect: boolean;
  /** Are elbows participating? */
  elbowParticipating: boolean;
  /** Overall participation */
  participating: boolean;
}
