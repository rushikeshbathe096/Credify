"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function CallContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-white p-4 sm:p-8">
      <div className="max-w-4xl w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl flex flex-col items-center">
        
        <header className="w-full flex flex-col md:flex-row md:items-center justify-between mb-8 pb-6 border-b border-slate-800/60">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Secure Consultation</h1>
            <p className="text-slate-400">Please wait while we establish your direct connection.</p>
          </div>
          
          <div className="mt-4 md:mt-0">
            {sessionId ? (
              <div className="px-4 py-3 bg-indigo-950/40 border border-indigo-900/50 rounded-xl flex items-center space-x-3">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase tracking-widest font-bold text-indigo-400/80">Active Session</span>
                  <span className="font-mono text-sm text-indigo-100">{sessionId}</span>
                </div>
              </div>
            ) : (
              <div className="px-4 py-3 bg-amber-950/40 border border-amber-900/50 rounded-xl">
                <span className="font-medium text-amber-500 text-sm">No session ID provided</span>
              </div>
            )}
          </div>
        </header>

        <section className="w-full aspect-video bg-slate-950 border-2 border-slate-800 border-dashed rounded-2xl flex items-center justify-center relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5"></div>
          
          <div className="relative z-10 flex flex-col items-center space-y-5 animate-pulse">
            <div className="w-20 h-20 rounded-full bg-slate-800/80 flex items-center justify-center ring-4 ring-slate-800/50">
              <svg className="w-10 h-10 text-slate-400 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-xl text-slate-300 font-medium tracking-wide">Video call will start here</p>
          </div>
        </section>

      </div>
    </main>
  );
}

export default function CallPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-slate-950 text-indigo-400">
        <svg className="w-8 h-8 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    }>
      <CallContent />
    </Suspense>
  );
}
