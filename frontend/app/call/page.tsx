"use client";

import Link from "next/link";
import { useSession } from "@/hooks/useSession";

export default function CallPage() {
  const { sessionId, isValid } = useSession();

  if (!isValid) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-[#050D1E] px-6">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-red-500/10 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-white">Invalid Session</h2>
          <p className="text-[#64748B]">
            Your session has expired or is missing. Please start again.
          </p>
          <Link
            href="/"
            className="inline-block mt-4 bg-[#00B4D8] text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity"
          >
            Back to Home
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#050D1E] px-6">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/10 flex items-center justify-center">
          <svg
            className="w-8 h-8 text-emerald-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-white">Session Active</h2>
        <p className="text-[#94A3B8] font-mono text-sm break-all">
          {sessionId}
        </p>
        <p className="text-[#64748B] text-sm">
          Video interview will be wired here in Phase 2.
        </p>
      </div>
    </main>
  );
}
