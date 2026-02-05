import type { Phase } from "@/types";
import type { TrackedPoints } from "@/modules/pose-validation";
import type { EngineStatus } from "@/modules/flow-engine";

/** Props consumed by all visual feedback components. Read-only, no logic. */
export interface FeedbackDisplayProps {
  /** Current smoothed tracked points from Module 2 */
  trackedPoints: TrackedPoints | null;
  /** Current phase from Module 1 */
  currentPhase: Phase | null;
  /** Engine status from Module 1 */
  engineStatus: EngineStatus;
  /** Total elapsed seconds from Module 1 */
  elapsedTotal: number;
  /** Elapsed seconds within current phase from Module 1 */
  phaseElapsed: number;
  /** Phase duration in seconds */
  phaseDuration: number;
  /** Validation state from Module 2 — consumed as-is, never recomputed */
  inTarget: boolean;
  holdAchieved: boolean;
  elbowParticipating: boolean;
  participating: boolean;
}
