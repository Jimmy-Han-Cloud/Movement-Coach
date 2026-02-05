import type { Session, SessionCreateResponse, SessionResultRequest } from "@/types";
import { apiFetch } from "./client";

export function createSession(flowId: string): Promise<SessionCreateResponse> {
  return apiFetch<SessionCreateResponse>("/api/sessions", {
    method: "POST",
    body: JSON.stringify({ flow_id: flowId }),
  });
}

export function submitResult(
  sessionId: string,
  body: SessionResultRequest,
): Promise<Session> {
  return apiFetch<Session>(`/api/sessions/${sessionId}/result`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function requestSummary(sessionId: string): Promise<Session> {
  return apiFetch<Session>(`/api/sessions/${sessionId}/summary`, {
    method: "POST",
  });
}

export function fetchSession(sessionId: string): Promise<Session> {
  return apiFetch<Session>(`/api/sessions/${sessionId}`);
}
