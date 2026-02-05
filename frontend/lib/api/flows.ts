import type { Flow } from "@/types";
import { apiFetch } from "./client";

export function fetchFlow(flowId: string): Promise<Flow> {
  return apiFetch<Flow>(`/api/flows/${flowId}`);
}

export function fetchFlowList(): Promise<string[]> {
  return apiFetch<string[]>("/api/flows");
}
