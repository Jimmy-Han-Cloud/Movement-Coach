"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Phase, PhaseType, UserParams } from "@/types";
import type { CalibrationBaseline, TrackedPoints } from "./types";
import { initTracker, extractPoints, destroyTracker } from "./mediapipe-tracker";
import { smoothPoints } from "./smoothing";
import { PoseHoldValidator } from "./pose-hold-validator";
import { HandMotionValidator } from "./hand-motion-validator";

export interface PoseValidationState {
  /** Whether MediaPipe is initialized and ready */
  ready: boolean;
  /** Current smoothed tracked points (null if no detection) */
  trackedPoints: TrackedPoints | null;
  /** Calibration baseline captured during neutral phase */
  baseline: CalibrationBaseline | null;
  /** Whether current frame shows the user in target */
  inTarget: boolean;
  /** Whether current hold requirement is met */
  holdAchieved: boolean;
  /** Whether elbows are participating */
  elbowParticipating: boolean;
  /** Whether user is participating at all */
  participating: boolean;
}

interface UsePoseValidationOptions {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  userParams: UserParams;
  currentPhase: Phase | null;
  phaseElapsed: number;
  onValidation?: (result: {
    participation: boolean;
    holdAchieved: boolean;
    elbowParticipation: boolean;
    quality: "ok" | "partial" | "missed";
  }) => void;
}

export function usePoseValidation({
  videoRef,
  userParams,
  currentPhase,
  phaseElapsed,
  onValidation,
}: UsePoseValidationOptions): PoseValidationState {
  const [ready, setReady] = useState(false);
  const [trackedPoints, setTrackedPoints] = useState<TrackedPoints | null>(null);

  const baselineRef = useRef<CalibrationBaseline | null>(null);
  const prevPointsRef = useRef<TrackedPoints | null>(null);
  const poseValidatorRef = useRef<PoseHoldValidator | null>(null);
  const motionValidatorRef = useRef<HandMotionValidator | null>(null);
  const rafRef = useRef<number | null>(null);
  const onValidationRef = useRef(onValidation);
  onValidationRef.current = onValidation;

  const [inTarget, setInTarget] = useState(false);
  const [holdAchieved, setHoldAchieved] = useState(false);
  const [elbowParticipating, setElbowParticipating] = useState(false);
  const [participating, setParticipating] = useState(false);

  // Initialize MediaPipe
  useEffect(() => {
    let cancelled = false;
    initTracker().then(() => {
      if (!cancelled) setReady(true);
    });
    return () => {
      cancelled = true;
      destroyTracker();
    };
  }, []);

  // Reset validators on phase change
  useEffect(() => {
    if (!currentPhase || !baselineRef.current) return;

    poseValidatorRef.current = new PoseHoldValidator(baselineRef.current, userParams);
    motionValidatorRef.current = new HandMotionValidator(baselineRef.current, userParams);
    setInTarget(false);
    setHoldAchieved(false);
    setElbowParticipating(false);
    setParticipating(false);
  }, [currentPhase, userParams]);

  // Detection + validation loop
  const detect = useCallback(() => {
    const video = videoRef.current;
    if (!video || !ready || video.readyState < 2) {
      rafRef.current = requestAnimationFrame(detect);
      return;
    }

    const raw = extractPoints(video, performance.now());
    if (!raw) {
      rafRef.current = requestAnimationFrame(detect);
      return;
    }

    const smoothed = smoothPoints(prevPointsRef.current, raw);
    prevPointsRef.current = smoothed;
    setTrackedPoints(smoothed);

    // During calibration (neutral phase at index 0), capture baseline
    if (currentPhase?.phase_type === "neutral" && currentPhase.index === 0) {
      baselineRef.current = smoothed;
    }

    // Run validation based on phase type
    if (currentPhase && baselineRef.current) {
      const phaseType: PhaseType = currentPhase.phase_type;

      if (phaseType === "pose_hold" && poseValidatorRef.current) {
        // Use head as default primary point for pose hold
        const result = poseValidatorRef.current.validate(
          smoothed,
          "head",
          { x: 0, y: 0 }, // target offset — will be phase-specific in future
          phaseElapsed,
        );
        setInTarget(result.inTarget);
        setHoldAchieved(result.holdAchieved);
        setElbowParticipating(result.elbowParticipating);
        setParticipating(result.participating);

        const quality = result.holdAchieved
          ? "ok"
          : result.participating
            ? "partial"
            : "missed";

        onValidationRef.current?.({
          participation: result.participating,
          holdAchieved: result.holdAchieved,
          elbowParticipation: result.elbowParticipating,
          quality,
        });
      } else if (phaseType === "hand_motion" && motionValidatorRef.current) {
        const result = motionValidatorRef.current.validate(smoothed, {
          x: 0,
          y: -1,
        }); // default upward direction
        setInTarget(result.directionCorrect);
        setHoldAchieved(false);
        setElbowParticipating(result.elbowParticipating);
        setParticipating(result.participating);

        const quality = result.directionCorrect && result.elbowParticipating
          ? "ok"
          : result.participating
            ? "partial"
            : "missed";

        onValidationRef.current?.({
          participation: result.participating,
          holdAchieved: false,
          elbowParticipation: result.elbowParticipating,
          quality,
        });
      }
    }

    rafRef.current = requestAnimationFrame(detect);
  }, [ready, currentPhase, phaseElapsed, videoRef]);

  useEffect(() => {
    if (ready) {
      rafRef.current = requestAnimationFrame(detect);
    }
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [ready, detect]);

  return {
    ready,
    trackedPoints,
    baseline: baselineRef.current,
    inTarget,
    holdAchieved,
    elbowParticipating,
    participating,
  };
}
