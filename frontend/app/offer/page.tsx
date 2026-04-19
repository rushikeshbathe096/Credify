"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/hooks/useSession";
import api from "@/lib/api";
import { useRouter } from "next/navigation";

interface Reason {
  factor: string;
  impact: "positive" | "negative" | "neutral";
  detail: string;
  confidence: number;
}

interface OfferData {
  offer: {
    principal: number;
    rate: number;
    emi: number;
    tenure: number;
    status: string;
  };
  risk: {
    score: number;
    decision: string;
    reasons: Reason[];
  };
  fields: Record<string, any>;
}

export default function OfferPage() {
  const { sessionId, isValid } = useSession();
  const router = useRouter();

  const [data, setData] = useState<OfferData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId || !isValid) return;

    let retries = 0;
    const fetchOffer = async () => {
      try {
        const res = await api.get(`/api/sessions/${sessionId}/offer`);
        setData(res.data);
        setLoading(false);
      } catch (err: any) {
        // Simple polling logic in case it's not ready immediately
        if (err.response?.status === 400 && retries < 15) {
          retries++;
          setTimeout(fetchOffer, 2000);
        } else {
          console.error(err);
          setError("Failed to fetch offer. The session may not have completed successfully.");
          setLoading(false);
        }
      }
    };

    fetchOffer();
  }, [sessionId, isValid]);

  if (!isValid) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#050D1E]">
        <p className="text-white">Invalid session. Please return to home.</p>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-[#050D1E]">
        <div className="w-12 h-12 border-4 border-[#00B4D8]/30 border-t-[#00B4D8] rounded-full animate-spin"></div>
        <p className="mt-4 text-slate-400">Analyzing your interview and generating offer...</p>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-[#050D1E] px-4 text-center">
        <div className="text-red-400 mb-4 text-5xl">⚠️</div>
        <h2 className="text-xl text-white font-bold mb-2">Offer Not Ready</h2>
        <p className="text-slate-400">{error || "Unknown error occurred"}</p>
        <button onClick={() => router.push("/")} className="mt-6 px-6 py-2 bg-indigo-600 rounded-md text-white">Back Home</button>
      </main>
    );
  }

  const isRejected = data.risk.decision === "Reject";

  return (
    <main className="min-h-screen bg-[#050D1E] py-16 px-4 md:px-8 text-white flex justify-center">
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Left Column: The Offer */}
        <div className="flex flex-col gap-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Your Application Result</h1>
            <p className="text-slate-400">Decision details based on your interview.</p>
          </div>

          <OfferCard offer={data.offer} isRejected={isRejected} />
          
          <div className="bg-[#0A1628] rounded-2xl border border-white/10 p-6">
            <h3 className="text-lg font-semibold mb-4 text-slate-200">Summary of Provided Data</h3>
            <div className="space-y-2 text-sm text-slate-400">
              <div className="flex justify-between"><span className="text-slate-500">Declared Income:</span> <span>₹{data.fields.monthly_income?.value || 0}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Existing EMIs:</span> <span>₹{data.fields.existing_emis?.value || 0}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Identity:</span> <span>{data.fields.doc_verified?.value ? "Verified" : "Unverified"}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Employment:</span> <span>{data.fields.employment_type?.value || "N/A"}</span></div>
            </div>
          </div>
        </div>

        {/* Right Column: Explanation */}
        <div className="flex flex-col gap-6">
          <div className="bg-[#0A1628] rounded-2xl border border-white/10 p-6 flex flex-col h-full">
            <h2 className="text-xl font-bold mb-6 text-slate-100 flex items-center gap-2">
              <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Why this decision?
            </h2>

            <RiskScoreBar score={data.risk.score} />
            <div className="mt-8">
              <ExplanationList reasons={data.risk.reasons} />
            </div>
            
            <button
              onClick={() => router.push("/")}
              className="mt-auto pt-8 flex items-center justify-center text-indigo-400 hover:text-indigo-300 font-medium"
            >
              Return to Dashboard <span className="ml-2">→</span>
            </button>
          </div>
        </div>
        
      </div>
    </main>
  );
}

// --- Components ---

