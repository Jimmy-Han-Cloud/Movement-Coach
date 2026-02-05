const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

let authToken: string | null = null;
let debugUserId: string | null = null;

export function setAuthToken(token: string) {
  authToken = token;
  debugUserId = null;
}

export function setDebugUserId(userId: string) {
  debugUserId = userId;
  authToken = null;
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  } else if (debugUserId) {
    headers["X-Debug-User-Id"] = debugUserId;
  }

  if (
    options.body &&
    typeof options.body === "string" &&
    !headers["Content-Type"]
  ) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const detail = await res.json().catch(() => ({}));
    throw new Error(detail.detail ?? `API error: ${res.status}`);
  }

  return res.json() as Promise<T>;
}
