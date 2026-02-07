"use client";

interface CameraErrorProps {
  error: string;
  onRetry: () => void;
}

/**
 * Camera Error Overlay
 * Displays when webcam fails to initialize
 * Shows error message and retry button
 */
export function CameraError({ error, onRetry }: CameraErrorProps) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-[var(--z-overlay)]">
      <div className="bg-[var(--color-surface-elevated)] rounded-[var(--radius-2xl)] px-10 py-8 shadow-2xl text-center max-w-md">
        {/* Error Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-[var(--color-error)]/20 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-[var(--color-error)]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 3l18 18"
              />
            </svg>
          </div>
        </div>

        {/* Title */}
        <div className="text-xl text-white font-semibold mb-2">
          Camera Error
        </div>

        {/* Error Message */}
        <div className="text-sm text-white/60 mb-6">
          {error}
        </div>

        {/* Retry Button */}
        <button
          onClick={onRetry}
          className="px-6 py-3 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white font-medium rounded-[var(--radius-xl)] transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
