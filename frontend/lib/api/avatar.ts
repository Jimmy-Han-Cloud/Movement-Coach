import { apiFetch } from "./client";

interface AvatarResponse {
  image_base64: string;
  content_type: string;
}

/** Capture a JPEG frame from a <video> element and return it as a Blob */
export function captureVideoFrame(video: HTMLVideoElement): Blob | null {
  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth || 640;
  canvas.height = video.videoHeight || 480;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  // canvas.toBlob is async; use toDataURL + convert for simplicity
  const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
  const byteStr = atob(dataUrl.split(",")[1]);
  const buf = new Uint8Array(byteStr.length);
  for (let i = 0; i < byteStr.length; i++) buf[i] = byteStr.charCodeAt(i);
  return new Blob([buf], { type: "image/jpeg" });
}

/** POST photo to /api/avatar, returns a data URL ready for <img src> */
export async function generateAvatar(video: HTMLVideoElement): Promise<string> {
  const blob = captureVideoFrame(video);
  if (!blob) throw new Error("Failed to capture video frame");

  const form = new FormData();
  form.append("file", blob, "photo.jpg");

  const data = await apiFetch<AvatarResponse>("/api/avatar", {
    method: "POST",
    body: form,
  });

  return `data:${data.content_type};base64,${data.image_base64}`;
}

const AVATAR_STORAGE_KEY = "mc_avatar_url";

export function saveAvatarUrl(dataUrl: string) {
  try { sessionStorage.setItem(AVATAR_STORAGE_KEY, dataUrl); } catch {}
}

export function loadAvatarUrl(): string | null {
  try { return sessionStorage.getItem(AVATAR_STORAGE_KEY); } catch { return null; }
}

const COACH_RIV_KEY = "mc_coach_riv";

export function saveCoachRiv(src: string) {
  try { sessionStorage.setItem(COACH_RIV_KEY, src); } catch {}
}

export function loadCoachRiv(): string {
  try { return sessionStorage.getItem(COACH_RIV_KEY) ?? "/animations/coach.riv"; } catch { return "/animations/coach.riv"; }
}
