"use client";

import { useState, useEffect } from "react";

export default function HealthCheck() {
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await fetch("http://localhost:8000/health");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        // Assuming the backend successfully returns "ok" or similar
        setStatus("ok");
      } catch (e: any) {
        setError(e.message || "Failed to connect to backend");
      } finally {
        setLoading(false);
      }
    };

    checkHealth();
  }, []);

  if (loading) {
    return (
      <div className="p-4 rounded-lg bg-slate-800 text-slate-300 animate-pulse border border-slate-700 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-4 h-4 bg-slate-500 rounded-full animate-bounce"></div>
          <span>Checking backend status...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-lg bg-red-950/50 text-red-400 border border-red-900/50 shadow-sm">
        <div className="flex items-center space-x-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <span className="font-semibold">Backend Error:</span>
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 rounded-lg bg-emerald-950/40 text-emerald-400 border border-emerald-900/50 shadow-sm transition-all hover:bg-emerald-950/60 cursor-default">
      <div className="flex items-center space-x-2">
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
        </span>
        <span className="font-medium tracking-wide">
          Backend Status: {status}
        </span>
      </div>
    </div>
  );
}
