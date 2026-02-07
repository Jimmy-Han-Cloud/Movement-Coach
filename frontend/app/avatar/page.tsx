"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { CameraLayout } from "@/components/layouts";
import { TipBox, AvatarOverlay, SongCarousel, type Song } from "@/components/avatar";
import { GestureButton, StatusBadge, GoBubble } from "@/components/ui";
import { useWebcam } from "@/lib/use-webcam";
import { usePoseValidation } from "@/modules/pose-validation";

/**
 * Page 2 State Machine:
 * idle → generating → previewing → selecting-song → locked → navigate
 *
 * Button Layout (consistent left/right):
 * - idle: Generate (left) / Confirm (right, disabled)
 * - generating: (disabled) / (disabled)
 * - previewing: Regenerate (left) / Confirm Avatar (right)
 * - selecting-song: ◀ (left) / ▶ (right) + SongCarousel (center) + GoBubble (right side)
 */
type AvatarState = "idle" | "generating" | "previewing" | "selecting-song" | "locked";

// Preset songs per UX Spec
const PRESET_SONGS: Song[] = [
  { id: "song-1", name: "Morning Flow", artist: "Movement Coach", durationSec: 180 },
  { id: "song-2", name: "Energy Boost", artist: "Movement Coach", durationSec: 240 },
  { id: "song-3", name: "Desk Break", artist: "Movement Coach", durationSec: 180 },
  { id: "song-4", name: "Focus Reset", artist: "Movement Coach", durationSec: 210 },
  { id: "song-5", name: "Evening Unwind", artist: "Movement Coach", durationSec: 300 },
];

/**
 * Page 2 — Avatar Setup
 * Per UX Specification v1.0 Section 4 (Updated)
 *
 * Purpose: Final preparation gate before embodied interaction
 * - Accept personalized cartoon avatar
 * - Select music track for upcoming session
 */
