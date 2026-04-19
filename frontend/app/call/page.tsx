"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/hooks/useSession";
import { useDeepgram } from "@/hooks/useDeepgram";
import api from "@/lib/api";

import UserCamera from "@/components/UserCamera";
import AgentPanel from "@/components/AgentPanel";
import TranscriptFeed from "@/components/TranscriptFeed";
import ProgressBar from "@/components/ProgressBar";
import AadhaarOverlay from "@/components/AadhaarOverlay";

interface Message {
  role: "user" | "agent" | "system";
  text: string;
}

interface AadhaarFields {
  name?: string | null;
  dob?: string | null;
  gender?: string | null;
  uid_last4?: string | null;
  address_city?: string | null;
  extraction_confidence?: string;
}

export default function CallPage() {
  const router = useRouter();
  const { sessionId, isValid } = useSession();

  const [messages, setMessages] = useState<Message[]>([]);
  const [currentAgentText, setCurrentAgentText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentState, setCurrentState] = useState("intro");
  const [isEnding, setIsEnding] = useState(false);

  // Phase 3: Aadhaar overlay state
  const [showAadhaarOverlay, setShowAadhaarOverlay] = useState(false);
  const [aadhaarFields, setAadhaarFields] = useState<AadhaarFields | null>(null);

  // Use a ref to accumulate streaming text (avoids stale closure issues)
  const agentBufferRef = useRef("");

  const onTranscript = useCallback(
    (msg: { text: string; is_final: boolean }) => {
      if (msg.is_final && msg.text.trim()) {
        setMessages((prev) => [...prev, { role: "user", text: msg.text }]);
      }
    },
    []
  );

  const onAgentToken = useCallback(
    (msg: { token: string; done: boolean }) => {
      if (msg.done) {
        // Agent finished — push the complete message to chat
        const fullText = agentBufferRef.current;
        if (fullText.trim()) {
          // Strip [STATE:xxx] tags from display text
          const cleanText = fullText.replace(/\[STATE:\w+\]/g, "").trim();
          if (cleanText) {
            setMessages((prev) => [...prev, { role: "agent", text: cleanText }]);
          }
        }
        setCurrentAgentText("");
        agentBufferRef.current = "";
        setIsStreaming(false);
      } else {
        setIsStreaming(true);
        agentBufferRef.current += msg.token;
        // Strip state tags from the displayed streaming text
        const display = agentBufferRef.current.replace(/\[STATE:\w+\]/g, "").trim();
        setCurrentAgentText(display);
      }
    },
    []
  );

  const onStateChange = useCallback((msg: { state: string }) => {
    setCurrentState(msg.state);

    // Phase 3: Trigger Aadhaar overlay when entering documents state
    if (msg.state === "documents") {
      setShowAadhaarOverlay(true);
    }
  }, []);

  const onError = useCallback((msg: string) => {
    console.error("[Call] Error:", msg);
  }, []);

  const { isConnected, connect, disconnect } = useDeepgram({
    sessionId,
    onTranscript,
    onAgentToken,
    onStateChange,
    onError,
  });

  // On mount: start session and connect WebSocket
  useEffect(() => {
    if (!sessionId || !isValid) return;

    let cancelled = false;

    async function init() {
      try {
        // Activate session
        await api.post(`/api/sessions/${sessionId}/start`);

        if (!cancelled) {
          // Small delay to let camera initialize
          setTimeout(() => {
            if (!cancelled) connect();
          }, 1000);
        }
      } catch (err) {
        console.error("Failed to start session:", err);
      }
    }

    init();

    return () => {
      cancelled = true;
    };
  }, [sessionId, isValid]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleEndCall = async () => {
    setIsEnding(true);
    try {
      disconnect();
      if (sessionId) {
        await api.post(`/api/sessions/${sessionId}/close`);
      }
      router.push("/offer");
    } catch (err) {
      console.error("Failed to close session:", err);
      setIsEnding(false);
    }
  };

  // ── Invalid session screen ──────────────────────────────
  if (!isValid) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-[#050D1E] px-6">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-red-500/10 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-white">Invalid Session</h2>
          <p className="text-[#64748B]">Your session has expired or is missing.</p>
          <a
            href="/"
            className="inline-block mt-4 bg-[#00B4D8] text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity"
          >
            Back to Home
          </a>
        </div>
      </main>
    );
  }

  // ── Main call UI ────────────────────────────────────────
  return (
    <main className="min-h-screen bg-[#050D1E] flex flex-col">
      {/* Top bar */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#00B4D8] to-[#0077B6] flex items-center justify-center">
            <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
          </div>
          <span className="text-sm font-bold text-white">Credify</span>
        </div>

        <div className="flex items-center gap-3">
          {/* Connection indicator */}
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-white/5 text-xs">
            <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? "bg-emerald-400" : "bg-yellow-400 animate-pulse"}`} />
            <span className="text-[#94A3B8]">{isConnected ? "Connected" : "Connecting…"}</span>
          </div>

          {/* End call button */}
          <button
            id="end-call-btn"
            onClick={handleEndCall}
            disabled={isEnding}
            className="bg-red-500/10 text-red-400 border border-red-500/20 px-4 py-1.5 rounded-lg text-sm font-medium
                     hover:bg-red-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isEnding ? "Ending…" : "End Call"}
          </button>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex flex-col lg:flex-row gap-4 p-4 lg:p-6 overflow-hidden relative">
        {/* LEFT: Camera + Transcript */}
        <div className="flex flex-col gap-4 lg:w-1/2 min-h-0 relative">
          <UserCamera />

          {/* Phase 3: Aadhaar Overlay - positioned over the camera area */}
          {showAadhaarOverlay && sessionId && (
            <AadhaarOverlay
              sessionId={sessionId}
              onVerified={(fields) => {
                setAadhaarFields(fields);
                setShowAadhaarOverlay(false);
                // Add system confirmation message
                setMessages((prev) => [
                  ...prev,
                  { role: "system", text: "✓ Aadhaar verified successfully" },
                ]);
              }}
              onSkip={() => {
                setShowAadhaarOverlay(false);
                setMessages((prev) => [
                  ...prev,
                  { role: "system", text: "⏭ Aadhaar verification skipped" },
                ]);
              }}
            />
          )}

          <div className="flex-1 bg-[#0A1628] rounded-2xl border border-white/10 p-4 overflow-hidden flex flex-col min-h-[200px]">
            <h3 className="text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-3">
              Conversation
            </h3>
            <div className="flex-1 overflow-y-auto">
              <TranscriptFeed messages={messages} />
            </div>
          </div>
        </div>

        {/* RIGHT: Agent + Progress */}
        <div className="flex flex-col gap-4 lg:w-1/2 min-h-0">
          <AgentPanel
            currentText={currentAgentText}
            isStreaming={isStreaming}
            currentState={currentState}
          />
          <ProgressBar currentState={currentState} />

          {/* Aadhaar fields summary (shows after verification) */}
          {aadhaarFields && (
            <div className="bg-[#0A1628] rounded-2xl border border-emerald-500/20 p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <svg className="w-3 h-3 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </span>
                <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                  Aadhaar Verified
                </span>
              </div>
              <div className="space-y-1.5">
                {aadhaarFields.name && (
                  <div className="flex justify-between text-xs">
                    <span className="text-[#64748B]">Name</span>
                    <span className="text-[#CBD5E1]">{String(aadhaarFields.name)}</span>
                  </div>
                )}
                {aadhaarFields.uid_last4 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-[#64748B]">Aadhaar</span>
                    <span className="text-[#CBD5E1]">•••• {String(aadhaarFields.uid_last4)}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Session info */}
          <div className="bg-[#0A1628] rounded-2xl border border-white/10 p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#475569]">Session</span>
              <span className="text-xs font-mono text-[#64748B] truncate max-w-[200px]">
                {sessionId}
              </span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
