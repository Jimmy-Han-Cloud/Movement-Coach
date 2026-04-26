"use client";

/* eslint-disable @next/next/no-img-element */

export interface CharacterOption {
  id: string;
  name: string;
  description: string;
  available: boolean;
  rivSrc?: string;           // path to .riv file for this character
  imageSrc?: string;         // shown as thumbnail when available=true
  placeholderColor?: string; // used when available=false
}

interface CharacterCarouselProps {
  characters: CharacterOption[];
  currentIndex: number;
  visible?: boolean;
}

/**
 * Character Carousel (Avatar Setup Page)
 * One character at a time; ◀/▶ navigation via GestureButtons or arrow keys.
 * Press Enter/Space to confirm selection.
 */
export function CharacterCarousel({
  characters,
  currentIndex,
  visible = true,
}: CharacterCarouselProps) {
  if (!visible) return null;

  const character = characters[currentIndex] ?? characters[0];

  return (
    <div className="absolute bottom-[calc(var(--spacing-8)+80px)] left-0 right-0 px-4 z-[var(--z-floating)] animate-in slide-in-from-bottom duration-300">
      <div className="max-w-sm mx-auto bg-black/60 backdrop-blur-md border border-white/10 rounded-[var(--radius-2xl)] p-[var(--spacing-4)]">

        {/* Character preview */}
        {character.available ? (
          /* Real character — Rive coach is already visible on screen */
          <div className="text-center py-2">
            <div className="w-12 h-12 rounded-full bg-[var(--color-primary)]/30 border border-[var(--color-primary)]/50 flex items-center justify-center mx-auto mb-2">
              <svg className="w-6 h-6 text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <p className="text-white font-semibold text-base">{character.name}</p>
            <p className="text-white/50 text-sm mt-0.5">{character.description}</p>
            <p className="text-[var(--color-primary)] text-xs mt-2">Press Enter to select ↵</p>
          </div>
        ) : (
          /* Placeholder character */
          <div className="text-center py-2">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2 opacity-60"
              style={{ backgroundColor: character.placeholderColor ?? "#888" }}
            >
              <span className="text-white text-lg font-bold">?</span>
            </div>
            <p className="text-white/40 font-semibold text-base">{character.name}</p>
            <p className="text-white/30 text-sm mt-0.5">{character.description}</p>
            <p className="text-white/20 text-xs mt-2">Not available yet</p>
          </div>
        )}

        {/* Dot indicator */}
        <div className="flex justify-center gap-1.5 mt-3">
          {characters.map((c, idx) => (
            <div
              key={c.id}
              className={`h-1.5 rounded-full transition-all ${
                idx === currentIndex
                  ? "bg-[var(--color-primary)] w-4"
                  : "bg-white/30 w-1.5"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
