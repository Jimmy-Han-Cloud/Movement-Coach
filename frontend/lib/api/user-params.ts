import type { UserParams } from "@/types";
import { apiFetch } from "./client";

export function fetchUserParams(): Promise<UserParams> {
  return apiFetch<UserParams>("/api/users/me/params");
}

export function updateUserParams(
  updates: Partial<UserParams>,
): Promise<UserParams> {
  return apiFetch<UserParams>("/api/users/me/params", {
    method: "PATCH",
    body: JSON.stringify(updates),
  });
}
