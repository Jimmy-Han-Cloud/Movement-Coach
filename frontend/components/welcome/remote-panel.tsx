"use client";

import { useState } from "react";
import { StatusBadge } from "../ui/status-badge";

interface RemotePanelProps {
  isConnected: boolean;
  pairingCode?: string;
}

export function RemotePanel({ isConnected, pairingCode }: RemotePanelProps) {
  const [legalExpanded, setLegalExpanded] = useState(false);

  return (
    <div className="space-y-[var(--spacing-4)]">
      <div className="inline-block">
        <div className="w-32 h-32 bg-white rounded-[var(--radius-lg)] p-2 mx-auto md:ml-auto md:mr-0">
          <div className="w-full h-full bg-[var(--color-neutral-200)] rounded flex items-center justify-center">
            <svg className="w-16 h-16 text-[var(--color-neutral-400)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
          </div>
        </div>
        <div className="mt-2 flex justify-center md:justify-end">
          <StatusBadge status={isConnected ? "connected" : "disconnected"} />
        </div>
        <p className="mt-2 text-xs text-white/40 text-center md:text-right">
          Scan to use phone as remote
        </p>
      </div>

      <div className="pt-[var(--spacing-2)]">
        <button
          onClick={() => setLegalExpanded(!legalExpanded)}
          className="w-full md:w-auto flex items-center justify-center md:justify-end gap-1 text-xs text-white/40 hover:text-white/60 transition-colors"
        >
          <span>Legal & Privacy</span>
          <svg className={`w-3 h-3 transition-transform ${legalExpanded ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {legalExpanded && (
          <div className="mt-2 p-3 bg-[var(--color-surface)] rounded-[var(--radius-md)] text-xs text-white/50 space-y-2">
            <p><strong>Privacy:</strong> Camera data is processed locally in your browser. No video is stored or transmitted.</p>
            <p><strong>Disclaimer:</strong> This app is for general wellness. Consult a healthcare provider before starting any exercise program.</p>
            <p className="text-white/30">© 2026 Movement Coach. All rights reserved.</p>
          </div>
        )}
      </div>
    </div>
  );
}
