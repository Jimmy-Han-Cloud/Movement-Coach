"use client";

import { type ReactNode, useEffect, useCallback } from "react";
import { Button } from "../ui/button";

interface ResultModalProps {
  isOpen: boolean;
  completionPercent: number;
  onRepeat: () => void;
  onNewSong: () => void;
  onExit: () => void;
  children?: ReactNode;
}

function getEncouragement(percent: number): { emoji: string; message: string } {
  if (percent >= 90) return { emoji: "🎉", message: "Amazing! You nailed it!" };
  if (percent >= 70) return { emoji: "💪", message: "Great job! Keep it up!" };
  if (percent >= 50) return { emoji: "👍", message: "Good effort! You're improving!" };
  return { emoji: "🌱", message: "Every step counts. Try again!" };
}

export function ResultModal({ isOpen, completionPercent, onRepeat, onNewSong, onExit, children }: ResultModalProps) {
  // Keyboard mapping: ArrowLeft=Repeat, Enter/Space=New Song, ArrowRight=Exit
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isOpen) return;
    switch (e.key) {
      case "ArrowLeft":
        e.preventDefault();
        onRepeat();
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        onNewSong();
        break;
      case "ArrowRight":
        e.preventDefault();
        onExit();
        break;
    }
  }, [isOpen, onRepeat, onNewSong, onExit]);

  useEffect(() => {
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  const { emoji, message } = getEncouragement(completionPercent);

  return (
    <div className="fixed inset-0 z-[var(--z-overlay)] flex items-start justify-center pt-[20vh]">
      <div className="absolute inset-0 overlay-dim" />
      <div className="relative w-full max-w-md mx-4 bg-[var(--color-surface-elevated)]/95 backdrop-blur-lg border border-white/20 rounded-[var(--radius-2xl)] shadow-2xl dialog-enter overflow-hidden">
        <div className="p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-6">Session Complete</h2>
          <div className="relative w-32 h-32 mx-auto mb-6">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="none" stroke="var(--color-neutral-700)" strokeWidth="8" />
              <circle cx="50" cy="50" r="45" fill="none" stroke="var(--color-primary)" strokeWidth="8" strokeLinecap="round" strokeDasharray={`${completionPercent * 2.83} 283`} className="transition-all duration-1000 ease-out" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-3xl font-bold text-white">{Math.round(completionPercent)}%</span>
            </div>
          </div>
          <p className="text-lg text-white mb-2">You completed {Math.round(completionPercent)}% of the flow.</p>
          <p className="text-white/70 flex items-center justify-center gap-2">
            <span>{emoji}</span>
            <span>{message}</span>
          </p>
          {children}

          {/* Donation section */}
          <div className="mt-6 pt-5 border-t border-white/10 flex flex-col items-center gap-2">
            <p className="text-white/50 text-xs">Enjoying Movement Coach? Support the developer 💙</p>
            <img
              src="/donate-qr.svg"
              alt="PayPal donation QR code"
              className="w-28 h-28 rounded-xl opacity-90"
            />
            <p className="text-white/30 text-xs">Scan to donate via PayPal</p>
          </div>
        </div>
        <div className="flex gap-2 p-4 bg-black/30 border-t border-white/10">
          <Button variant="secondary" size="md" onClick={onRepeat} className="flex-1">Repeat</Button>
          <Button variant="primary" size="md" onClick={onNewSong} className="flex-1">New Song</Button>
          <Button variant="ghost" size="md" onClick={onExit} className="flex-1">Exit</Button>
        </div>
        <div className="px-4 py-2 bg-black/20 text-center">
          <span className="text-xs text-white/40">Remote: &lt; Repeat · ▷|| New Song · &gt; Exit</span>
        </div>
      </div>
    </div>
  );
}
