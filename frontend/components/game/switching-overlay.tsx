"use client";

/**
 * Switching Overlay (Page 3 - Center)
 * Per UX Spec 5.2:
 * - Transitional state
 * - Displays "Switching..."
 * - All inputs temporarily disabled
 */
export function SwitchingOverlay() {
  return (
    <div className="overlay-dim absolute inset-0 flex items-center justify-center">
      <div className="bg-[var(--color-surface-elevated)] rounded-[var(--radius-2xl)] px-8 py-6 shadow-2xl">
        <div className="flex items-center gap-4">
          {/* Spinner */}
          <div className="w-8 h-8 border-3 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />

          {/* Text */}
          <span className="text-xl text-white font-medium">Switching...</span>
        </div>
      </div>
    </div>
  );
}
