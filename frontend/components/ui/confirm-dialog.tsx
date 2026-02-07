"use client";

import { useEffect, useCallback } from "react";

export type DialogType = "return-to-avatar" | "end-session" | "change-song";

interface ConfirmDialogProps {
  type: DialogType;
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const dialogContent: Record<DialogType, { title: string; message: string; confirmLabel: string }> = {
  "return-to-avatar": {
    title: "Return to avatar setup?",
    message: "Your current progress will be lost.",
    confirmLabel: "Return",
  },
  "end-session": {
    title: "End session now?",
    message: "Your progress will be saved.",
    confirmLabel: "End",
  },
  "change-song": {
    title: "Switch song?",
    message: "The current session will end.",
    confirmLabel: "Switch",
  },
};

export function ConfirmDialog({ type, isOpen, onConfirm, onCancel }: ConfirmDialogProps) {
  const content = dialogContent[type];

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isOpen) return;
    switch (e.key) {
      case "Enter":
      case " ":
        onConfirm();
        e.preventDefault();
        break;
      case "ArrowLeft":
      case "Escape":
        onCancel();
        e.preventDefault();
        break;
    }
  }, [isOpen, onConfirm, onCancel]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[var(--z-dialog)] flex items-center justify-center" role="dialog" aria-modal="true" aria-labelledby="dialog-title">
      <div className="absolute inset-0 overlay-dim backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full max-w-sm mx-4 bg-[var(--color-surface-elevated)] border border-white/20 rounded-[var(--radius-2xl)] shadow-2xl dialog-enter overflow-hidden">
        <div className="p-6 text-center">
          <h2 id="dialog-title" className="text-xl font-semibold text-white mb-2">{content.title}</h2>
          <p className="text-white/70 text-sm">{content.message}</p>
        </div>
        <div className="flex border-t border-white/10">
          <button onClick={onCancel} className="flex-1 py-4 text-white/70 font-medium hover:bg-white/5 transition-colors duration-[var(--duration-fast)] border-r border-white/10">
            Cancel
          </button>
          <button onClick={onConfirm} className="flex-1 py-4 text-[var(--color-primary)] font-medium hover:bg-white/5 transition-colors duration-[var(--duration-fast)]">
            {content.confirmLabel}
          </button>
        </div>
        <div className="px-4 py-2 bg-black/30 text-center">
          <span className="text-xs text-white/40">Remote: ▷|| Confirm · &lt; Cancel</span>
        </div>
      </div>
    </div>
  );
}
