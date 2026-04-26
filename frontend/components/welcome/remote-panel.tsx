"use client";

import { useState } from "react";

// Remote controller props — kept for future implementation
// import { StatusBadge } from "../ui/status-badge";
interface RemotePanelProps {
  isConnected: boolean;
  pairingCode?: string;
}

export function RemotePanel({ isConnected: _isConnected, pairingCode: _pairingCode }: RemotePanelProps) {
  const [legalExpanded, setLegalExpanded] = useState(false);

  return (
    <div className="space-y-[var(--spacing-4)]">
      {/* Donation QR — remote controller QR will go here when that feature is ready */}
      <div className="inline-block">
        <p className="mb-2 text-sm font-medium text-white/70 text-center md:text-right">
          If you enjoy this app, a small donation means a lot 💙
        </p>
        <p className="mb-3 text-xs text-white/40 text-center md:text-right">
          Scan to donate via Zelle
        </p>
        <div className="bg-white rounded-[var(--radius-lg)] p-3 mx-auto md:ml-auto md:mr-0 inline-block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/zelle-qr.jpg" alt="Zelle donation QR code" className="w-[157px] h-auto block" />
        </div>
      </div>

      <div className="pt-[var(--spacing-2)]">
        <button
          onClick={() => setLegalExpanded(!legalExpanded)}
          className="w-full md:w-auto flex items-center justify-center md:justify-end gap-1 text-xs font-bold text-red-500 hover:text-red-400 transition-colors"
        >
          <span>Legal & Privacy</span>
          <svg className={`w-3 h-3 transition-transform ${legalExpanded ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {legalExpanded && (
          <div className="mt-2 p-3 bg-[var(--color-surface)] rounded-[var(--radius-md)] text-xs text-white/50 space-y-2 text-left">
            <p><strong>Privacy:</strong> Camera data is processed locally in your browser. No video is stored or transmitted.</p>
            <p><strong>Disclaimer:</strong> This app is for general wellness. Consult a healthcare provider before starting any exercise program.</p>
            <p className="text-white/30">© 2026 Movement Coach. All rights reserved.</p>
          </div>
        )}
      </div>
    </div>
  );
}
