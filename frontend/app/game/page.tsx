"use client";

import { useState, useCallback, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CameraLayout, ResultModal } from "@/components/layouts";
import { AvatarOverlay } from "@/components/avatar";
import { SongDisplay, SwitchingOverlay, PauseOverlay, GameHud, type Song } from "@/components/game";
import { ConfirmDialog, CameraError, type DialogType } from "@/components/ui";
import { useWebcam } from "@/lib/use-webcam";
import { usePoseValidation } from "@/modules/pose-validation";

type GameState = "playing" | "paused" | "switching" | "finished";

// Preset songs per UX Spec
const PRESET_SONGS: Song[] = [
  { id: "song-1", name: "Morning Flow", artist: "Movement Coach", durationSec: 180 },
  { id: "song-2", name: "Energy Boost", artist: "Movement Coach", durationSec: 240 },
  { id: "song-3", name: "Desk Break", artist: "Movement Coach", durationSec: 180 },
  { id: "song-4", name: "Focus Reset", artist: "Movement Coach", durationSec: 210 },
  { id: "song-5", name: "Evening Unwind", artist: "Movement Coach", durationSec: 300 },
];

/**
 * Page 3 — Game
 * Per UX Specification v1.0 Section 5 (Updated)
 *
 * Purpose: Pure execution space - no new preferences introduced visually
 * All decisions affecting the Flow must have been made prior to entry.
 *
 * States: Playing, Paused, Switching, Finished (no idle state)
 * Features:
 * - Fullscreen camera with avatar overlay (80%)
 * - Song display label (read-only, no dropdown)
 * - Starts playing immediately on entry
 * - Remote control support (song change via remote only)
 */
