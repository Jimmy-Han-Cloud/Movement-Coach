"use client";

import { useCallback, useEffect, useState } from "react";
import type { Flow, PhaseResult, UserParams } from "@/types";
import { fetchFlow, fetchUserParams } from "@/lib/api";
import { useAuth } from "@/lib/use-auth";
import { useWebcam } from "@/lib/use-webcam";
import { usePhaseEngine } from "@/modules/flow-engine";
import { usePoseValidation } from "@/modules/pose-validation";
import { SkeletonCanvas, PhaseHud, RiveCharacter } from "@/modules/visual-feedback";
import { useSession, SessionResultView } from "@/modules/session-summary";

const FLOW_ID = "3min-standard";
const VIDEO_WIDTH = 640;
const VIDEO_HEIGHT = 480;

export default function SessionPage() {
  const authState = useAuth();
  const [flow, setFlow] = useState<Flow | null>(null);
  const [userParams, setUserParams] = useState<UserParams | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  const webcam = useWebcam();
  const session = useSession({ flowId: FLOW_ID });

  // Load flow + params after auth is ready
  useEffect(() => {
    if (!authState.ready) return;
    async function load() {
      try {
        const [f, p] = await Promise.all([
          fetchFlow(FLOW_ID),
          fetchUserParams().catch(() => ({
            pose_hold_duration: 2.0,
            positional_tolerance: 0.5,
            elbow_participation_threshold: 0.4,
            hand_motion_tempo: 1.0,
          })),
        ]);
        setFlow(f);
        setUserParams(p);
      } catch (e) {
        setLoadError(e instanceof Error ? e.message : "Failed to load");
      }
    }
    load();
  }, [authState.ready]);

  // Phase engine (only available after flow + params loaded)
  const handleComplete = useCallback(
    (results: PhaseResult[]) => {
      webcam.stop();
      if (engine.status === "completed") {
        session.submit(results, engine.elapsedTotal);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const engine = usePhaseEngine({
    flow: flow ?? {
      flow_id: "",
      name: "",
      duration_sec: 0,
      phases: [],
    },
    userParams: userParams ?? {
      pose_hold_duration: 2.0,
      positional_tolerance: 0.5,
      elbow_participation_threshold: 0.4,
      hand_motion_tempo: 1.0,
    },
    onComplete: handleComplete,
  });

  // Pose validation → reports to engine
  const handleValidation = useCallback(
    (result: {
      participation: boolean;
      holdAchieved: boolean;
      elbowParticipation: boolean;
      quality: "ok" | "partial" | "missed";
    }) => {
      engine.reportValidation(result);
    },
    [engine],
  );

  const pose = usePoseValidation({
    videoRef: webcam.videoRef,
    userParams: userParams ?? {
      pose_hold_duration: 2.0,
      positional_tolerance: 0.5,
      elbow_participation_threshold: 0.4,
      hand_motion_tempo: 1.0,
    },
    currentPhase: engine.currentPhase,
    phaseElapsed: engine.currentPhaseState?.elapsedInPhase ?? 0,
    onValidation: handleValidation,
  });

  // Start session
  async function handleStart() {
    if (!flow || !userParams) return;
    try {
      await session.begin();
      await webcam.start();
      setInitialized(true);
    } catch {
      // error is captured in session.error
    }
  }

  // Start engine once webcam + mediapipe are ready
  useEffect(() => {
    if (initialized && webcam.ready && pose.ready && engine.status === "idle") {
      engine.start();
    }
  }, [initialized, webcam.ready, pose.ready, engine]);

  // Phase timing
  const currentPhase = engine.currentPhase;
  const phaseElapsed = engine.currentPhaseState?.elapsedInPhase ?? 0;
  const phaseDuration = currentPhase
    ? currentPhase.end_sec - currentPhase.start_sec
    : 0;

  // ── RENDER ──

  // Auth loading
  if (!authState.ready) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-zinc-500">Signing in...</p>
      </div>
    );
  }

  // Auth error
  if (authState.error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-red-500">Auth error: {authState.error}</p>
      </div>
    );
  }

  // Error state
  if (loadError) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-red-500">{loadError}</p>
      </div>
    );
  }

  // Loading
  if (!flow || !userParams) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-zinc-500">Loading...</p>
      </div>
    );
  }

  // Session complete — show results
  if (session.stage === "done" && session.session) {
    return <SessionResultView session={session.session} />;
  }

  // Submitting / summarizing
  if (session.stage === "submitting" || session.stage === "summarizing") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-zinc-500">
          {session.stage === "submitting" ? "Submitting results..." : "Generating summary..."}
        </p>
      </div>
    );
  }

  // Error
  if (session.stage === "error") {
    return (
      <div className="flex min-h-screen items-center justify-center flex-col gap-4">
        <p className="text-red-500">{session.error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-zinc-800 text-white rounded-lg"
        >
          Retry
        </button>
      </div>
    );
  }

  // Idle — show start button
  if (!initialized) {
    return (
      <div className="flex min-h-screen items-center justify-center flex-col gap-6">
        <h1 className="text-2xl font-semibold">Movement Coach</h1>
        <p className="text-zinc-500 text-sm">{flow.name}</p>
        <button
          onClick={handleStart}
          className="px-6 py-3 bg-zinc-900 text-white rounded-xl text-lg font-medium hover:bg-zinc-700 transition-colors"
        >
          Start Session
        </button>
      </div>
    );
  }

  // Active session
  return (
    <div className="relative w-screen h-screen bg-black overflow-hidden">
      {/* Webcam video */}
      <video
        ref={webcam.videoRef}
        className="absolute top-0 left-0 w-full h-full object-cover -scale-x-100"
        playsInline
        muted
      />

      {/* Skeleton overlay */}
      <SkeletonCanvas
        trackedPoints={pose.trackedPoints}
        inTarget={pose.inTarget}
        holdAchieved={pose.holdAchieved}
        elbowParticipating={pose.elbowParticipating}
        participating={pose.participating}
        width={VIDEO_WIDTH}
        height={VIDEO_HEIGHT}
      />

      {/* Phase HUD */}
      <PhaseHud
        currentPhase={currentPhase}
        engineStatus={engine.status}
        elapsedTotal={engine.elapsedTotal}
        phaseElapsed={phaseElapsed}
        phaseDuration={phaseDuration}
        inTarget={pose.inTarget}
        holdAchieved={pose.holdAchieved}
      />

      {/* Reference character */}
      <div className="absolute bottom-4 right-4">
        <RiveCharacter
          currentPhase={currentPhase}
          engineStatus={engine.status}
          phaseElapsed={phaseElapsed}
          phaseDuration={phaseDuration}
        />
      </div>
    </div>
  );
}
