"use client";

import { useCallback, useEffect, useState } from "react";
import { signInAnonymously, onAuthStateChanged } from "firebase/auth";
import { getFirebaseAuth } from "./firebase";
import { setAuthToken, setDebugUserId } from "./api";

const isDebugMode = process.env.NEXT_PUBLIC_AUTH_DEBUG === "true";

interface UseAuthReturn {
  ready: boolean;
  userId: string | null;
  error: string | null;
}

export function useAuth(): UseAuthReturn {
  const [ready, setReady] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const initDebug = useCallback(() => {
    const debugId = "debug-user-001";
    setDebugUserId(debugId);
    setUserId(debugId);
    setReady(true);
  }, []);

  useEffect(() => {
    if (isDebugMode) {
      initDebug();
      return;
    }

    const auth = getFirebaseAuth();
    if (!auth) {
      setError("Firebase not configured");
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const token = await user.getIdToken();
        setAuthToken(token);
        setUserId(user.uid);
        setReady(true);
      } else {
        try {
          await signInAnonymously(auth);
        } catch (e) {
          setError(e instanceof Error ? e.message : "Auth failed");
        }
      }
    });

    return () => unsubscribe();
  }, [initDebug]);

  return { ready, userId, error };
}
