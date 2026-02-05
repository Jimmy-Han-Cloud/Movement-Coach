"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface UseWebcamReturn {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  stream: MediaStream | null;
  ready: boolean;
  error: string | null;
  start: () => Promise<void>;
  stop: () => void;
}

export function useWebcam(): UseWebcamReturn {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const start = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 640, height: 480 },
        audio: false,
      });
      setStream(mediaStream);
      // Note: video element may not exist yet; the effect below will attach the stream
    } catch (e) {
      setError(e instanceof Error ? e.message : "Camera access denied");
    }
  }, []);

  // Effect to attach stream to video element when both are available
  // This handles the case where stream is ready before the video element mounts
  useEffect(() => {
    const video = videoRef.current;
    if (!stream || !video) return;

    // Check if already attached
    if (video.srcObject === stream) {
      if (!ready) setReady(true);
      return;
    }

    video.srcObject = stream;
    video.play().then(() => {
      setReady(true);
    }).catch((e) => {
      setError(e instanceof Error ? e.message : "Failed to play video");
    });
  }, [stream, ready]);

  // Re-run effect when videoRef.current changes (element mounts)
  // We use a MutationObserver-like pattern via callback ref is complex,
  // so we trigger re-check on a short interval when stream exists but not ready
  useEffect(() => {
    if (!stream || ready) return;

    const checkInterval = setInterval(() => {
      const video = videoRef.current;
      if (video && video.srcObject !== stream) {
        video.srcObject = stream;
        video.play().then(() => {
          setReady(true);
        }).catch((e) => {
          setError(e instanceof Error ? e.message : "Failed to play video");
        });
      }
    }, 50);

    return () => clearInterval(checkInterval);
  }, [stream, ready]);

  const stop = useCallback(() => {
    stream?.getTracks().forEach((t) => t.stop());
    setStream(null);
    setReady(false);
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, [stream]);

  useEffect(() => {
    return () => {
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [stream]);

  return { videoRef, stream, ready, error, start, stop };
}
