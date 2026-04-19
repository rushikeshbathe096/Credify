"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

export default function Landing() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const startApplication = async () => {
    setLoading(true);
    try {
      const { data } = await api.post("/api/sessions/create");
      sessionStorage.setItem("session_id", data.session_id);
      sessionStorage.setItem("token", data.token);
      router.push("/call");
    } catch (err) {
      console.error("Failed to create session:", err);
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 bg-[#050D1E]">
      {/* Glow background effect */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[#00B4D8]/5 blur-[120px] pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center text-center max-w-2xl">
        {/* Logo / Brand */}
        <div className="mb-8 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00B4D8] to-[#0077B6] flex items-center justify-center">
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
              />
            </svg>
          </div>
          <span className="text-2xl font-bold text-white tracking-tight">
            Credify
          </span>
        </div>

        {/* Heading */}
        <h1 className="text-5xl font-bold text-white leading-tight">
          Your AI Loan Officer
        </h1>

        {/* Subheading */}
        <p className="text-xl text-[#64748B] mt-4 max-w-md">
          AI-powered loan onboarding in 15 minutes.
          <br />
          Every decision explained.
        </p>

        {/* Feature pills */}
        <div className="flex flex-wrap justify-center gap-3 mt-8">
          {["Voice Interview", "Document Scan", "Instant Decision"].map(
            (feat) => (
              <span
                key={feat}
                className="px-4 py-1.5 text-sm rounded-full bg-white/5 text-[#94A3B8] border border-white/10"
              >
                {feat}
              </span>
            )
          )}
        </div>

        {/* CTA */}
        <button
          id="start-application-btn"
          onClick={startApplication}
          disabled={loading}
          className="mt-10 bg-[#00B4D8] text-white px-8 py-4 rounded-lg text-lg font-semibold
                     hover:opacity-90 cursor-pointer transition-all duration-200
                     disabled:opacity-50 disabled:cursor-not-allowed
                     shadow-lg shadow-[#00B4D8]/20"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg
                className="w-5 h-5 animate-spin"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Setting up your session…
            </span>
          ) : (
            "Start My Application"
          )}
        </button>

        {/* Trust line */}
        <p className="mt-6 text-xs text-[#475569]">
          🔒 End-to-end encrypted · No hidden fees · Your data never sold
        </p>
      </div>
    </main>
  );
}
