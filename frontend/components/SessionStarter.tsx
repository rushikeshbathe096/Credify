"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SessionStarter() {
  const router = useRouter();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const startSession = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch("http://localhost:8000/start-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Checking for session_id in the JSON response
      if (data.session_id) {
        setSessionId(data.session_id);
        router.push(`/call?session_id=${data.session_id}`);
      } else {
        throw new Error("Invalid response from server: Missing session_id properties");
      }
      
    } catch (e: any) {
      console.error("Session start error:", e);
      setError(e.message || "Failed to start session");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl max-w-md w-full">
      <div className="flex flex-col space-y-6">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white mb-1">Session Management</h2>
          <p className="text-sm text-slate-400">Initialize a new secure connection with the backend.</p>
        </div>
        
        {/* Status Display Area */}
        <div className="min-h-[80px] flex flex-col justify-center">
          {sessionId ? (
            <div className="p-4 rounded-xl bg-indigo-950/40 text-indigo-300 border border-indigo-900/50 transition-all">
              <div className="flex flex-col space-y-1 group">
                <div className="flex items-center space-x-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                  </span>
                  <span className="text-xs uppercase tracking-wider font-semibold text-indigo-400">Active Session ID</span>
                </div>
                <span className="font-mono text-lg break-all selection:bg-indigo-500/30">
                  {sessionId}
                </span>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/50 border-dashed text-slate-500 text-sm italic flex items-center justify-center h-[74px]">
              No active session
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-4 text-sm rounded-xl bg-red-950/50 text-red-400 border border-red-900/50 flex items-start space-x-3">
            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}
        
        {/* Action Button */}
        <button
          onClick={startSession}
          disabled={loading}
          className={`
            relative overflow-hidden group
            w-full py-3.5 px-4 rounded-xl font-medium transition-all duration-300
            focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900
            ${loading 
              ? 'bg-slate-800 text-slate-400 cursor-wait border border-slate-700' 
              : 'bg-indigo-600 text-white hover:bg-indigo-500 hover:shadow-[0_0_20px_rgba(79,70,229,0.4)] shadow-md border border-indigo-500'
            }
          `}
        >
          {loading ? (
            <div className="flex items-center justify-center space-x-3">
              <svg className="w-5 h-5 animate-spin text-indigo-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Authenticating...</span>
            </div>
          ) : (
             <span className="relative z-10 flex items-center justify-center space-x-2">
                <span>Start New Session</span>
                <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
             </span>
          )}
        </button>
      </div>
    </div>
  );
}
