export type PhaseQuality = "ok" | "partial" | "missed";

export interface PhaseResult {
  phase_index: number;
  phase_name: string;
  participation: boolean;
  hold_achieved: boolean | null;
  elbow_participation: boolean | null;
  quality: PhaseQuality;
  notes: string;
}

export interface SessionCreateResponse {
  session_id: string;
  flow_id: string;
  status: string;
  created_at: string;
}

export interface SessionResultRequest {
  phase_results: PhaseResult[];
  duration_actual_sec: number;
}

export interface Session {
  session_id: string;
  flow_id: string;
  user_id: string;
  status: string;
  created_at: string;
  completed_at: string | null;
  phase_results: PhaseResult[];
  duration_actual_sec: number | null;
  summary: string | null;
}
