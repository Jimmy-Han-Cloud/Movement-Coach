"use client";

import type { Phase } from "@/types";
import type { EngineStatus } from "@/modules/flow-engine";

interface RiveCharacterProps {
  currentPhase: Phase | null;
  engineStatus: EngineStatus;
  phaseElapsed: number;
  phaseDuration: number;
}

/**
 * Placeholder for the Rive reference character.
 *
 * This component will be replaced with an actual Rive canvas
 * once .riv assets are created. It currently renders a static
 * placeholder that displays the expected phase animation name.
 *
 * Responsibilities (current and future):
 * - Render the demo character
 * - Sync animation state to the current Phase timing
 * - Visual guidance ONLY — never influences validation or engine logic
 */
export function RiveCharacter(props: RiveCharacterProps) {
  const { currentPhase, engineStatus } = props;

  if (engineStatus === "idle") {
    return (
      <div className="w-48 h-64 bg-white/10 rounded-xl flex items-center justify-center">
        <span className="text-white/40 text-sm">Demo Character</span>
      </div>
    );
  }

  return (
    <div className="w-48 h-64 bg-white/10 rounded-xl flex flex-col items-center justify-center gap-2">
      <div className="w-12 h-12 rounded-full bg-white/20" />
      <span className="text-white/60 text-xs text-center px-2">
        {currentPhase?.name ?? "—"}
      </span>
    </div>
  );
}
