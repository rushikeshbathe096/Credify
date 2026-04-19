"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/hooks/useSession";
import { useDeepgram } from "@/hooks/useDeepgram";
import api from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";

import UserCamera from "@/components/UserCamera";
import AgentPanel from "@/components/AgentPanel";
import TranscriptFeed from "@/components/TranscriptFeed";
import ProgressBar from "@/components/ProgressBar";
import AadhaarOverlay from "@/components/AadhaarOverlay";
import AIEntity from "@/components/ai-entity/AIEntity";
import CheckmarkSequence from "@/components/CheckmarkSequence";
import { EncryptionBadge, DataFlowViz, SecureZKPBadge } from "@/components/TrustEngineering";

interface Message {
  role: "user" | "agent" | "system";
  text: string;
}

interface AadhaarFields {
  name?: string | null;
  dob?: string | null;
  gender?: string | null;
  uid_last4?: string | null;
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

  const [layoutMode, setLayoutMode] = useState<"intro" | "conversation">("intro");
  const [showCheckmark, setShowCheckmark] = useState(false);
  const [showAadhaarOverlay, setShowAadhaarOverlay] = useState(false);
  const [aadhaarFields, setAadhaarFields] = useState<AadhaarFields | null>(null);

  const agentBufferRef = useRef("");

  const onTranscript = useCallback((msg: { text: string; is_final: boolean }) => {
    if (msg.is_final && msg.text.trim()) {
      setMessages((prev) => [...prev, { role: "user", text: msg.text }]);
    }
  }, []);

