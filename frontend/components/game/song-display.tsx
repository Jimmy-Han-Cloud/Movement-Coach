"use client";

interface Song {
  id: string;
  name: string;
  artist: string;
  durationSec: number;
}

interface SongDisplayProps {
  song: Song;
  progress?: number; // unused — kept for API compat
}

/**
 * Song Display (Page 3 - Top Left)
 * Per UX Spec 5.3 (Updated):
 * - Display-only label
 * - Shows locked song name
 * - No dropdown, no gesture interaction
 * - Progress bar shows flow completion
 */
export function SongDisplay({ song }: SongDisplayProps) {
  return (
    <div>
      {/* Song Info - Display Only */}
      <div className="flex items-center gap-2 px-4 py-2 bg-black/60 backdrop-blur-sm border border-white/20 rounded-[var(--radius-lg)]">
        {/* Music Icon */}
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
            d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
          />
        </svg>

        {/* Song Info */}
        <div className="flex-1 min-w-0">
          <div className="text-sm text-white font-medium truncate">
            {song.name}
          </div>
          <div className="text-xs text-white/50 truncate">
            {song.artist}
          </div>
        </div>

        {/* Locked Icon */}
        <svg
          className="w-4 h-4 text-white/30"
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
      </div>
    </div>
  );
}
