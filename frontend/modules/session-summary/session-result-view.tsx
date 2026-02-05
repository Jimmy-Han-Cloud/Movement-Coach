"use client";

import type { Session } from "@/types";

interface SessionResultViewProps {
  session: Session;
}

const QUALITY_LABEL: Record<string, string> = {
  ok: "Completed",
  partial: "Partial",
  missed: "Missed",
};

const QUALITY_COLOR: Record<string, string> = {
  ok: "text-green-400",
  partial: "text-amber-400",
  missed: "text-red-400",
};

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}m ${s}s`;
}

export function SessionResultView({ session }: SessionResultViewProps) {
  return (
    <div className="max-w-md mx-auto p-6 space-y-6">
      <h2 className="text-xl font-semibold text-center">Session Complete</h2>

      {session.duration_actual_sec !== null && (
        <p className="text-center text-sm text-zinc-500">
          Duration: {formatDuration(session.duration_actual_sec)}
        </p>
      )}

      <div className="space-y-2">
        {session.phase_results.map((pr) => (
          <div
            key={pr.phase_index}
            className="flex items-center justify-between bg-zinc-100 dark:bg-zinc-800 rounded-lg px-4 py-2"
          >
            <span className="text-sm font-medium">{pr.phase_name}</span>
            <span className={`text-sm font-medium ${QUALITY_COLOR[pr.quality] ?? ""}`}>
              {QUALITY_LABEL[pr.quality] ?? pr.quality}
            </span>
          </div>
        ))}
      </div>

      {session.summary && (
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
          <p className="text-sm leading-relaxed">{session.summary}</p>
        </div>
      )}
    </div>
  );
}
