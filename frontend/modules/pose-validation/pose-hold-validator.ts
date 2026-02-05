import type { UserParams } from "@/types";
import type { CalibrationBaseline, Point2D, TrackedPoints, ValidationFrame } from "./types";

function distance(a: Point2D, b: Point2D): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

function elbowMoved(
  current: TrackedPoints,
  baseline: CalibrationBaseline,
  threshold: number,
): boolean {
  const leftDist = distance(current.left_elbow, baseline.left_elbow);
  const rightDist = distance(current.right_elbow, baseline.right_elbow);
  return leftDist > threshold || rightDist > threshold;
}

export class PoseHoldValidator {
  private tolerance: number;
  private holdRequired: number;
  private elbowThreshold: number;
  private baseline: CalibrationBaseline;

  private holdStart: number | null = null;
  private holdAccumulated: number = 0;
  private lastInTarget: boolean = false;

  constructor(baseline: CalibrationBaseline, params: UserParams) {
    this.baseline = baseline;
    this.tolerance = params.positional_tolerance;
    this.holdRequired = params.pose_hold_duration;
    this.elbowThreshold = params.elbow_participation_threshold;
  }

  /**
   * Validate a single frame.
   * `targetOffset` is the desired position offset from baseline for the primary tracked point.
   * For example, head tilted left might be { x: -0.1, y: 0 }.
   */
  validate(
    points: TrackedPoints,
    primaryPoint: keyof TrackedPoints,
    targetOffset: Point2D,
    nowSec: number,
  ): ValidationFrame {
    const basePos = this.baseline[primaryPoint];
    const target: Point2D = {
      x: basePos.x + targetOffset.x,
      y: basePos.y + targetOffset.y,
    };
    const current = points[primaryPoint];
    const dist = distance(current, target);
    const inTarget = dist <= this.tolerance;

    if (inTarget) {
      if (!this.lastInTarget) {
        this.holdStart = nowSec;
      }
      this.holdAccumulated = nowSec - (this.holdStart ?? nowSec);
    } else {
      this.holdStart = null;
      this.holdAccumulated = 0;
    }
    this.lastInTarget = inTarget;

    const holdAchieved = this.holdAccumulated >= this.holdRequired;
    const elbowParticipating = elbowMoved(points, this.baseline, this.elbowThreshold);

    return {
      inTarget,
      holdDuration: this.holdAccumulated,
      holdAchieved,
      elbowParticipating,
      participating: inTarget || elbowParticipating,
    };
  }

  reset(): void {
    this.holdStart = null;
    this.holdAccumulated = 0;
    this.lastInTarget = false;
  }
}
