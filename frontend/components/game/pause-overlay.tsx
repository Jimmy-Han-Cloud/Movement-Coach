"use client";

/**
 * Pause Overlay (Page 3 - Center)
 * Displays when game is paused
 * Shows pause icon and resume hint
 */
export function PauseOverlay() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
      <div className="bg-[var(--color-surface-elevated)] rounded-[var(--radius-2xl)] px-10 py-8 shadow-2xl text-center">
        {/* Pause Icon */}
        <div className="flex justify-center mb-4">
          <div className="flex gap-2">
            <div className="w-4 h-12 bg-white rounded-sm" />
            <div className="w-4 h-12 bg-white rounded-sm" />
          </div>
        </div>

        {/* Text */}
        <div className="text-2xl text-white font-semibold mb-2">Paused</div>
        <div className="text-sm text-white/60">Press Enter or remote confirm to resume</div>
      </div>
    </div>
  );
}
