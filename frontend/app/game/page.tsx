"use client";

import { useState, useCallback, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CameraLayout, ResultModal } from "@/components/layouts";
import { RiveCoach } from "@/components/avatar/rive-coach";
import { SongDisplay, SwitchingOverlay, PauseOverlay, GameHud, type Song } from "@/components/game";
import { ConfirmDialog, CameraError, type DialogType } from "@/components/ui";
import { useWebcam } from "@/lib/use-webcam";
import { usePoseValidation } from "@/modules/pose-validation";
import { usePhaseEngine } from "@/modules/flow-engine";
import { loadAvatarUrl } from "@/lib/api/avatar";
import { loadActiveFlow, loadActiveAudioUrl } from "@/lib/api/flows";
import type { Flow, PhaseResult } from "@/types";

type GameState = "playing" | "paused" | "switching" | "finished";

const PRESET_SONGS: Song[] = [
  { id: "song-1", name: "Mozart Minuet",  artist: "W.A. Mozart", durationSec: 258 },
  { id: "song-2", name: "Turkish March",  artist: "W.A. Mozart", durationSec: 175 },
  { id: "song-3", name: "Vivaldi Spring", artist: "A. Vivaldi",  durationSec: 215 },
];

/** Fallback audio map for preset songs (used only when sessionStorage has no URL). */
const FALLBACK_AUDIO_MAP: Record<string, string> = {
  "song-1": "/audio/mozart_minuet.mp3",
  "song-2": "/audio/turkish_march.mp3",
  "song-3": "/audio/vivaldi_spring.mp3",
};

/** Map phase template ID → Rive animation name (coach.riv). */
function phaseToAnimation(phaseName: string | undefined): string {
  if (!phaseName) return "idle";
  const map: Record<string, string> = {
    // ── Neutral phases ──────────────────────────────────────────
    neutral:                           "idle",
    neutral_reset_breath:              "idle",
    neutral_shoulder_release:          "idle",
    // ── Pose Hold phases ────────────────────────────────────────
    pose_shoulder_drop_neck_lift:      "pose_shoulder_drop_neck_lift",
    pose_chest_open_bilateral:         "pose_chest_open_bilateral",
    pose_shoulder_lift_release:        "pose_shoulder_lift_release",
    pose_elbow_overhead_reach:         "pose_elbow_overhead_reach",
    // ── Hand Motion phases ──────────────────────────────────────
    motion_arm_diagonal_up_sweep:      "motion_arm_diagonal_up_sweep",
    motion_arm_alternate_up_down:      "motion_arm_alternate_up_down",
    motion_arm_vertical_alternate:     "motion_arm_vertical_alternate",
    motion_arm_accented_circular_loop: "motion_arm_accented_circular_loop",
  };
  return map[phaseName] ?? "idle";
}

const DEFAULT_USER_PARAMS = {
  pose_hold_duration: 2.0,
  positional_tolerance: 0.5,
  elbow_participation_threshold: 0.4,
  hand_motion_tempo: 1.0,
};

export default function GamePage() {
  return (
    <Suspense fallback={<GameLoading />}>
      <GameFlowLoader />
    </Suspense>
  );
}

function GameLoading() {
  return (
    <div className="w-screen h-screen bg-black flex items-center justify-center">
      <div className="text-white text-lg">Loading...</div>
    </div>
  );
}

/**
 * Loads the active flow from sessionStorage.
 * Redirects to /avatar if none is found — the user must go through
 * song selection before entering the game.
 */
function GameFlowLoader() {
  const router = useRouter();
  const [flow, setFlow] = useState<Flow | null>(null);

  useEffect(() => {
    const stored = loadActiveFlow();
    if (stored) {
      setFlow(stored);
    } else {
      router.replace("/avatar");
    }
  }, [router]);

  if (!flow) return <GameLoading />;
  return <GameContent flow={flow} />;
}

