"use client";

import { useState, useEffect } from "react";
import { Card } from "../ui/card";

interface TipBoxProps {
  message: string;
  autoDismissAfter?: number; // ms, 0 = no auto dismiss
  onDismiss?: () => void;
}

/**
 * Tip Box (Page 2 - Top Left)
 * Per UX Spec 4.2:
 * - Top-left floating
 * - Auto-dismiss after first successful generation
 */
export function TipBox({
  message,
  autoDismissAfter = 0,
  onDismiss,
}: TipBoxProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (autoDismissAfter > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        onDismiss?.();
      }, autoDismissAfter);
      return () => clearTimeout(timer);
    }
  }, [autoDismissAfter, onDismiss]);

  if (!isVisible) return null;

  return (
    <Card
      variant="glass"
      padding="sm"
      className="max-w-xs animate-in fade-in slide-in-from-top-2 duration-300"
    >
      <div className="flex items-start gap-2">
        {/* Info Icon */}
        <div className="flex-shrink-0 mt-0.5">
          <svg
            className="w-4 h-4 text-[var(--color-primary)]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        {/* Message */}
        <p className="text-sm text-white/80">{message}</p>

        {/* Dismiss Button */}
        <button
          onClick={() => {
            setIsVisible(false);
            onDismiss?.();
          }}
          className="flex-shrink-0 text-white/40 hover:text-white/60 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </Card>
  );
}