export default function GamePage() {
  return (
    <Suspense fallback={<GameLoading />}>
      <GameContent />
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

function GameContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const webcam = useWebcam();

  // Get song from URL params (set by Page 2)
  const songIdFromUrl = searchParams.get("songId") || PRESET_SONGS[0].id;

  // Game state - starts in "playing" immediately
  const [gameState, setGameState] = useState<GameState>("playing");
  const [currentSongId, setCurrentSongId] = useState(songIdFromUrl);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [completionPercent, setCompletionPercent] = useState(0);

  // Dialog state
  const [activeDialog, setActiveDialog] = useState<DialogType | null>(null);
  const [showResult, setShowResult] = useState(false);

  // Refs for game loop
  const gameLoopRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(Date.now()); // Start immediately

  // Get current song
  const currentSong = PRESET_SONGS.find((s) => s.id === currentSongId) || PRESET_SONGS[0];

  // Initialize pose detection for hand tracking
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

  // Extract head and shoulder Y for smart framing
  const headY = pose.trackedPoints?.head?.y;
  const shoulderY = pose.trackedPoints?.left_shoulder && pose.trackedPoints?.right_shoulder
    ? (pose.trackedPoints.left_shoulder.y + pose.trackedPoints.right_shoulder.y) / 2
    : undefined;

  // Start webcam on mount
  const hasStartedRef = useRef(false);
  if (!hasStartedRef.current && typeof window !== "undefined") {
    hasStartedRef.current = true;
    webcam.start();
  }

  // Game loop - starts immediately
  useEffect(() => {
    if (gameState === "playing") {
      const tick = () => {
        const elapsed = (Date.now() - startTimeRef.current) / 1000;
        setElapsedTime(elapsed);

        const percent = Math.min((elapsed / currentSong.durationSec) * 100, 100);
        setCompletionPercent(percent);

        // Check if song finished
        if (elapsed >= currentSong.durationSec) {
          handleGameEnd();
          return;
        }

        gameLoopRef.current = requestAnimationFrame(tick);
      };

      gameLoopRef.current = requestAnimationFrame(tick);
    }

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameState, currentSong.durationSec]);

  // Pause/Resume
  const handlePauseResume = useCallback(() => {
    if (gameState === "playing") {
      setGameState("paused");
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    } else if (gameState === "paused") {
      // Adjust start time to account for pause
      startTimeRef.current = Date.now() - elapsedTime * 1000;
      setGameState("playing");
    }
  }, [gameState, elapsedTime]);

  // Game end (song finished or manual end)
  const handleGameEnd = useCallback(() => {
    setGameState("finished");
    if (gameLoopRef.current) {
      cancelAnimationFrame(gameLoopRef.current);
    }
    setShowResult(true);
  }, []);

  // Song change via remote (escape hatch)
  const handleRemoteSongChange = useCallback(() => {
    if (gameState === "playing" || gameState === "paused") {
      setActiveDialog("change-song");
    }
  }, [gameState]);

  // Confirm song change - switch to next song
  const confirmSongChange = useCallback(() => {
    setGameState("switching");
    setActiveDialog(null);

    // Get next song
    const currentIndex = PRESET_SONGS.findIndex((s) => s.id === currentSongId);
    const nextIndex = (currentIndex + 1) % PRESET_SONGS.length;
    const newSongId = PRESET_SONGS[nextIndex].id;

    // Simulate switching delay, then restart playing
    setTimeout(() => {
      setCurrentSongId(newSongId);
      setElapsedTime(0);
      setCompletionPercent(0);
      startTimeRef.current = Date.now();
      setGameState("playing");
    }, 1500);
  }, [currentSongId]);

  // Return to avatar (Page 2)
  const handleReturnToAvatar = useCallback(() => {
    if (gameState === "playing" || gameState === "paused") {
      setActiveDialog("return-to-avatar");
    } else {
      router.push("/avatar");
    }
  }, [gameState, router]);

  // End session early
  const handleEndEarly = useCallback(() => {
    if (gameState === "playing" || gameState === "paused") {
      setActiveDialog("end-session");
    }
  }, [gameState]);

  // Dialog confirmations
  const handleDialogConfirm = useCallback(() => {
    switch (activeDialog) {
      case "return-to-avatar":
        router.push("/avatar");
        break;
      case "end-session":
        handleGameEnd();
        break;
      case "change-song":
        confirmSongChange();
        break;
    }
    setActiveDialog(null);
  }, [activeDialog, router, handleGameEnd, confirmSongChange]);

  // Result actions
  const handleRepeat = useCallback(() => {
    setShowResult(false);
    setElapsedTime(0);
    setCompletionPercent(0);
    startTimeRef.current = Date.now();
    setGameState("playing");
  }, []);

  const handleNewSong = useCallback(() => {
    // Go back to Page 2 to select new song
    router.push("/avatar");
  }, [router]);

  const handleExit = useCallback(() => {
    router.push("/");
  }, [router]);

  // Keyboard controls for remote
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeDialog) return; // Dialogs handle their own input
      if (showResult) return; // Result modal handles its own input

      switch (e.key) {
        case "ArrowLeft":
          handleReturnToAvatar();
          break;
        case "ArrowRight":
          handleEndEarly();
          break;
        case "Enter":
        case " ":
          handlePauseResume();
          break;
        case "s":
        case "S":
          // Switch key for song change (remote escape hatch)
          handleRemoteSongChange();
          break;
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
          <AvatarOverlay
            avatarUrl="/avatar-placeholder.png"
            isLocked={true}
            pageType="game"
          />
        }
        topLeft={
          <SongDisplay
            song={currentSong}
            progress={completionPercent}
          />
        }
        topRight={
          <GameHud
            state={gameState === "finished" ? "idle" : gameState}
            elapsedTime={elapsedTime}
            totalDuration={currentSong.durationSec}
          />
        }
        centerOverlay={
          gameState === "switching" ? <SwitchingOverlay /> :
          gameState === "paused" ? <PauseOverlay /> : null
        }
      />

      {/* Confirmation Dialogs */}
      {activeDialog && (
        <ConfirmDialog
          type={activeDialog}
          isOpen={true}
          onConfirm={handleDialogConfirm}
          onCancel={() => setActiveDialog(null)}
        />
      )}

      {/* Result Modal */}
      <ResultModal
        isOpen={showResult}
        completionPercent={completionPercent}
        onRepeat={handleRepeat}
        onNewSong={handleNewSong}
        onExit={handleExit}
      />

      {/* Camera Error */}
      {webcam.error && (
        <CameraError error={webcam.error} onRetry={webcam.retry} />
      )}
    </>
  );
}
