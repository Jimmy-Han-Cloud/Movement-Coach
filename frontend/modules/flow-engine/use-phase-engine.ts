"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Flow, Phase, PhaseResult, UserParams } from "@/types";
import { PhaseEngine } from "./phase-engine";
import type { EngineState, PhaseState } from "./types";

interface UsePhaseEngineOptions {
  flow: Flow;
  userParams: UserParams;
  onComplete?: (results: PhaseResult[]) => void;
}

interface UsePhaseEngineReturn {
  /** Start the session */
  start: () => void;
  /** Stop the session */
  stop: () => void;
  /** Current engine status */
  status: EngineState["status"];
  /** Index of the active phase */
  currentPhaseIndex: number;
  /** The active Phase definition */
  currentPhase: Phase | null;
  /** State of the active phase (timing, validation) */
  currentPhaseState: PhaseState | null;
  /** Total elapsed seconds */
  elapsedTotal: number;
  /** Report validation results from Module 2 */
  reportValidation: PhaseEngine["reportValidation"];
  /** Smart Logic ② timing adjustment */
  adjustPhaseTiming: PhaseEngine["adjustPhaseTiming"];
}

export function usePhaseEngine({
  flow,
  userParams,
  onComplete,
}: UsePhaseEngineOptions): UsePhaseEngineReturn {
  const engineRef = useRef<PhaseEngine | null>(null);

  const [status, setStatus] = useState<EngineState["status"]>("idle");
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);
  const [currentPhase, setCurrentPhase] = useState<Phase | null>(null);
  const [currentPhaseState, setCurrentPhaseState] = useState<PhaseState | null>(null);
  const [elapsedTotal, setElapsedTotal] = useState(0);

  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    const engine = new PhaseEngine(flow, userParams, {
      onPhaseChange: (index, phase) => {
        setCurrentPhaseIndex(index);
        setCurrentPhase(phase);
      },
      onComplete: (results) => {
        setStatus("completed");
        onCompleteRef.current?.(results);
      },
      onTick: (state) => {
        setStatus(state.status);
        setElapsedTotal(state.elapsedTotal);
        setCurrentPhaseState(
          state.phaseStates[state.currentPhaseIndex] ?? null,
        );
      },
    });
    engineRef.current = engine;

    return () => {
      engine.stop();
    };
  }, [flow, userParams]);

  const start = useCallback(() => engineRef.current?.start(), []);
  const stop = useCallback(() => engineRef.current?.stop(), []);

  const reportValidation = useCallback(
    (...args: Parameters<PhaseEngine["reportValidation"]>) =>
      engineRef.current?.reportValidation(...args),
    [],
  );

  const adjustPhaseTiming = useCallback(
    (...args: Parameters<PhaseEngine["adjustPhaseTiming"]>) =>
      engineRef.current?.adjustPhaseTiming(...args),
    [],
  );

  return {
    start,
    stop,
    status,
    currentPhaseIndex,
    currentPhase,
    currentPhaseState,
    elapsedTotal,
    reportValidation,
    adjustPhaseTiming,
  };
}
