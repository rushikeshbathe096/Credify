// hooks/useSession.ts
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface SessionState {
  sessionId: string | null;
  token: string | null;
  isValid: boolean;
}

/**
 * Reads session_id and token from sessionStorage.
 * Returns isValid = true if both exist and token is not expired.
 * Redirects to "/" if invalid (unless redirect is disabled).
 */
export function useSession(redirect = true): SessionState {
  const router = useRouter();
  const [state, setState] = useState<SessionState>({
    sessionId: null,
    token: null,
    isValid: false,
  });

  useEffect(() => {
    const sessionId = sessionStorage.getItem("session_id");
    const token = sessionStorage.getItem("token");

    let isValid = false;

    if (sessionId && token) {
      try {
        // Decode JWT payload (base64) to check expiry — no verification needed client-side
        const payloadB64 = token.split(".")[1];
        const payload = JSON.parse(atob(payloadB64));
        const exp = payload.exp * 1000; // JWT exp is in seconds
        isValid = Date.now() < exp;
      } catch {
        isValid = false;
      }
    }

    setState({ sessionId, token, isValid });

    if (!isValid && redirect) {
      router.push("/");
    }
  }, [redirect, router]);

  return state;
}
