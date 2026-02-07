"use client";

/**
 * Product Info Panel (Page 1 - Left)
 * Per UX Spec 3.2:
 * - Brief product description
 * - Usage summary
 * - Trust framing (camera-based, local processing)
 */
export function ProductInfo() {
  return (
    <div className="space-y-[var(--spacing-4)]">
      {/* Logo / Title */}
      <h1 className="text-3xl md:text-4xl font-bold text-white">
        Movement Coach
      </h1>

      {/* Tagline */}
      <p className="text-lg text-white/80">
        A guided movement experience for desk-bound bodies.
      </p>

      {/* Key Benefits */}
      <ul className="space-y-[var(--spacing-2)] text-sm text-white/60">
        <li className="flex items-start gap-2">
          <span className="text-[var(--color-primary)]">✓</span>
          <span>3-5 minute sessions</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="text-[var(--color-primary)]">✓</span>
          <span>Music-synchronized movements</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="text-[var(--color-primary)]">✓</span>
          <span>Real-time feedback</span>
        </li>
      </ul>

      {/* Trust Framing */}
      <div className="pt-[var(--spacing-2)] border-t border-white/10">
        <p className="text-xs text-white/40 flex items-center gap-1.5">
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
          <span>Camera-based. All processing happens locally in your browser.</span>
        </p>
      </div>
    </div>
  );
}
