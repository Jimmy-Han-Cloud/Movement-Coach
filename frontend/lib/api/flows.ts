import type { Flow, Phase, TrackedPoint } from "@/types";
import { apiFetch } from "./client";

const FLOW_STORAGE_KEY = "mc_active_flow";

// ── Fetch a named flow ────────────────────────────────────────────

export function fetchFlow(flowId: string): Promise<Flow> {
  return apiFetch<Flow>(`/api/flows/${flowId}`);
}

export function fetchFlowList(): Promise<string[]> {
  return apiFetch<string[]>("/api/flows");
}

// ── Generate a flow matched to a song ────────────────────────────

export interface MusicAnalysis {
  song_name: string;
  duration_sec: number;
  tempo_level: "slow" | "medium" | "fast";
  estimated_bpm: number;
  energy: number;
  reasoning: string;
}

export function analyzeSong(
  songName: string,
  artist: string,
  durationSec: number,
): Promise<MusicAnalysis> {
  return apiFetch<MusicAnalysis>("/api/music/analyze", {
    method: "POST",
    body: JSON.stringify({ song_name: songName, artist, duration_sec: durationSec }),
    headers: { "Content-Type": "application/json" },
  });
}

export interface AudioFeaturesPayload {
  bpm: number;
  energy: number;
  energy_timeline?: { start_sec: number; end_sec: number; energy: number }[];
}

/**
 * Single call: analyze song tempo → generate matching Flow.
 *
 * audioFeatures: real BPM/energy/timeline from browser audio analysis.
 * songId: for preset songs — backend checks/writes Firestore cache so
 *         Gemini is only called once per song, not on every session.
 */
export function generateFlowForSong(
  songName: string,
  artist: string,
  durationSec: number,
  audioFeatures?: AudioFeaturesPayload,
  songId?: string,
): Promise<Flow> {
  return apiFetch<Flow>("/api/music/flow", {
    method: "POST",
    body: JSON.stringify({
      song_name: songName,
      artist,
      duration_sec: durationSec,
      ...(audioFeatures && {
        bpm: audioFeatures.bpm,
        energy: audioFeatures.energy,
        ...(audioFeatures.energy_timeline && { energy_timeline: audioFeatures.energy_timeline }),
      }),
      ...(songId && { song_id: songId }),
    }),
    headers: { "Content-Type": "application/json" },
  }, 60000);
}

// ── Offline fallback flow builder ────────────────────────────────
// Used when the backend is unreachable. Generates a reasonable flow
// for any song duration by cycling through all 8 Rive animations.

const POSE_SEQUENCE = [
  "pose_shoulder_drop_neck_lift",
  "pose_chest_open_bilateral",
  "pose_elbow_overhead_reach",
  "pose_shoulder_lift_release",
] as const;

const MOTION_SEQUENCE = [
  "motion_arm_diagonal_up_sweep",
  "motion_arm_alternate_up_down",
  "motion_arm_vertical_alternate",
  "motion_arm_accented_circular_loop",
] as const;

const NEUTRAL_SEQUENCE = [
  "neutral_reset_breath",
  "neutral_shoulder_release",
  "neutral",
] as const;

const POSE_POINTS: TrackedPoint[] = [
  "head", "left_shoulder", "right_shoulder", "left_elbow", "right_elbow",
];
const MOTION_POINTS: TrackedPoint[] = [
  "left_shoulder", "right_shoulder", "left_elbow", "right_elbow",
  "left_hand", "right_hand",
];

function planSequence<T extends string>(sequence: readonly T[], count: number): T[] {
  return Array.from({ length: count }, (_, i) => sequence[i % sequence.length]);
}

