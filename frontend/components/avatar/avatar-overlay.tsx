"use client";

interface AvatarOverlayProps {
  avatarUrl: string | null;
  isLocked: boolean;
  pageType: "setup" | "game";
}

export function AvatarOverlay({
  avatarUrl,
  isLocked,
  pageType,
}: AvatarOverlayProps) {
  if (!avatarUrl) {
    return (
      <div className="flex flex-col items-center justify-center">
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-white/10 border-2 border-dashed border-white/20 flex items-center justify-center">
            <span className="text-white/30 text-xs">Head</span>
          </div>
          <div className="w-32 h-48 mt-2 rounded-t-3xl bg-white/10 border-2 border-dashed border-white/20 flex items-center justify-center">
            <span className="text-white/30 text-xs text-center">
              Generate avatar<br />to preview
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center">
      <div className={`relative transition-all duration-[var(--duration-normal)] ${isLocked ? "ring-2 ring-[var(--color-success)] ring-offset-2 ring-offset-transparent" : ""}`}>
        <div className="w-64 h-80 rounded-3xl bg-gradient-to-b from-[var(--color-primary)]/30 to-[var(--color-primary)]/10 border border-white/20 flex flex-col items-center justify-center overflow-hidden">
          <div className="w-20 h-20 rounded-full bg-[var(--color-neutral-300)] mb-2 flex items-center justify-center" style={{ transform: "scale(1.2)" }}>
            <span className="text-4xl">😊</span>
          </div>
          <div className="text-center text-white/50 text-sm mt-4">
            <p>Avatar Preview</p>
            <p className="text-xs text-white/30 mt-1">{isLocked ? "Locked ✓" : "Not locked"}</p>
          </div>
        </div>
        {isLocked && (
          <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-[var(--color-success)] flex items-center justify-center shadow-[var(--shadow-glow-success)]">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
}
