"use client";

import type { Phase } from "@/types";

interface FlowTimelineProps {
  phases: Phase[];
  currentPhaseIndex: number;
}

// ── Stick figure SVG definitions ──────────────────────────────────
// viewBox="0 0 20 30": head circle + body + arms + legs
// Arm endpoints vary per phase name to show the movement shape.

type ArmDef = { lx: number; ly: number; rx: number; ry: number };

const ARMS: Record<string, ArmDef> = {
  // neutral — arms hanging relaxed
  neutral:                           { lx: 6,  ly: 17, rx: 14, ry: 17 },
  neutral_reset_breath:              { lx: 6,  ly: 17, rx: 14, ry: 17 },
  neutral_shoulder_release:          { lx: 5,  ly: 15, rx: 15, ry: 15 },
  // pose holds — arms in held position
  pose_shoulder_drop_neck_lift:      { lx: 4,  ly: 15, rx: 16, ry: 15 },
  pose_chest_open_bilateral:         { lx: 1,  ly: 12, rx: 19, ry: 12 },
  pose_elbow_overhead_reach:         { lx: 5,  ly: 7,  rx: 15, ry: 15 },
  pose_shoulder_lift_release:        { lx: 3,  ly: 8,  rx: 17, ry: 8  },
  // hand motions — mid-movement arm shapes
  motion_arm_diagonal_up_sweep:      { lx: 5,  ly: 15, rx: 17, ry: 6  },
  motion_arm_alternate_up_down:      { lx: 2,  ly: 7,  rx: 18, ry: 16 },
  motion_arm_vertical_alternate:     { lx: 7,  ly: 5,  rx: 13, ry: 18 },
  motion_arm_accented_circular_loop: { lx: 3,  ly: 9,  rx: 17, ry: 9  },
};

const FALLBACK_ARMS: Record<Phase["phase_type"], ArmDef> = {
  neutral:     { lx: 6,  ly: 17, rx: 14, ry: 17 },
  pose_hold:   { lx: 3,  ly: 9,  rx: 17, ry: 9  },
  hand_motion: { lx: 2,  ly: 8,  rx: 18, ry: 15 },
};

function getArms(phase: Phase): ArmDef {
  return ARMS[phase.name] ?? FALLBACK_ARMS[phase.phase_type];
}

// Motion phases get a small arc under the arm end to suggest movement
function isMotion(phase: Phase) {
  return phase.phase_type === "hand_motion";
}

interface StickFigureProps {
  phase: Phase;
  state: "past" | "active" | "future";
}

function StickFigure({ phase, state }: StickFigureProps) {
  const { lx, ly, rx, ry } = getArms(phase);

  const color =
    state === "active" ? "#60a5fa"   // blue-400
    : state === "past" ? "#6b7280"   // gray-500
    :                    "#d1d5db";  // gray-300 (future, dimmed)

  const opacity = state === "future" ? 0.45 : 1;

  return (
    <svg
      viewBox="0 0 20 30"
      width="20"
      height="30"
      style={{ opacity }}
      aria-hidden="true"
    >
      {/* Head */}
      <circle cx="10" cy="4" r="3" stroke={color} strokeWidth="1.5" fill="none" />
      {/* Body */}
      <line x1="10" y1="7" x2="10" y2="20" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      {/* Left arm */}
      <line x1="10" y1="12" x2={lx} y2={ly} stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      {/* Right arm */}
      <line x1="10" y1="12" x2={rx} y2={ry} stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      {/* Left leg */}
      <line x1="10" y1="20" x2="6"  y2="28" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      {/* Right leg */}
      <line x1="10" y1="20" x2="14" y2="28" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      {/* Motion indicator: small arc for hand_motion phases */}
      {isMotion(phase) && state !== "past" && (
        <path
          d={`M ${rx - 2} ${ry} Q ${rx} ${ry - 3} ${rx + 2} ${ry}`}
          stroke={color}
          strokeWidth="1"
          fill="none"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}

// ── Main component ────────────────────────────────────────────────
// Only hand_motion phases render as full stick figures.
// neutral and pose_hold render as small separator dots so they don't
// look like "missed actions" to the user.

export function FlowTimeline({ phases, currentPhaseIndex }: FlowTimelineProps) {
  return (
    <div className="flex items-end gap-1 bg-black/50 backdrop-blur-sm rounded-xl px-3 pt-1 pb-1.5 border border-white/10 max-w-[min(90vw,640px)] overflow-x-auto">
      {phases.map((phase, idx) => {
        const isPast   = idx < currentPhaseIndex;
        const isActive = idx === currentPhaseIndex;

        // Neutral phases → small dot separator only
        if (phase.phase_type === "neutral") {
          return (
            <div
              key={phase.index}
              className="self-end mb-2 flex-shrink-0"
              title={phase.name.replace(/_/g, " ")}
            >
              <div
                className="w-1 h-1 rounded-full"
                style={{ backgroundColor: isPast ? "#6b7280" : "#374151" }}
              />
            </div>
          );
        }

        // hand_motion + pose_hold → full stick figure
        const state: "past" | "active" | "future" =
          isPast ? "past" : isActive ? "active" : "future";

        return (
          <div
            key={phase.index}
            className="relative flex flex-col items-center flex-shrink-0"
            title={phase.name.replace(/_/g, " ")}
          >
            <div className={`h-1 w-1 rounded-full mb-0.5 ${isActive ? "bg-blue-400" : "bg-transparent"}`} />
            <StickFigure phase={phase} state={state} />
            <div
              className="mt-0.5 h-0.5 w-full rounded-full"
              style={{
                backgroundColor: isActive ? "#60a5fa" : isPast ? "#4b5563" : "#374151",
              }}
            />
          </div>
        );
      })}
    </div>
  );
}