  const onAgentToken = useCallback((msg: { token: string; done: boolean }) => {
    if (msg.done) {
      const fullText = agentBufferRef.current;
      if (fullText.trim()) {
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
      const display = agentBufferRef.current.replace(/\[STATE:\w+\]/g, "").trim();
      setCurrentAgentText(display);
    }
  }, []);

  const onStateChange = useCallback((msg: { state: string }) => {
    setCurrentState(msg.state);
    if (msg.state === "assets") setShowCheckmark(true);
    if (msg.state === "documents") setShowAadhaarOverlay(true);
  }, []);

  const onError = useCallback((msg: string) => {
    console.error("[Call] Error:", msg);
  }, []);

  useEffect(() => {
    if (!sessionId || !isValid) return;
    let cancelled = false;
    async function init() {
      try {
        await api.post(`/api/sessions/${sessionId}/start`);
        if (!cancelled) {
          setTimeout(() => { if (!cancelled) connect(); }, 1000);
        }
      } catch (err) { console.error("Failed to start session:", err); }
    }
    init();
    return () => { cancelled = true; };
  }, [sessionId, isValid]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleEndCall = async () => {
    setIsEnding(true);
    try {
      disconnect();
      if (sessionId) await api.post(`/api/sessions/${sessionId}/close`);
      router.push("/offer");
    } catch (err) { setIsEnding(false); }
  };

  const { isConnected, connect, disconnect, sendSystemMessage } = useDeepgram({
    sessionId,
    onTranscript,
    onAgentToken,
    onStateChange,
    onCallEnded: handleEndCall,
    onError,
  });

  if (!isValid) return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-credify-navy text-white">
      <div className="text-center p-10 glass-card-premium">
        <h2 className="text-2xl font-black mb-4">Establishing Secure Link...</h2>
        <div className="w-12 h-12 border-2 border-credify-cyan border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    </main>
  );

  return (
    <main className="min-h-screen bg-credify-navy flex flex-col font-sans relative overflow-hidden">
      <div className="aurora-bg" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,229,255,0.05)_0%,transparent_70%)] pointer-events-none" />

      <header className="flex items-center justify-between px-10 py-6 border-b border-white/5 bg-background/20 backdrop-blur-3xl sticky top-0 z-50">
        <div className="flex items-center gap-4 group cursor-default">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-credify-cyan via-credify-blue to-[#0077B6] flex items-center justify-center shadow-[0_0_30px_rgba(0,229,255,0.3)] group-hover:scale-110 transition-transform duration-500">
            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-black text-white tracking-[0.3em] uppercase leading-none">Credify</h1>
            <p className="text-[9px] font-black text-credify-cyan tracking-[0.4em] uppercase mt-1">Experimental AI Pipeline</p>
          </div>
        </div>

        <div className="flex items-center gap-8">
          <EncryptionBadge />
          <div className="hidden lg:flex items-center gap-4 px-6 py-2.5 rounded-full bg-white/5 border border-white/10">
            <DataFlowViz />
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-credify-cyan animate-pulse shadow-[0_0_10px_rgba(0,229,255,0.8)]' : 'bg-slate-600'}`} />
            <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">{isConnected ? "Link_Secure" : "Link_Establishing"}</span>
          </div>
          <button
            onClick={handleEndCall}
            className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all duration-300"
          >
            <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </header>

      <div className="flex-1 relative">
        <AnimatePresence mode="wait">
          {layoutMode === "intro" ? (
            <motion.div key="intro" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.1, filter: "blur(20px)" }} transition={{ duration: 0.8 }} className="absolute inset-0 flex flex-col items-center justify-center p-10">
              <div className="w-[400px] h-[400px] mb-12 relative flex items-center justify-center"><AIEntity state="idle" /></div>
              <div className="text-center space-y-8">
                <h2 className="text-5xl font-black text-white tracking-tighter uppercase leading-tight">Master_Intelligence <br /><span className="text-credify-cyan text-glow">Protocol_Active</span></h2>
                <button onClick={() => setLayoutMode("conversation")} className="px-12 py-6 rounded-[2rem] bg-credify-cyan text-credify-navy font-black uppercase text-sm tracking-[0.4em] hover:scale-105 active:scale-95 transition-all duration-300 shadow-[0_0_50px_rgba(0,229,255,0.4)]">Start Application</button>
              </div>
            </motion.div>
          ) : (
            <motion.div key="conversation" initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="flex h-full gap-10 p-10 max-w-[2000px] mx-auto w-full">
              <div className="flex-[3.5] flex flex-col gap-10">
                <AgentPanel currentText={currentAgentText} isStreaming={isStreaming} currentState={currentState} />
                <div className="relative rounded-[2.5rem] overflow-hidden border-2 border-credify-cyan/20 p-1 bg-black/40 backdrop-blur-md">
                  <UserCamera />
                  <div className="absolute top-6 left-6 z-20 px-3 py-1.5 rounded-lg bg-black/60 border border-white/10 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-credify-cyan animate-pulse" />
                    <span className="text-[9px] font-black text-white uppercase tracking-widest">Live_Secure_Stream</span>
                  </div>
                </div>
                <div className="flex-1 flex items-end"><ProgressBar currentState={currentState} /></div>
              </div>

              <div className="flex-[6.5] flex flex-col bg-white/[0.03] backdrop-blur-3xl rounded-[3rem] border border-white/5 p-10 relative overflow-hidden h-[80vh]">
                <div className="flex items-center justify-between mb-10">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em]">Conversation_Buffer</span>
                    <span className="text-xs font-mono text-credify-cyan mt-1 tracking-tight">E2EE_BLOCK_0x92f...</span>
                  </div>
                  <SecureZKPBadge />
                </div>
                <div className="flex-1 overflow-y-auto pr-4 disappear-scrollbar"><TranscriptFeed messages={messages} /></div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {showAadhaarOverlay && sessionId && (
        <AadhaarOverlay
          sessionId={sessionId}
          onVerified={(fields) => {
            setAadhaarFields(fields);
            setShowAadhaarOverlay(false);
            setMessages((p) => [...p, { role: "system", text: "Identity Verified" }]);
            sendSystemMessage("Aadhaar verified successfully.");
          }}
          onSkip={() => setShowAadhaarOverlay(false)}
        />
      )}

      {aadhaarFields && (
        <div className="fixed bottom-10 left-10 z-[60] w-[300px] animate-in slide-in-from-left-10 duration-700">
          <div className="glass-card-premium p-6 border-success/30">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center border border-success/20">
                <svg className="w-5 h-5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
              </div>
              <span className="text-[10px] font-black text-white uppercase tracking-widest">Biometric Match</span>
            </div>
            <p className="text-sm font-black text-white truncate">{aadhaarFields.name}</p>
            <p className="text-[10px] font-mono text-white/40 mt-1">ID_HASH: **** **** {aadhaarFields.uid_last4}</p>
          </div>
        </div>
      )}

      <CheckmarkSequence isVisible={showCheckmark} onComplete={() => setShowCheckmark(false)} />
    </main>
  );
}
