"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CameraLayout } from "@/components/layouts";
import { SongCarousel, type Song } from "@/components/avatar";
import { GestureButton, GoBubble, CameraError } from "@/components/ui";
import { RiveCoach } from "@/components/avatar/rive-coach";
import { CharacterCarousel, type CharacterOption } from "@/components/avatar";
import { useWebcam } from "@/lib/use-webcam";
import { usePoseValidation } from "@/modules/pose-validation";
import { useCheckmarkGesture } from "@/lib/use-checkmark-gesture";
import { generateFlowForSong, saveActiveFlow, saveActiveAudioUrl, saveActiveSong, buildFallbackFlow, saveFlowForSong, loadFlowForSong } from "@/lib/api/flows";
import { saveCoachRiv } from "@/lib/api/avatar";
import { triggerBurst, startRain, stopRain } from "@/lib/sakura-burst";
import { analyzeAudio, type AudioFeatures } from "@/lib/analyze-audio";

/**
 * Page 2 State Machine:
 * selecting-character → selecting-song → locked → navigate
 *
 * selecting-character:
 *   - Rive coach visible, no card UI
 *   - Click avatar or press Enter to confirm and enter song selection
 *
 * selecting-song:
 *   - Song carousel visible (preset songs + "Upload Music" option)
 *   - Left/Right keys navigate songs
 *   - GoBubble (or Enter) to start
 */
type AvatarState = "selecting-character" | "selecting-song" | "locked";

// ── Character roster ──────────────────────────────────────────────

const CHARACTERS: CharacterOption[] = [
  { id: "coach-1", name: "Coach 1", description: "Original coach",  available: true, rivSrc: "/animations/coach.riv"   },
  { id: "coach-2", name: "Coach 2", description: "New coach style", available: true, rivSrc: "/animations/coach_2.riv" },
  { id: "coach-3", name: "Coach 3", description: "New coach style", available: true, rivSrc: "/animations/coach_3.riv" },
];

// ── Pose validation params (module-level so reference is stable across renders) ──

const AVATAR_USER_PARAMS = {
  pose_hold_duration: 2.0,
  positional_tolerance: 0.5,
  elbow_participation_threshold: 0.4,
  hand_motion_tempo: 1.0,
};

// ── Preset audio paths ────────────────────────────────────────────

const PRESET_AUDIO_MAP: Record<string, string> = {
  "song-1": "/audio/mozart_minuet.mp3",
  "song-2": "/audio/turkish_march.mp3",
  "song-3": "/audio/vivaldi_spring.mp3",
};

// ── Song list (preset + upload slot) ─────────────────────────────

const UPLOAD_SONG_ID = "song-upload";

const PRESET_SONGS: Song[] = [
  { id: "song-1",        name: "Mozart Minuet",   artist: "W.A. Mozart",  durationSec: 258 },
  { id: "song-2",        name: "Turkish March",   artist: "W.A. Mozart",  durationSec: 175 },
  { id: "song-3",        name: "Vivaldi Spring",  artist: "A. Vivaldi",   durationSec: 215 },
  { id: UPLOAD_SONG_ID,  name: "Upload Music",    artist: "Your choice",  durationSec: 0   },
];

/** Detect duration of an audio File via a temporary Audio element. */
function detectAudioDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const audio = new Audio(url);
    audio.addEventListener("loadedmetadata", () => {
      resolve(Math.round(audio.duration));
      URL.revokeObjectURL(url);
    });
    audio.addEventListener("error", () => { resolve(180); URL.revokeObjectURL(url); });
  });
}

