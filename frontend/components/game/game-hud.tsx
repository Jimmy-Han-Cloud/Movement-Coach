"use client";

import { StatusBadge, type StatusType } from "../ui";

type GameState = "idle" | "playing" | "paused" | "switching";

interface GameHudProps {
  state: GameState;
  elapsedTime: number;
  totalDuration: number;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

/**
 * Game HUD (Page 3 - Top Right)
 * Shows current game state and timing info
 */
export function GameHud({ state, elapsedTime, totalDuration }: GameHudProps) {
  const statusMap: Record<GameState, StatusType> = {
    idle: "idle",
    playing: "playing",
    paused: "paused",
    switching: "switching",
  };

  return (
    <div className="flex flex-col items-end gap-2">
      {/* Status Badge */}
      <StatusBadge status={statusMap[state]} />

      {/* Timer (only show when not idle) */}
      {state !== "idle" && (
        <div className="bg-black/60 backdrop-blur-sm rounded-[var(--radius-md)] px-3 py-1.5">
          <span className="text-sm text-white font-mono">
            {formatTime(elapsedTime)} / {formatTime(totalDuration)}
          </span>
        </div>
      )}
    </div>
  );
}