export default function AvatarSetupPage() {
  const router = useRouter();
  const webcam = useWebcam();

  // State
  const [avatarState, setAvatarState] = useState<AvatarState>("idle");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [showTip, setShowTip] = useState(true);
  const [currentSongIndex, setCurrentSongIndex] = useState(0);

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

  // Extract fingertip positions for gesture detection
  // Estimate fingertip = wrist + (wrist - elbow) * 0.4 (hand length ≈ 40% of forearm)
  const handPositions = pose.trackedPoints
    ? (() => {
        const points = pose.trackedPoints;
        const results: Array<{ x: number; y: number }> = [];

        // Left hand fingertip estimation
        if (points.left_hand && points.left_elbow) {
          const wrist = points.left_hand;
          const elbow = points.left_elbow;
          results.push({
            x: wrist.x + (wrist.x - elbow.x) * 0.4,
            y: wrist.y + (wrist.y - elbow.y) * 0.4,
          });
        }

        // Right hand fingertip estimation
        if (points.right_hand && points.right_elbow) {
          const wrist = points.right_hand;
          const elbow = points.right_elbow;
          results.push({
            x: wrist.x + (wrist.x - elbow.x) * 0.4,
            y: wrist.y + (wrist.y - elbow.y) * 0.4,
          });
        }

        return results;
      })()
    : [];

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

  // Generate avatar
  const handleGenerate = useCallback(async () => {
    if (avatarState === "generating") return;

    setAvatarState("generating");

    try {
      // TODO: Implement actual avatar generation
      await new Promise((resolve) => setTimeout(resolve, 2000));

      setAvatarUrl("/avatar-placeholder.png");
      setAvatarState("previewing");
      setShowTip(false);
    } catch (error) {
      console.error("Avatar generation failed:", error);
      setAvatarState("idle");
    }
  }, [avatarState]);

  // Confirm avatar → show song selector
  const handleConfirmAvatar = useCallback(() => {
    if (avatarState !== "previewing") return;
    setAvatarState("selecting-song");
  }, [avatarState]);

  // Navigate to previous song
  const handlePrevSong = useCallback(() => {
    setCurrentSongIndex((prev) => (prev <= 0 ? PRESET_SONGS.length - 1 : prev - 1));
  }, []);

  // Navigate to next song
  const handleNextSong = useCallback(() => {
    setCurrentSongIndex((prev) => (prev >= PRESET_SONGS.length - 1 ? 0 : prev + 1));
  }, []);

  // Lock everything and proceed to game (triggered by GoBubble)
  const handleLockAndStart = useCallback(() => {
    if (avatarState !== "selecting-song") return;

    setAvatarState("locked");

    const selectedSongId = PRESET_SONGS[currentSongIndex].id;
    setTimeout(() => {
      router.push(`/game?songId=${selectedSongId}`);
    }, 300);
  }, [avatarState, currentSongIndex, router]);

  // Map state to StatusBadge type
  const getStatusBadgeType = () => {
    switch (avatarState) {
      case "generating":
        return "generating";
      case "previewing":
      case "selecting-song":
        return "previewing";
      case "locked":
        return "locked";
      default:
        return "idle";
    }
  };

  // Get left button config based on state
  const getLeftButton = () => {
    switch (avatarState) {
      case "idle":
        return { label: "Generate", onTrigger: handleGenerate, disabled: false };
      case "generating":
        return { label: "Generate", onTrigger: handleGenerate, disabled: true };
      case "previewing":
        return { label: "Regenerate", onTrigger: handleGenerate, disabled: false };
      case "selecting-song":
        return { label: "◀", onTrigger: handlePrevSong, disabled: false };
      case "locked":
        return { label: "◀", onTrigger: handlePrevSong, disabled: true };
      default:
        return { label: "Generate", onTrigger: handleGenerate, disabled: false };
    }
  };

  // Get right button config based on state
  const getRightButton = () => {
    switch (avatarState) {
      case "idle":
        return { label: "Confirm", onTrigger: () => {}, disabled: true };
      case "generating":
        return { label: "Confirm", onTrigger: () => {}, disabled: true };
      case "previewing":
        return { label: "Confirm Avatar", onTrigger: handleConfirmAvatar, disabled: false };
      case "selecting-song":
        return { label: "▶", onTrigger: handleNextSong, disabled: false };
      case "locked":
        return { label: "▶", onTrigger: handleNextSong, disabled: true };
      default:
        return { label: "Confirm", onTrigger: () => {}, disabled: true };
    }
  };

  const leftBtn = getLeftButton();
  const rightBtn = getRightButton();

  return (
    <CameraLayout
      videoRef={webcam.videoRef}
      pageType="avatar-setup"
      headY={headY}
      shoulderY={shoulderY}
      avatarOverlay={
        <AvatarOverlay
          avatarUrl={avatarUrl}
          isLocked={avatarState === "locked"}
          pageType="setup"
        />
      }
      topLeft={
        showTip && avatarState === "idle" && (
          <TipBox
            message="Stand in frame so your head and shoulders are visible. Then tap 'Generate' to create your avatar."
            onDismiss={() => setShowTip(false)}
          />
        )
      }
      topRight={
        avatarState !== "idle" && (
          <StatusBadge status={getStatusBadgeType()} />
        )
      }
      bottomOverlay={
        <div className="flex justify-between items-end px-4">
          {/* Left Button */}
          <GestureButton
            onTrigger={leftBtn.onTrigger}
            disabled={leftBtn.disabled}
            variant="secondary"
            position="left"
            handPositions={handPositions}
          >
            {leftBtn.label}
          </GestureButton>

          {/* Right Button */}
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
        avatarState === "selecting-song" && (
          <GoBubble
            onTrigger={handleLockAndStart}
            handPositions={handPositions}
            disabled={avatarState !== "selecting-song"}
          />
        )
      }
    >
      {/* Song Carousel - visible in selecting-song state */}
      <SongCarousel
        songs={PRESET_SONGS}
        currentIndex={currentSongIndex}
        visible={avatarState === "selecting-song"}
      />
    </CameraLayout>
  );
}