export default function AvatarSetupPage() {
  const router = useRouter();
  const webcam = useWebcam();

  const [avatarState, setAvatarState]         = useState<AvatarState>("selecting-character");
  const [currentCharacterIndex, setCurrentCharacterIndex] = useState(0);
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [checkConfirmed, setCheckConfirmed]     = useState(false);

  // ── Upload state ────────────────────────────────────────────────
  const [uploadedFile, setUploadedFile]         = useState<File | null>(null);
  const [uploadedBlobUrl, setUploadedBlobUrl]   = useState<string | null>(null);
  const [uploadedDuration, setUploadedDuration] = useState(0);
  const [uploadedFeatures, setUploadedFeatures] = useState<AudioFeatures | null>(null);
  const [analyzingAudio, setAnalyzingAudio]     = useState(false);
  const analysisPromiseRef = useRef<Promise<AudioFeatures | null>>(Promise.resolve(null));
  const fileInputRef  = useRef<HTMLInputElement>(null);
  const goBubbleRef   = useRef<HTMLDivElement>(null);

  // Blob URL is revoked in handleFileChange when a new file replaces it.
  // Do NOT revoke on unmount — game page needs the URL to play audio.

  // ── Audio preview (preset songs only) ──────────────────────────
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (avatarState !== "selecting-song") {
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
        previewAudioRef.current.src = "";
        previewAudioRef.current = null;
      }
      return;
    }

    const song = PRESET_SONGS[currentSongIndex];
    if (song.id === UPLOAD_SONG_ID) {
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
        previewAudioRef.current.src = "";
        previewAudioRef.current = null;
      }
      return;
    }

    const audioPath = PRESET_AUDIO_MAP[song.id];
    if (!audioPath) return;

    // Stop previous preview
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current.src = "";
    }

    const audio = new Audio(audioPath);
    audio.volume = 0.4;
    audio.currentTime = 10;
    audio.play().catch(() => {/* autoplay blocked — silently ignore */});
    previewAudioRef.current = audio;

    const stopTimer = setTimeout(() => {
      audio.pause();
      audio.src = "";
    }, 15000);

    return () => {
      clearTimeout(stopTimer);
      audio.pause();
      audio.src = "";
    };
  }, [currentSongIndex, avatarState]);

  // Unmount cleanup (in case component unmounts mid-preview)
  useEffect(() => {
    return () => {
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
        previewAudioRef.current.src = "";
      }
    };
  }, []);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (uploadedBlobUrl) URL.revokeObjectURL(uploadedBlobUrl);
    const blobUrl  = URL.createObjectURL(file);
    const duration = await detectAudioDuration(file);

    setUploadedFile(file);
    setUploadedBlobUrl(blobUrl);
    setUploadedDuration(duration);
    setUploadedFeatures(null);

    // Update the upload slot name to the actual file name (without extension)
    const name = file.name.replace(/\.[^.]+$/, "");
    PRESET_SONGS[PRESET_SONGS.length - 1] = {
      id: UPLOAD_SONG_ID,
      name,
      artist: "Uploaded",
      durationSec: duration,
    };

    // Analyze audio features in the background (BPM + energy)
    setAnalyzingAudio(true);
    const promise = analyzeAudio(blobUrl)
      .then((features) => { setUploadedFeatures(features); return features; })
      .catch((err) => { console.warn("Audio analysis failed:", err); return null; })
      .finally(() => setAnalyzingAudio(false));
    analysisPromiseRef.current = promise;
  }, [uploadedBlobUrl]);

  // ── Pose detection ──────────────────────────────────────────────

  const pose = usePoseValidation({
    videoRef: webcam.videoRef,
    userParams: AVATAR_USER_PARAMS,
    currentPhase: null,
    phaseElapsed: 0,
    onValidation: () => {},
  });

  const handPositionsRef = useRef<{ x: number; y: number }[]>([]);
  handPositionsRef.current = (() => {
    const pts = pose.trackedPointsRef.current;
    if (!pts) return [];
    const out: { x: number; y: number }[] = [];
    if (pts.left_hand && pts.left_elbow) {
      const w = pts.left_hand, e = pts.left_elbow;
      out.push({ x: w.x + (w.x - e.x) * 0.4, y: w.y + (w.y - e.y) * 0.4 });
    }
    if (pts.right_hand && pts.right_elbow) {
      const w = pts.right_hand, e = pts.right_elbow;
      out.push({ x: w.x + (w.x - e.x) * 0.4, y: w.y + (w.y - e.y) * 0.4 });
    }
    return out;
  })();

  const headY = pose.trackedPoints?.head?.y;
  const shoulderY =
    pose.trackedPoints?.left_shoulder && pose.trackedPoints?.right_shoulder
      ? (pose.trackedPoints.left_shoulder.y + pose.trackedPoints.right_shoulder.y) / 2
      : undefined;

  const shoulderWidthPx = (() => {
    const ls = pose.trackedPoints?.left_shoulder;
    const rs = pose.trackedPoints?.right_shoulder;
    if (!ls || !rs) return undefined;
    const screenW = typeof window !== "undefined" ? window.innerWidth : 1280;
    return Math.abs(rs.x - ls.x) * screenW;
  })();

  // Start webcam on mount
  const hasStartedRef = useRef(false);
  if (!hasStartedRef.current && typeof window !== "undefined") {
    hasStartedRef.current = true;
    webcam.start();
  }

  // ── Character confirm ────────────────────────────────────────────

  const handlePrevCharacter = useCallback(() => {
    setCurrentCharacterIndex((i) => (i <= 0 ? CHARACTERS.length - 1 : i - 1));
  }, []);

  const handleNextCharacter = useCallback(() => {
    setCurrentCharacterIndex((i) => (i >= CHARACTERS.length - 1 ? 0 : i + 1));
  }, []);

  const handleConfirmCharacter = useCallback(() => {
    if (avatarState !== "selecting-character") return;
    const selected = CHARACTERS[currentCharacterIndex];
    saveCoachRiv(selected.rivSrc ?? "/animations/coach.riv");
    setCheckConfirmed(true);
    setTimeout(() => {
      setCheckConfirmed(false);
      setAvatarState("selecting-song");
    }, 600);
  }, [avatarState, currentCharacterIndex]);

  // Gesture detection disabled — character is now confirmed via Enter key or avatar click.
  // Keep this hook available for future re-activation.
  useCheckmarkGesture({
    handPositions: [],
    onDetected: handleConfirmCharacter,
    enabled: false,
  });

  // ── Song navigation ─────────────────────────────────────────────

  const handlePrevSong = useCallback(() => {
    setCurrentSongIndex((i) => (i <= 0 ? PRESET_SONGS.length - 1 : i - 1));
  }, []);

  const handleNextSong = useCallback(() => {
    setCurrentSongIndex((i) => (i >= PRESET_SONGS.length - 1 ? 0 : i + 1));
  }, []);

  // ── Lock + generate flow + navigate ────────────────────────────

  const handleLockAndStart = useCallback(async () => {
    if (avatarState !== "selecting-song") return;

    const selectedSong = PRESET_SONGS[currentSongIndex];

    // Upload slot: require a file first
    if (selectedSong.id === UPLOAD_SONG_ID) {
      if (!uploadedFile || !uploadedBlobUrl) {
        fileInputRef.current?.click();
        return;
      }
    }

    setAvatarState("locked");

    // Burst from Go bubble position, then start rain after 3s
    const rect = goBubbleRef.current?.getBoundingClientRect();
    const burstX = rect ? rect.left + rect.width  / 2 : window.innerWidth  * 0.9;
    const burstY = rect ? rect.top  + rect.height / 2 : window.innerHeight * 0.5;
    triggerBurst(burstX, burstY);
    const rainTimeout = setTimeout(startRain, 3000);

    // Stop any playing preview
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current.src = "";
      previewAudioRef.current = null;
    }

    // Determine audio URL
    const audioUrl =
      selectedSong.id === UPLOAD_SONG_ID
        ? uploadedBlobUrl!
        : PRESET_AUDIO_MAP[selectedSong.id] ?? "";

    // Use actual duration for upload, preset duration otherwise
    const durationSec =
      selectedSong.id === UPLOAD_SONG_ID ? uploadedDuration : selectedSong.durationSec;

    // Save audio URL and song metadata for game page
    if (audioUrl) saveActiveAudioUrl(audioUrl);
    saveActiveSong({ name: selectedSong.name, artist: selectedSong.artist, durationSec });

    const isUpload = selectedSong.id === UPLOAD_SONG_ID;

    // Preset songs: flow is pre-seeded in Firestore — just pass song_id, no analysis needed.
    // Uploaded songs: await analysis if still running (cherry blossom rain covers the wait).
    const audioFeatures = isUpload
      ? ((await analysisPromiseRef.current) ?? undefined)
      : undefined;
    const songId = isUpload ? undefined : selectedSong.id;

    // Preset songs: check sessionStorage before hitting the network.
    const cachedFlow = songId ? loadFlowForSong(songId) : null;

    const flowPromise = cachedFlow
      ? Promise.resolve(cachedFlow)
      : generateFlowForSong(
          selectedSong.name,
          selectedSong.artist,
          durationSec,
          audioFeatures,
          songId,
        ).then((flow) => {
          if (songId) saveFlowForSong(songId, flow);
          return flow;
        }).catch((err) => {
          console.warn("Backend unavailable, using built-in flow:", err);
          return buildFallbackFlow(selectedSong.name, durationSec || 180);
        });

    const [flow] = await Promise.all([
      flowPromise,
      new Promise<void>((r) => setTimeout(r, 2000)),
    ]);

    saveActiveFlow(flow);
    clearTimeout(rainTimeout);
    stopRain();
    router.push(`/game?songId=${selectedSong.id}`);
  }, [avatarState, currentSongIndex, uploadedFile, uploadedBlobUrl, uploadedDuration, uploadedFeatures, router]);

  // ── Button configs ──────────────────────────────────────────────

  const getLeftButton = () => {
    switch (avatarState) {
      case "selecting-character":
        return { label: "◀", onTrigger: handlePrevCharacter, disabled: CHARACTERS.length <= 1 };
      case "selecting-song":
        return { label: "◀", onTrigger: handlePrevSong, disabled: false };
      case "locked":
        return { label: "◀", onTrigger: () => {}, disabled: true };
    }
  };

  const getRightButton = () => {
    switch (avatarState) {
      case "selecting-character":
        return { label: "▶", onTrigger: handleNextCharacter, disabled: CHARACTERS.length <= 1 };
      case "selecting-song":
        return { label: "▶", onTrigger: handleNextSong, disabled: false };
      case "locked":
        return { label: "▶", onTrigger: () => {}, disabled: true };
    }
  };

  const leftBtn  = getLeftButton();
  const rightBtn = getRightButton();

  const isUploadSlot = avatarState === "selecting-song" &&
    PRESET_SONGS[currentSongIndex].id === UPLOAD_SONG_ID;

  // GoBubble disabled for upload slot until a file has been picked
  const goBubbleDisabled = avatarState !== "selecting-song" ||
    (isUploadSlot && !uploadedFile);

  // ── Keyboard controls ───────────────────────────────────────────

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      switch (avatarState) {
        case "selecting-character":
          if (e.key === "ArrowLeft")               { e.preventDefault(); handlePrevCharacter(); }
          else if (e.key === "ArrowRight")          { e.preventDefault(); handleNextCharacter(); }
          else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleConfirmCharacter(); }
          break;
        case "selecting-song":
          if (e.key === "ArrowLeft")                    { e.preventDefault(); handlePrevSong(); }
          else if (e.key === "ArrowRight")              { e.preventDefault(); handleNextSong(); }
          else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleLockAndStart(); }
          break;
        case "locked":
          break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [avatarState, handlePrevCharacter, handleNextCharacter, handleConfirmCharacter, handlePrevSong, handleNextSong, handleLockAndStart]);

  // ── Render ──────────────────────────────────────────────────────

  return (
    <>
      {/* Hidden file input for music upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        className="hidden"
        onChange={handleFileChange}
      />

      <CameraLayout
        videoRef={webcam.videoRef}
        pageType="avatar-setup"
        headY={headY}
        shoulderY={shoulderY}
        avatarOverlay={
          avatarState === "selecting-character" ? (
            <div
              className="pointer-events-auto cursor-pointer w-full h-full flex items-center justify-center"
              onClick={handleConfirmCharacter}
            >
              <RiveCoach
                key={CHARACTERS[currentCharacterIndex].id}
                animationName="idle"
                rivSrc={CHARACTERS[currentCharacterIndex].rivSrc}
                shoulderWidthPx={shoulderWidthPx}
                shoulderY={shoulderY}
              />
            </div>
          ) : (
            <RiveCoach
              animationName="idle"
              rivSrc={CHARACTERS[currentCharacterIndex].rivSrc}
              shoulderWidthPx={shoulderWidthPx}
              shoulderY={shoulderY}
            />
          )
        }
        topRight={
          avatarState === "selecting-character" && (
            <div className="text-white/60 text-sm bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-full">
              {checkConfirmed ? "✓ Confirmed!" : "Click avatar or press Enter"}
            </div>
          )
        }
        bottomOverlay={
          <div className="flex justify-between items-end px-4">
            <GestureButton
              onTrigger={leftBtn.onTrigger}
              disabled={leftBtn.disabled}
              variant="secondary"
              position="left"
            >
              {leftBtn.label}
            </GestureButton>

            <GestureButton
              onTrigger={rightBtn.onTrigger}
              disabled={rightBtn.disabled}
              variant="primary"
              position="right"
            >
              {rightBtn.label}
            </GestureButton>
          </div>
        }
        centerOverlay={
          avatarState === "locked" ? (
            <div className="bg-black/70 backdrop-blur-sm rounded-2xl px-8 py-5 text-center">
              <div className="text-white text-lg font-semibold mb-1">Get ready!</div>
              <div className="text-white/60 text-sm">Preparing your session…</div>
            </div>
          ) : undefined
        }
      >
        {/* Character carousel — shown during character selection */}
        <CharacterCarousel
          characters={CHARACTERS}
          currentIndex={currentCharacterIndex}
          visible={avatarState === "selecting-character"}
        />

        {/* GoBubble — absolutely positioned: diagonally above the right nav button */}
        {avatarState === "selecting-song" && (
          <div
            ref={goBubbleRef}
            className="absolute z-[var(--z-floating)] pointer-events-auto"
            style={{ right: "21%", top: "33%" }}
          >
            <GoBubble
              onTrigger={handleLockAndStart}
              handPositionsRef={handPositionsRef}
              disabled={goBubbleDisabled}
              className="!mr-0"
            />
          </div>
        )}

        {/* Song carousel */}
        <SongCarousel
          songs={PRESET_SONGS}
          currentIndex={currentSongIndex}
          visible={avatarState === "selecting-song" || avatarState === "locked"}
        />

        {/* Upload prompt — shown when upload slot is selected and no file yet */}
        {isUploadSlot && !uploadedFile && (
          <div className="absolute bottom-[calc(var(--spacing-8)+220px)] left-0 right-0 flex justify-center z-[var(--z-floating)]">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-[var(--color-primary)] hover:bg-blue-400 text-white font-semibold px-6 py-2.5 rounded-full text-sm transition-colors shadow-lg"
            >
              Browse file…
            </button>
          </div>
        )}

        {/* Upload ready indicator — file picked, show name + duration + analysis */}
        {isUploadSlot && uploadedFile && (
          <div className="absolute bottom-[calc(var(--spacing-8)+220px)] left-0 right-0 flex justify-center z-[var(--z-floating)]">
            <div className="flex items-center gap-2 bg-green-500/20 border border-green-500/40 text-green-300 text-sm px-4 py-2 rounded-full">
              <span>✓</span>
              <span className="max-w-[200px] truncate">{uploadedFile.name}</span>
              <span className="text-green-400/70">
                {Math.floor(uploadedDuration / 60)}:{String(uploadedDuration % 60).padStart(2, "0")}
              </span>
              {analyzingAudio && (
                <span className="text-yellow-400/80 text-xs">analyzing…</span>
              )}
              {!analyzingAudio && uploadedFeatures && (
                <span className="text-green-400/70 text-xs">{uploadedFeatures.bpm} BPM</span>
              )}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-green-400/70 hover:text-green-300 ml-1 text-xs"
              >
                change
              </button>
            </div>
          </div>
        )}
      </CameraLayout>

      {webcam.error && (
        <CameraError error={webcam.error} onRetry={webcam.retry} />
      )}
    </>
  );
}
