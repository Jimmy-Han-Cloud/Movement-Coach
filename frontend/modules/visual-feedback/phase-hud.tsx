"use client";

import type { Phase } from "@/types";
import type { EngineStatus } from "@/modules/flow-engine";

interface PhaseHudProps {
  currentPhase: Phase | null;
  engineStatus: EngineStatus;
  elapsedTotal: number;
  phaseElapsed: number;
  phaseDuration: number;
  inTarget: boolean;
  holdAchieved: boolean;
}

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function statusLabel(
  engineStatus: EngineStatus,
  inTarget: boolean,
  holdAchieved: boolean,
): string {
  if (engineStatus === "idle") return "Ready";
  if (engineStatus === "completed") return "Session Complete";
  if (holdAchieved) return "Hold Complete";
  if (inTarget) return "In Position — Hold";
  return "Move to Target";
}

export function PhaseHud(props: PhaseHudProps) {
  const {
    currentPhase,
    engineStatus,
    elapsedTotal,
    phaseElapsed,
    phaseDuration,
    inTarget,
    holdAchieved,
  } = props;

  const progress = phaseDuration > 0 ? Math.min(phaseElapsed / phaseDuration, 1) : 0;

  return (
    <div className="absolute top-4 left-4 right-4 flex items-start justify-between pointer-events-none">
      <div className="bg-black/60 text-white rounded-lg px-4 py-2 text-sm">
        <div className="font-medium">
          {currentPhase ? currentPhase.name : "—"}
        </div>
        <div className="text-xs text-white/70">
          {currentPhase ? currentPhase.phase_type.replace("_", " ") : ""}
        </div>
      </div>

      <div className="bg-black/60 text-white rounded-lg px-4 py-2 text-sm text-center">
        <div className="font-medium">{formatTime(elapsedTotal)}</div>
        <div className="text-xs text-white/70">
          {statusLabel(engineStatus, inTarget, holdAchieved)}
        </div>
      </div>

      <div className="bg-black/60 rounded-lg px-4 py-2 w-32">
        <div className="h-2 bg-white/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-white rounded-full transition-all duration-300"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
        <div className="text-xs text-white/70 mt-1 text-center">
          Phase {(currentPhase?.index ?? 0) + 1}
        </div>
      </div>
    </div>
  );
}
