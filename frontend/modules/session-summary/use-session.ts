"use client";

import { useCallback, useRef, useState } from "react";
import type { PhaseResult, Session } from "@/types";
import { createSession, submitResult, requestSummary } from "@/lib/api";

export type SessionStage = "idle" | "active" | "submitting" | "summarizing" | "done" | "error";

interface UseSessionOptions {
  flowId: string;
}

interface UseSessionReturn {
  stage: SessionStage;
  sessionId: string | null;
  session: Session | null;
  error: string | null;
  /** Call before session starts to get a session_id */
  begin: () => Promise<string>;
  /** Call after session ends with phase results */
  submit: (results: PhaseResult[], durationSec: number) => Promise<void>;
}

export function useSession({ flowId }: UseSessionOptions): UseSessionReturn {
  const [stage, setStage] = useState<SessionStage>("idle");
  const [session, setSession] = useState<Session | null>(null);
  const [error, setError] = useState<string | null>(null);
  const sessionIdRef = useRef<string | null>(null);

  const begin = useCallback(async () => {
    setStage("active");
    setError(null);
    try {
      const res = await createSession(flowId);
      sessionIdRef.current = res.session_id;
      return res.session_id;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to create session";
      setError(msg);
      setStage("error");
      throw e;
    }
  }, [flowId]);

  const submit = useCallback(
    async (results: PhaseResult[], durationSec: number) => {
      const sid = sessionIdRef.current;
      if (!sid) {
        setError("No active session");
        setStage("error");
        return;
      }

      setStage("submitting");
      try {
        await submitResult(sid, {
          phase_results: results,
          duration_actual_sec: durationSec,
        });

        setStage("summarizing");
        try {
          const updated = await requestSummary(sid);
          setSession(updated);
        } catch {
          // Summary is optional — if Gemini is unavailable, proceed without it
          const { fetchSession } = await import("@/lib/api");
          const fallback = await fetchSession(sid);
          setSession(fallback);
        }

        setStage("done");
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to submit results";
        setError(msg);
        setStage("error");
      }
    },
    [],
  );

  return {
    stage,
    sessionId: sessionIdRef.current,
    session,
    error,
    begin,
    submit,
  };
}
