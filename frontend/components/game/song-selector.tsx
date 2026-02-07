"use client";

import { Dropdown, ProgressBar } from "../ui";

export interface Song {
  id: string;
  name: string;
  artist: string;
  durationSec: number;
}

interface SongSelectorProps {
  songs: Song[];
  currentSongId: string;
  onSongChange: (songId: string) => void;
  progress: number; // 0-100
  disabled?: boolean;
  visible?: boolean;
}

/**
 * Song Selector (Page 3 - Top Left)
 * Per UX Spec 5.3:
 * - Visible in Idle state only
 * - Hidden during Playing
 * - Dropdown for song selection
 * - Progress bar shows flow completion
 */
export function SongSelector({
  songs,
  currentSongId,
  onSongChange,
  progress,
  disabled = false,
  visible = true,
}: SongSelectorProps) {
  if (!visible) return null;

  const currentSong = songs.find((s) => s.id === currentSongId);

  const dropdownOptions = songs.map((song) => ({
    value: song.id,
    label: `${song.name} - ${song.artist}`,
  }));

  return (
    <div className="space-y-3">
      {/* Song Dropdown */}
      <Dropdown
        options={dropdownOptions}
        value={currentSongId}
        onChange={onSongChange}
        disabled={disabled}
        renderTrigger={({ label, isOpen }) => (
          <button
            className={`
              flex items-center gap-2
              px-4 py-2
              bg-black/60 backdrop-blur-sm
              border border-white/20
              rounded-[var(--radius-lg)]
              text-left
              transition-all duration-[var(--duration-fast)]
              ${disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-black/70 cursor-pointer"}
            `}
          >
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
                {currentSong?.name || "Select a song"}
              </div>
              {currentSong && (
                <div className="text-xs text-white/50 truncate">
                  {currentSong.artist}
                </div>
              )}
            </div>

            {/* Dropdown Arrow */}
            <svg
              className={`w-4 h-4 text-white/50 transition-transform ${
                isOpen ? "rotate-180" : ""
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
        )}
      />

      {/* Progress Bar */}
      <div className="w-48">
        <ProgressBar
          value={progress}
          size="sm"
          variant={progress >= 90 ? "success" : "default"}
        />
        <div className="mt-1 text-xs text-white/50">
          Flow Progress
        </div>
      </div>
    </div>
  );
}
