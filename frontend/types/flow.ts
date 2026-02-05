export type PhaseType = "neutral" | "pose_hold" | "hand_motion";

export type TrackedPoint =
  | "head"
  | "left_shoulder"
  | "right_shoulder"
  | "left_elbow"
  | "right_elbow"
  | "left_hand"
  | "right_hand";

export interface Phase {
  index: number;
  name: string;
  phase_type: PhaseType;
  start_sec: number;
  end_sec: number;
  tracked_points: TrackedPoint[];
  description: string;
}

export interface Flow {
  flow_id: string;
  name: string;
  duration_sec: number;
  phases: Phase[];
}