function GameContent({ flow }: { flow: Flow }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const webcam = useWebcam();

  const songIdFromUrl = searchParams.get("songId") || PRESET_SONGS[0].id;

  const [gameState, setGameState]     = useState<GameState>("playing");
  const [currentSongId, setCurrentSongId] = useState(songIdFromUrl);
  const [activeDialog, setActiveDialog]   = useState<DialogType | null>(null);
  const [showResult, setShowResult]       = useState(false);
  const [avatarUrl, setAvatarUrl]         = useState<string | null>(null);
  // Audio URL: sessionStorage (set by avatar page) takes priority over fallback map
  const [activeAudioUrl] = useState<string | null>(
    () => loadActiveAudioUrl() || FALLBACK_AUDIO_MAP[songIdFromUrl] || null
  );

  useEffect(() => {
    setAvatarUrl(loadAvatarUrl());
  }, []);

  const currentSong = PRESET_SONGS.find((s) => s.id === currentSongId) || PRESET_SONGS[0];

  const engine = usePhaseEngine({
    flow,
    userParams: DEFAULT_USER_PARAMS,
    onComplete: () => handleGameEnd(),
  });

  const currentAnimation  = phaseToAnimation(engine.currentPhase?.name);
  const completionPercent = Math.min((engine.elapsedTotal / flow.duration_sec) * 100, 100);

  // Performance score: average quality of non-neutral phases (ok=1, partial=0.5, missed=0)
  const performanceScore = (() => {
    const results: PhaseResult[] = engine.phaseResults;
    if (results.length === 0) return completionPercent;
    const active = results.filter((r) => !r.phase_name.startsWith("neutral"));
    if (active.length === 0) return completionPercent;
    const sum = active.reduce((acc, r) => {
      if (r.quality === "ok") return acc + 1;
      if (r.quality === "partial") return acc + 0.5;
      return acc;
    }, 0);
    return Math.round((sum / active.length) * 100);
  })();

  const pose = usePoseValidation({
    videoRef: webcam.videoRef,
    userParams: DEFAULT_USER_PARAMS,
    currentPhase: engine.currentPhase,
    phaseElapsed: engine.currentPhaseState?.elapsedInPhase ?? 0,
    onValidation: (result) => engine.reportValidation(result),
  });

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

  useEffect(() => {
    engine.start();
  }, [engine.start]);

  // ── Audio playback ──────────────────────────────────────────────
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audioPath = activeAudioUrl;
    if (!audioPath) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
      audioRef.current = null;
      return;
    }
    const audio = new Audio(audioPath);
    audio.volume = 0.7;
    audioRef.current = audio;
    return () => {
      audio.pause();
      audio.src = "";
    };
  }, [activeAudioUrl]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (gameState === "playing") {
      audio.play().catch((e) => console.warn("Audio play failed:", e));
    } else if (gameState === "paused" || gameState === "switching") {
      audio.pause();
    } else if (gameState === "finished") {
      audio.pause();
      audio.currentTime = 0;
    }
  }, [gameState]);

  // ── Handlers ────────────────────────────────────────────────────
  const handlePauseResume = useCallback(() => {
    if (gameState === "playing") {
      engine.pause();
      setGameState("paused");
    } else if (gameState === "paused") {
      engine.resume();
      setGameState("playing");
    }
  }, [gameState, engine]);

  const handleGameEnd = useCallback(() => {
    engine.stop();
    setGameState("finished");
    setShowResult(true);
  }, [engine]);

  const handleRemoteSongChange = useCallback(() => {
    if (gameState === "playing" || gameState === "paused") {
      setActiveDialog("change-song");
    }
  }, [gameState]);

  const confirmSongChange = useCallback(() => {
    setGameState("switching");
    setActiveDialog(null);
    const currentIndex = PRESET_SONGS.findIndex((s) => s.id === currentSongId);
    const nextIndex = (currentIndex + 1) % PRESET_SONGS.length;
    setTimeout(() => {
      setCurrentSongId(PRESET_SONGS[nextIndex].id);
      setGameState("playing");
    }, 1500);
  }, [currentSongId]);

  const handleReturnToAvatar = useCallback(() => {
    if (gameState === "playing" || gameState === "paused") {
      setActiveDialog("return-to-avatar");
    } else {
      router.push("/avatar");
    }
  }, [gameState, router]);

  const handleEndEarly = useCallback(() => {
    if (gameState === "playing" || gameState === "paused") {
      setActiveDialog("end-session");
    }
  }, [gameState]);

  const handleDialogConfirm = useCallback(() => {
    switch (activeDialog) {
      case "return-to-avatar": router.push("/avatar"); break;
      case "end-session":      handleGameEnd();        break;
      case "change-song":      confirmSongChange();    break;
    }
    setActiveDialog(null);
  }, [activeDialog, router, handleGameEnd, confirmSongChange]);

  const handleRepeat = useCallback(() => {
    setShowResult(false);
    setGameState("playing");
    engine.restart();
  }, [engine]);
  const handleNewSong  = useCallback(() => router.push("/avatar"), [router]);
  const handleExit     = useCallback(() => router.push("/"),       [router]);

  // ── Keyboard controls ────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeDialog || showResult) return;
      switch (e.key) {
        case "ArrowLeft":   handleReturnToAvatar();    break;
        case "ArrowRight":  handleEndEarly();           break;
        case "Enter":
        case " ":           handlePauseResume();        break;
        case "s": case "S": handleRemoteSongChange();  break;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [gameState, activeDialog, showResult, handleReturnToAvatar, handleEndEarly, handlePauseResume, handleRemoteSongChange]);

  return (
    <>
      <CameraLayout
        videoRef={webcam.videoRef}
        pageType="game"
        headY={headY}
        shoulderY={shoulderY}
        dimmed={!!activeDialog || showResult || gameState === "paused"}
        avatarOverlay={
          <RiveCoach
            animationName={currentAnimation}
            shoulderWidthPx={shoulderWidthPx}
            shoulderY={shoulderY}
            avatarImageUrl={avatarUrl ?? undefined}
          />
        }
        topLeft={
          <SongDisplay song={currentSong} progress={completionPercent} />
        }
        topRight={
          <GameHud
            state={gameState === "finished" ? "idle" : gameState}
            elapsedTime={engine.elapsedTotal}
            totalDuration={flow.duration_sec}
          />
        }
        centerOverlay={
          gameState === "switching" ? <SwitchingOverlay /> :
          gameState === "paused"    ? <PauseOverlay />     : null
        }
      />

      {activeDialog && (
        <ConfirmDialog
          type={activeDialog}
          isOpen={true}
          onConfirm={handleDialogConfirm}
          onCancel={() => setActiveDialog(null)}
        />
      )}

      <ResultModal
        isOpen={showResult}
        completionPercent={performanceScore}
        onRepeat={handleRepeat}
        onNewSong={handleNewSong}
        onExit={handleExit}
      />

      {webcam.error && (
        <CameraError error={webcam.error} onRetry={webcam.retry} />
      )}
    </>
  );
}
