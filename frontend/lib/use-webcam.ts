"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface UseWebcamReturn {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  stream: MediaStream | null;
  ready: boolean;
  error: string | null;
  start: () => Promise<void>;
  stop: () => void;
  retry: () => Promise<void>;
}

export function useWebcam(): UseWebcamReturn {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const start = useCallback(async () => {
    try {
      // Request 16:9 resolution for better framing
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      setStream(mediaStream);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Camera access denied");
    }
  }, []);

  // Effect to attach stream to video element when both are available
  useEffect(() => {
    const video = videoRef.current;
    if (!stream || !video) return;

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

  // Re-run effect when videoRef.current changes
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

  const retry = useCallback(async () => {
    setError(null);
    setReady(false);
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      setStream(null);
    }
    await start();
  }, [stream, start]);

  useEffect(() => {
    return () => {
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [stream]);

  return { videoRef, stream, ready, error, start, stop, retry };
}
