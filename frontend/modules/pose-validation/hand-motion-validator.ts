import type { UserParams } from "@/types";
import type { CalibrationBaseline, Point2D, TrackedPoints, MotionValidationFrame } from "./types";

function distance(a: Point2D, b: Point2D): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

function direction(from: Point2D, to: Point2D): Point2D {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const mag = Math.sqrt(dx * dx + dy * dy);
  if (mag < 0.001) return { x: 0, y: 0 };
  return { x: dx / mag, y: dy / mag };
}

function dotProduct(a: Point2D, b: Point2D): number {
  return a.x * b.x + a.y * b.y;
}

export class HandMotionValidator {
  private elbowThreshold: number;
  private baseline: CalibrationBaseline;

  private prevLeftHand: Point2D | null = null;
  private prevRightHand: Point2D | null = null;

  constructor(baseline: CalibrationBaseline, params: UserParams) {
    this.baseline = baseline;
    this.elbowThreshold = params.elbow_participation_threshold;
  }

  /**
   * Validate hand motion for a single frame.
   * `expectedDirection` is the intended movement direction (unit vector).
   */
  validate(
    points: TrackedPoints,
    expectedDirection: Point2D,
  ): MotionValidationFrame {
    const leftHand = points.left_hand;
    const rightHand = points.right_hand;

    let directionCorrect = false;

    if (this.prevLeftHand && this.prevRightHand) {
      const leftDir = direction(this.prevLeftHand, leftHand);
      const rightDir = direction(this.prevRightHand, rightHand);

      const leftDot = dotProduct(leftDir, expectedDirection);
      const rightDot = dotProduct(rightDir, expectedDirection);

      // Direction is correct if at least one hand moves in the expected direction
      directionCorrect = leftDot > 0.3 || rightDot > 0.3;
    }

    this.prevLeftHand = { ...leftHand };
    this.prevRightHand = { ...rightHand };

    // Elbow participation: elbows must move, not stay static
    const leftElbowDist = distance(points.left_elbow, this.baseline.left_elbow);
    const rightElbowDist = distance(points.right_elbow, this.baseline.right_elbow);
    const elbowParticipating =
      leftElbowDist > this.elbowThreshold || rightElbowDist > this.elbowThreshold;

    return {
      directionCorrect,
      elbowParticipating,
      participating: (directionCorrect || elbowParticipating),
    };
  }

  reset(): void {
    this.prevLeftHand = null;
    this.prevRightHand = null;
  }
}
