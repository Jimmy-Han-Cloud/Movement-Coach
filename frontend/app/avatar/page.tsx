"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CameraLayout } from "@/components/layouts";
import { SongCarousel, type Song } from "@/components/avatar";
import { GestureButton, GoBubble, CameraError } from "@/components/ui";
import { RiveCoach } from "@/components/avatar/rive-coach";
import { useWebcam } from "@/lib/use-webcam";
import { usePoseValidation } from "@/modules/pose-validation";
import { useCheckmarkGesture } from "@/lib/use-checkmark-gesture";
import { generateFlowForSong, saveActiveFlow, saveActiveAudioUrl, buildFallbackFlow } from "@/lib/api/flows";
import { analyzeAudio, type AudioFeatures } from "@/lib/analyze-audio";

/**
 * Page 2 State Machine:
 * selecting-character → selecting-song → locked → navigate
 *
 * selecting-character:
 *   - Rive coach visible, no card UI
 *   - Draw ✓ in the air to confirm and enter song selection
 *
 * selecting-song:
 *   - Song carousel visible (preset songs + "Upload Music" option)
 *   - Left/Right keys navigate songs
 *   - GoBubble (or Enter) to start
 */
type AvatarState = "selecting-character" | "selecting-song" | "locked";

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

// ── Sakura rain data ──────────────────────────────────────────────

const SAKURA_COLORS = [
  "#ffd1dc", "#ffb7c5", "#ff8fab", "#f9c0cb",
  "#ffe4e8", "#ffc8d8", "#ff85a1", "#ffdde5", "#ffaec0",
];

const SAKURA_RAIN_PETALS: Array<{
  left: number; dur: number; delay: number;
  drift: number; rot: number;
  w: number; h: number; color: string;
}> = Array.from({ length: 60 }, (_, i) => ({
  left:  (i * 37 + 13) % 100,                           // 0–100 vw, spread evenly
  dur:   2000 + ((i * 53) % 1501),                      // 2000–3500 ms
  delay: (i * 79) % 2001,                               // 0–2000 ms
  drift: ((i * 31) % 81) - 40,                          // -40 to +40 px
  rot:   ((i * 113) % 721) - 360,                       // -360 to +360 deg
  w:     8 + (i % 3) * 5,                               // 8, 13, or 18 px
  h:     5 + (i % 3) * 3,                               // 5,  8, or 11 px
  color: SAKURA_COLORS[i % SAKURA_COLORS.length],
}));

