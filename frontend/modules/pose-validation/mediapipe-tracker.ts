import { PoseLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import type { TrackedPoints, Point2D } from "./types";

/**
 * MediaPipe Pose landmark indices mapped to our 7 tracked points.
 * See: https://ai.google.dev/edge/mediapipe/solutions/vision/pose_landmarker
 */
const LANDMARK_MAP = {
  head: 0, // nose
  left_shoulder: 11,
  right_shoulder: 12,
  left_elbow: 13,
  right_elbow: 14,
  left_hand: 15, // left wrist
  right_hand: 16, // right wrist
} as const;

let landmarker: PoseLandmarker | null = null;

export async function initTracker(): Promise<void> {
  if (landmarker) return;

  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm",
  );

  landmarker = await PoseLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath:
        "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
      delegate: "GPU",
    },
    runningMode: "VIDEO",
    numPoses: 1,
  });
}

export function extractPoints(
  video: HTMLVideoElement,
  timestampMs: number,
): TrackedPoints | null {
  if (!landmarker) return null;

  const result = landmarker.detectForVideo(video, timestampMs);

  if (!result.landmarks || result.landmarks.length === 0) return null;

  const landmarks = result.landmarks[0];
  const points = {} as TrackedPoints;

  for (const [name, idx] of Object.entries(LANDMARK_MAP)) {
    const lm = landmarks[idx];
    if (!lm) return null;
    points[name as keyof typeof LANDMARK_MAP] = {
      x: lm.x,
      y: lm.y,
    } satisfies Point2D;
  }

  return points;
}

export function destroyTracker(): void {
  landmarker?.close();
  landmarker = null;
}
