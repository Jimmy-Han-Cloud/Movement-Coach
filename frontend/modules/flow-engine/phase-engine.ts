import type { Flow, Phase, PhaseResult, UserParams } from "@/types";
import type { EngineCallbacks, EngineState, PhaseState } from "./types";

const MAX_TIMING_ADJUSTMENT = 0.5; // Smart Logic ②

function buildInitialPhaseStates(flow: Flow): PhaseState[] {
  return flow.phases.map((phase) => ({
    phase,
    elapsedInPhase: 0,
    durationAdjustment: 0,
    completed: false,
    quality: "missed",
    holdAchieved: null,
    elbowParticipation: null,
    participation: false,
  }));
}

function phaseDuration(phase: Phase, adjustment: number): number {
  const base = phase.end_sec - phase.start_sec;
  return base + adjustment;
}

export function buildPhaseResults(phaseStates: PhaseState[]): PhaseResult[] {
  return phaseStates.map((ps) => ({
    phase_index: ps.phase.index,
    phase_name: ps.phase.name,
    participation: ps.participation,
    hold_achieved: ps.holdAchieved,
    elbow_participation: ps.elbowParticipation,
    quality: ps.quality,
    notes: "",
  }));
}

export class PhaseEngine {
  private state: EngineState;
  private callbacks: EngineCallbacks;
  private rafId: number | null = null;
  private lastTimestamp: number | null = null;
  private phaseStartTotal: number = 0;

  constructor(
    flow: Flow,
    userParams: UserParams,
    callbacks: EngineCallbacks = {},
  ) {
    this.callbacks = callbacks;
    this.state = {
      status: "idle",
      flow,
      currentPhaseIndex: 0,
      elapsedTotal: 0,
      phaseStates: buildInitialPhaseStates(flow),
      userParams,
    };
  }

  getState(): Readonly<EngineState> {
    return this.state;
  }

  getCurrentPhase(): Phase | null {
    if (this.state.status !== "running") return null;
    return this.state.flow.phases[this.state.currentPhaseIndex] ?? null;
  }

  getCurrentPhaseState(): PhaseState | null {
    if (this.state.status !== "running") return null;
    return this.state.phaseStates[this.state.currentPhaseIndex] ?? null;
  }

  start(): void {
    if (this.state.status !== "idle") return;
    this.state.status = "running";
    this.state.currentPhaseIndex = 0;
    this.state.elapsedTotal = 0;
    this.phaseStartTotal = 0;
    this.lastTimestamp = null;
    this.callbacks.onPhaseChange?.(0, this.state.flow.phases[0]);
    this.rafId = requestAnimationFrame(this.tick);
  }

  stop(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.lastTimestamp = null;
  }

  restart(): void {
    this.stop();
    this.state.status = "idle";
    this.state.elapsedTotal = 0;
    this.state.currentPhaseIndex = 0;
    this.phaseStartTotal = 0;
    this.state.phaseStates = buildInitialPhaseStates(this.state.flow);
    this.start();
  }

  pause(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.lastTimestamp = null;
    this.state.status = "paused";
  }

  resume(): void {
    if (this.state.status !== "paused") return;
    if (this.rafId !== null) return;
    this.state.status = "running";
    this.lastTimestamp = null;
    this.rafId = requestAnimationFrame(this.tick);
  }

  /** Called by Module 2 (pose validation) to report validation results for current phase */
  reportValidation(update: {
    participation?: boolean;
    holdAchieved?: boolean;
    elbowParticipation?: boolean;
    quality?: "ok" | "partial" | "missed";
  }): void {
    const ps = this.state.phaseStates[this.state.currentPhaseIndex];
    if (!ps || ps.completed) return;

    if (update.participation !== undefined) ps.participation = update.participation;
    if (update.holdAchieved !== undefined) ps.holdAchieved = update.holdAchieved;
    if (update.elbowParticipation !== undefined) ps.elbowParticipation = update.elbowParticipation;
    if (update.quality !== undefined) ps.quality = update.quality;
  }

  /** Smart Logic ②: adjust current phase timing by delta (clamped to ±0.5s) */
  adjustPhaseTiming(deltaSec: number): void {
    const ps = this.state.phaseStates[this.state.currentPhaseIndex];
    if (!ps || ps.completed) return;

    const newAdj = Math.max(
      -MAX_TIMING_ADJUSTMENT,
      Math.min(MAX_TIMING_ADJUSTMENT, ps.durationAdjustment + deltaSec),
    );
    ps.durationAdjustment = newAdj;
  }

  private tick = (timestamp: number): void => {
    if (this.state.status !== "running") return;

    if (this.lastTimestamp === null) {
      this.lastTimestamp = timestamp;
      this.rafId = requestAnimationFrame(this.tick);
      return;
    }

    const deltaSec = (timestamp - this.lastTimestamp) / 1000;
    this.lastTimestamp = timestamp;
    this.state.elapsedTotal += deltaSec;

    const idx = this.state.currentPhaseIndex;
    const ps = this.state.phaseStates[idx];
    ps.elapsedInPhase += deltaSec;

    const dur = phaseDuration(ps.phase, ps.durationAdjustment);

    if (ps.elapsedInPhase >= dur) {
      ps.completed = true;

      const nextIdx = idx + 1;
      if (nextIdx >= this.state.flow.phases.length) {
        this.state.status = "completed";
        this.stop();
        this.callbacks.onComplete?.(buildPhaseResults(this.state.phaseStates));
        return;
      }

      this.state.currentPhaseIndex = nextIdx;
      this.phaseStartTotal = this.state.elapsedTotal;
      this.callbacks.onPhaseChange?.(nextIdx, this.state.flow.phases[nextIdx]);
    }

    this.callbacks.onTick?.(this.state);
    this.rafId = requestAnimationFrame(this.tick);
  };
}