/** Full-screen cherry blossom rain shown during the "locked" transition. */
function SakuraRainOverlay() {
  return (
    <div className="fixed inset-0 z-50 pointer-events-none overflow-hidden">
      {SAKURA_RAIN_PETALS.map((p, i) => (
        <div
          key={i}
          className="sakura-fall-petal absolute"
          style={{
            left:            `${p.left}vw`,
            top:             0,
            width:           `${p.w}px`,
            height:          `${p.h}px`,
            borderRadius:    "50%",
            backgroundColor: p.color,
            "--fall-drift":  `${p.drift}px`,
            "--fall-rot":    `${p.rot}deg`,
            "--fall-dur":    `${p.dur}ms`,
            animationDelay:  `${p.delay}ms`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}

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

  const [avatarState, setAvatarState]   = useState<AvatarState>("selecting-character");
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [checkConfirmed, setCheckConfirmed]     = useState(false);

  // ── Upload state ────────────────────────────────────────────────
  const [uploadedFile, setUploadedFile]         = useState<File | null>(null);
  const [uploadedBlobUrl, setUploadedBlobUrl]   = useState<string | null>(null);
  const [uploadedDuration, setUploadedDuration] = useState(0);
  const [uploadedFeatures, setUploadedFeatures] = useState<AudioFeatures | null>(null);
  const [analyzingAudio, setAnalyzingAudio]     = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    analyzeAudio(blobUrl)
      .then((features) => setUploadedFeatures(features))
      .catch((err) => console.warn("Audio analysis failed:", err))
      .finally(() => setAnalyzingAudio(false));
  }, [uploadedBlobUrl]);

  // ── Pose detection ──────────────────────────────────────────────

  const pose = usePoseValidation({
    videoRef: webcam.videoRef,
    userParams: {
      pose_hold_duration: 2.0,
      positional_tolerance: 0.5,
      elbow_participation_threshold: 0.4,
      hand_motion_tempo: 1.0,
    },
    currentPhase: null,
    phaseElapsed: 0,
    onValidation: () => {},
  });

  const handPositions = pose.trackedPoints
    ? (() => {
        const pts = pose.trackedPoints;
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
      })()
    : [];

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

  const handleConfirmCharacter = useCallback(() => {
    if (avatarState !== "selecting-character") return;
    setCheckConfirmed(true);
    setTimeout(() => {
      setCheckConfirmed(false);
      setAvatarState("selecting-song");
    }, 600);
  }, [avatarState]);

  useCheckmarkGesture({
    handPositions,
    onDetected: handleConfirmCharacter,
    enabled: avatarState === "selecting-character",
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

    // Save audio URL for game page
    if (audioUrl) saveActiveAudioUrl(audioUrl);

    const isUpload = selectedSong.id === UPLOAD_SONG_ID;

    // Preset songs: flow is pre-seeded in Firestore — just pass song_id, no analysis needed.
    // Uploaded songs: pass real BPM/energy from browser analysis so Gemini can orchestrate.
    const audioFeatures = isUpload ? (uploadedFeatures ?? undefined) : undefined;
    const songId = isUpload ? undefined : selectedSong.id;

    // Generate flow from backend; use built-in fallback if backend unreachable
    try {
      const flow = await generateFlowForSong(
        selectedSong.name,
        selectedSong.artist,
        durationSec,
        audioFeatures,
        songId,
      );
      saveActiveFlow(flow);
    } catch (err) {
      console.warn("Backend unavailable, using built-in flow:", err);
      saveActiveFlow(buildFallbackFlow(selectedSong.name, durationSec || 180));
    }

    // Give the user 2 seconds to enjoy the sakura rain before navigating
    await new Promise<void>((r) => setTimeout(r, 2000));

    router.push(`/game?songId=${selectedSong.id}`);
  }, [avatarState, currentSongIndex, uploadedFile, uploadedBlobUrl, uploadedDuration, uploadedFeatures, router]);

  // ── Button configs ──────────────────────────────────────────────

  const getLeftButton = () => {
    switch (avatarState) {
      case "selecting-character":
        return { label: "◀", onTrigger: () => {}, disabled: false };
      case "selecting-song":
        return { label: "◀", onTrigger: handlePrevSong, disabled: false };
      case "locked":
        return { label: "◀", onTrigger: () => {}, disabled: true };
    }
  };

  const getRightButton = () => {
    switch (avatarState) {
      case "selecting-character":
        return { label: "▶", onTrigger: () => {}, disabled: false };
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
          if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleConfirmCharacter(); }
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
  }, [avatarState, handleConfirmCharacter, handlePrevSong, handleNextSong, handleLockAndStart]);

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
          <RiveCoach
            animationName="idle"
            shoulderWidthPx={shoulderWidthPx}
            shoulderY={shoulderY}
          />
        }
        topRight={
          avatarState === "selecting-character" && (
            <div className="text-white/60 text-sm bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-full">
              {checkConfirmed ? "✓ Confirmed!" : "Draw ✓ to confirm"}
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
              handPositions={handPositions}
            >
              {leftBtn.label}
            </GestureButton>

            <GestureButton
              onTrigger={rightBtn.onTrigger}
              disabled={rightBtn.disabled}
              variant="primary"
              position="right"
              handPositions={handPositions}
            >
              {rightBtn.label}
            </GestureButton>
          </div>
        }
        rightOverlay={
          (avatarState === "selecting-song" || avatarState === "locked") && (
            <GoBubble
              onTrigger={handleLockAndStart}
              handPositions={handPositions}
              disabled={goBubbleDisabled}
            />
          )
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

      {/* Full-screen sakura rain during locked/transition state */}
      {avatarState === "locked" && <SakuraRainOverlay />}
    </>
  );
}
