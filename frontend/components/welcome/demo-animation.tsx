"use client";

/**
 * Demo Animation Panel (Page 1 - Center)
 * Per UX Spec 3.2:
 * - Demonstrative only
 * - Preset poses + expressions
 * - Loops continuously
 * - Low visual contrast
 * - No interaction
 * - No personalization
 *
 * This is a placeholder. Will be replaced with Rive animation.
 */
export function DemoAnimation() {
  return (
    <div className="relative w-64 h-80 md:w-72 md:h-96 rounded-[var(--radius-2xl)] bg-[var(--color-surface)] border border-white/10 overflow-hidden">
      {/* Placeholder Character */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {/* Head */}
        <div
          className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-[var(--color-neutral-700)] mb-4 animate-bounce"
          style={{ animationDuration: "2s" }}
        >
          {/* Face */}
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-3xl">😊</span>
          </div>
        </div>

        {/* Body */}
        <div className="flex flex-col items-center">
          {/* Torso */}
          <div className="w-16 h-20 bg-[var(--color-neutral-700)] rounded-t-xl" />

          {/* Arms - simplified without custom animation */}
          <div className="absolute top-[45%] w-full flex justify-center gap-24">
            <div className="w-6 h-16 bg-[var(--color-neutral-600)] rounded-full -rotate-45 origin-top animate-pulse" />
            <div className="w-6 h-16 bg-[var(--color-neutral-600)] rounded-full rotate-45 origin-top animate-pulse" />
          </div>
        </div>

        {/* Label */}
        <div className="absolute bottom-4 text-xs text-white/30 text-center">
          Demo character
          <br />
          <span className="text-[10px]">(Rive animation coming)</span>
        </div>
      </div>
    </div>
  );
}
