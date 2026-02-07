"use client";

import { useEffect, useRef } from "react";

export interface Song {
  id: string;
  name: string;
  artist: string;
  durationSec: number;
  previewUrl?: string;
}

interface SongCarouselProps {
  songs: Song[];
  currentIndex: number;
  visible?: boolean;
}

/**
 * Song Carousel (Page 2 - Center)
 * Per UX Spec 4.3:
 * - Display-only: shows current song info
 * - ◀/▶ navigation handled by external GestureButtons
 * - Confirmation handled by external GoBubble
 */
export function SongCarousel({
  songs,
  currentIndex,
  visible = true,
}: SongCarouselProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const currentSong = songs[currentIndex] || songs[0];

  // Audio preview management
  useEffect(() => {
    if (!visible) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      return;
    }

    // Create audio element if needed
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.volume = 0.65; // 65% volume for preview
      audioRef.current.loop = true;
    }

    // Simulate audio preview (replace with actual audio in production)
    console.log(`[Audio Preview] Playing: ${currentSong.name}`);

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [visible, currentSong]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  if (!visible) return null;

  return (
    <div className="absolute bottom-[calc(var(--spacing-8)+80px)] left-0 right-0 px-4 z-[var(--z-floating)] animate-in slide-in-from-bottom duration-300">
      <div className="max-w-sm mx-auto bg-black/60 backdrop-blur-md border border-white/10 rounded-[var(--radius-2xl)] p-[var(--spacing-4)]">
        {/* Song Info */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            {/* Music Icon */}
            <svg className="w-5 h-5 text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
            <span className="text-white font-semibold text-lg">{currentSong.name}</span>
          </div>
          <div className="text-sm text-white/50 mb-3">
            {currentSong.artist} • {Math.floor(currentSong.durationSec / 60)}:{(currentSong.durationSec % 60).toString().padStart(2, "0")}
          </div>

          {/* Song Index Indicator */}
          <div className="flex justify-center gap-1.5">
            {songs.map((song, idx) => (
              <div
                key={song.id}
                className={`h-1.5 rounded-full transition-all ${idx === currentIndex ? "bg-[var(--color-primary)] w-4" : "bg-white/30 w-1.5"}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
