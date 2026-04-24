import type { Phase, PhaseQuality, PhaseResult, Flow, UserParams } from "@/types";

export type EngineStatus = "idle" | "running" | "paused" | "completed";

export interface PhaseState {
  phase: Phase;
  elapsedInPhase: number;
  durationAdjustment: number; // Smart Logic ②: ±0.5s max
  completed: boolean;
  quality: PhaseQuality;
  holdAchieved: boolean | null;
  elbowParticipation: boolean | null;
  participation: boolean;
}

export interface EngineState {
  status: EngineStatus;
  flow: Flow;
  currentPhaseIndex: number;
  elapsedTotal: number;
  phaseStates: PhaseState[];
  userParams: UserParams;
}

export interface EngineCallbacks {
  onPhaseChange?: (phaseIndex: number, phase: Phase) => void;
  onComplete?: (results: PhaseResult[]) => void;
  onTick?: (state: EngineState) => void;
}