export function buildFallbackFlow(songName: string, durationSec: number): Flow {
  // Structure: neutral(3s) → hand_motion(10s) → [pose_hold(10s) → hand_motion(20s)] × N → neutral(3s)
  // First non-neutral must always be hand_motion (matches backend rule).
  const OPEN = 3, CLOSE = 3, INTRO_MOTION = 10, POSE_DUR = 10, MOTION_DUR = 20;
  const PAIR_DUR = POSE_DUR + MOTION_DUR;

  const available = durationSec - OPEN - CLOSE - INTRO_MOTION;
  const numPairs = Math.max(0, Math.floor(available / PAIR_DUR));

  const phases: Phase[] = [];
  let t = 0;
  let idx = 0;
  let motionIdx = 0;
  let poseIdx = 0;

  const push = (name: string, type: Phase["phase_type"], dur: number, pts: TrackedPoint[]) => {
    phases.push({
      index: idx++,
      name,
      phase_type: type,
      start_sec: t,
      end_sec: t + dur,
      tracked_points: pts,
      description: name.replace(/_/g, " "),
    });
    t += dur;
  };

  push("neutral", "neutral", OPEN, []);
  push(MOTION_SEQUENCE[motionIdx++ % MOTION_SEQUENCE.length], "hand_motion", INTRO_MOTION, MOTION_POINTS);

  for (let i = 0; i < numPairs; i++) {
    push(POSE_SEQUENCE[poseIdx++ % POSE_SEQUENCE.length], "pose_hold", POSE_DUR, POSE_POINTS);
    const isLast = i === numPairs - 1;
    const dur = isLast ? Math.max(durationSec - t - CLOSE, MOTION_DUR) : MOTION_DUR;
    push(MOTION_SEQUENCE[motionIdx++ % MOTION_SEQUENCE.length], "hand_motion", dur, MOTION_POINTS);
  }

  push("neutral_reset_breath", "neutral", Math.max(durationSec - t, CLOSE), []);

  return {
    flow_id: `fallback-${Date.now()}`,
    name: songName,
    duration_sec: durationSec,
    phases,
  };
}

// ── Per-song flow cache (survives navigation within the session) ──

const SONG_FLOW_PREFIX = "mc_flow_";

export function saveFlowForSong(songId: string, flow: Flow): void {
  try {
    sessionStorage.setItem(SONG_FLOW_PREFIX + songId, JSON.stringify(flow));
  } catch {}
}

export function loadFlowForSong(songId: string): Flow | null {
  try {
    const raw = sessionStorage.getItem(SONG_FLOW_PREFIX + songId);
    return raw ? (JSON.parse(raw) as Flow) : null;
  } catch { return null; }
}

// ── Session-scoped flow storage ───────────────────────────────────

export function saveActiveFlow(flow: Flow): void {
  try {
    sessionStorage.setItem(FLOW_STORAGE_KEY, JSON.stringify(flow));
  } catch {
    // sessionStorage unavailable (SSR, private browsing limits)
  }
}

export function loadActiveFlow(): Flow | null {
  try {
    const raw = sessionStorage.getItem(FLOW_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Flow;
  } catch {
    return null;
  }
}

export function clearActiveFlow(): void {
  try {
    sessionStorage.removeItem(FLOW_STORAGE_KEY);
  } catch {
    // ignore
  }
}

// ── Session-scoped audio URL storage ─────────────────────────────
// Stores either a preset path ("/audio/mozart_minuet.mp3") or a
// blob URL created from a user-uploaded file.

const AUDIO_STORAGE_KEY = "mc_active_audio_url";

export function saveActiveAudioUrl(url: string): void {
  try { sessionStorage.setItem(AUDIO_STORAGE_KEY, url); } catch {}
}

export function loadActiveAudioUrl(): string | null {
  try { return sessionStorage.getItem(AUDIO_STORAGE_KEY); } catch { return null; }
}

export function clearActiveAudioUrl(): void {
  try { sessionStorage.removeItem(AUDIO_STORAGE_KEY); } catch {}
}

// ── Session-scoped active song metadata ───────────────────────────

const SONG_STORAGE_KEY = "mc_active_song";

export interface ActiveSong {
  name: string;
  artist: string;
  durationSec: number;
}

export function saveActiveSong(song: ActiveSong): void {
  try { sessionStorage.setItem(SONG_STORAGE_KEY, JSON.stringify(song)); } catch {}
}

export function loadActiveSong(): ActiveSong | null {
  try {
    const raw = sessionStorage.getItem(SONG_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ActiveSong) : null;
  } catch { return null; }
}