function OfferCard({ offer, isRejected }: { offer: any; isRejected: boolean }) {
  if (isRejected) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-8 text-center flex flex-col items-center justify-center">
        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
          <span className="text-2xl">🛑</span>
        </div>
        <h2 className="text-2xl font-bold text-red-100 mb-2">Application Declined</h2>
        <p className="text-red-400/80 mb-6 max-w-sm">We regret to inform you that we cannot proceed with your loan request at this time based on the assessed risk criteria.</p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-[#00b4d820] to-[#0077b620] border border-[#00B4D8]/30 rounded-2xl p-6 relative overflow-hidden">
      {offer.status === "Under Review" && (
        <span className="absolute top-4 right-4 bg-amber-500/20 text-amber-400 text-xs px-2 py-1 rounded border border-amber-500/20">Manual Review Required</span>
      )}
      {offer.status === "Approved" && (
        <span className="absolute top-4 right-4 bg-emerald-500/20 text-emerald-400 text-xs px-2 py-1 rounded border border-emerald-500/20">Pre-Approved</span>
      )}
      
      <p className="text-[#00B4D8] font-medium text-sm mb-1 uppercase tracking-wider">Eligible Loan Amount</p>
      <h2 className="text-5xl font-bold text-white mb-6">₹{offer.principal.toLocaleString("en-IN")}</h2>
      
      <div className="grid grid-cols-2 gap-4 mt-6">
        <div className="bg-[#050D1E]/50 p-4 rounded-xl border border-white/5">
          <p className="text-slate-400 text-xs uppercase tracking-wide">Interest Rate</p>
          <p className="text-2xl font-medium text-white mt-1">{offer.rate}% <span className="text-sm text-slate-500">p.a.</span></p>
        </div>
        <div className="bg-[#050D1E]/50 p-4 rounded-xl border border-white/5">
          <p className="text-slate-400 text-xs uppercase tracking-wide">Tenure</p>
          <p className="text-2xl font-medium text-white mt-1">{offer.tenure} <span className="text-sm text-slate-500">months</span></p>
        </div>
      </div>
      
      <div className="mt-4 bg-[#00B4D8]/10 p-4 rounded-xl border border-[#00B4D8]/20 flex justify-between items-center">
        <p className="text-slate-300 font-medium tracking-wide">Monthly EMI</p>
        <p className="text-2xl font-bold text-[#00B4D8]">₹{offer.emi.toLocaleString("en-IN")}</p>
      </div>
      
      <button className="w-full mt-6 bg-[#00B4D8] text-white py-3 rounded-xl font-bold text-lg hover:bg-[#0096B4] transition-colors shadow-[0_0_15px_rgba(0,180,216,0.3)]">
        Accept & Proceed
      </button>
    </div>
  );
}

function ExplanationList({ reasons }: { reasons: Reason[] }) {
  if (!reasons || reasons.length === 0) return null;
  
  return (
    <div className="space-y-4">
      {reasons.map((r, i) => {
        const isPos = r.impact === "positive";
        const isNeg = r.impact === "negative";
        const icon = isPos ? "✓" : isNeg ? "✕" : "ℹ";
        const colorClass = isPos ? "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" 
                         : isNeg ? "text-red-400 bg-red-400/10 border-red-400/20"
                         : "text-amber-400 bg-amber-400/10 border-amber-400/20";
        
        return (
          <div key={i} className={`flex items-start gap-4 p-3 rounded-lg border ${colorClass} bg-opacity-50`}>
            <div className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-xs mt-0.5" style={{ backgroundColor: 'currentColor', color: '#0A1628' }}>
              {icon}
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-end mb-1">
                <span className="font-semibold text-white">{r.factor}</span>
                <span className="text-[10px] uppercase font-bold tracking-wider opacity-60">Conf: {Math.round(r.confidence * 100)}%</span>
              </div>
              <p className="text-sm opacity-90 leading-snug text-slate-200">{r.detail}</p>
            </div>
          </div>
        )
      })}
    </div>
  );
}

function RiskScoreBar({ score }: { score: number }) {
  // score is 0.0 (safest) to 1.0 (riskiest)
  const percent = Math.min(Math.max(score * 100, 0), 100);
  
  let color = "bg-emerald-400";
  let label = "Low Risk";
  if (score > 0.4) { color = "bg-amber-400"; label = "Moderate Risk"; }
  if (score > 0.7) { color = "bg-red-400"; label = "High Risk"; }

  return (
    <div>
      <div className="flex justify-between items-end mb-2">
        <span className="text-xs uppercase tracking-widest text-slate-400 font-bold">Assessed Risk Level</span>
        <span className={`text-sm font-bold ${color.replace('bg-','text-')}`}>{label}</span>
      </div>
      <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden flex relative">
        <div className={`h-full ${color} transition-all duration-1000 ease-out rounded-full`} style={{ width: `${percent}%` }} />
      </div>
      <div className="flex justify-between mt-1 text-[10px] text-slate-500 font-medium px-1">
        <span>Safest</span>
        <span>Riskiest</span>
      </div>
    </div>
  );
}
