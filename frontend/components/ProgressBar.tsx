"use client";

interface ProgressBarProps {
  currentState: string;
}

const STAGES = [
  { key: "intro", label: "Initialization" },
  { key: "income", label: "Fiscal Analysis" },
  { key: "documents", label: "Identity Sync" },
  { key: "assets", label: "Risk Scan" },
  { key: "close", label: "Protocol End" },
];

export default function ProgressBar({ currentState }: ProgressBarProps) {
  const currentIdx = STAGES.findIndex((s) => s.key === currentState);

  return (
    <div className="spatial-card rounded-[2.5rem] p-8 relative overflow-hidden group">
      <div className="flex items-center justify-between mb-12 relative z-10">
        <div className="flex flex-col">
          <span className="text-[10px] font-black text-accent uppercase tracking-[0.4em] opacity-60">Compliance Stream</span>
          <h4 className="text-sm font-black text-white mt-1 tracking-widest uppercase">Process Status</h4>
        </div>
        <div className="px-5 py-2 rounded-2xl bg-white/5 border border-white/10 shadow-glow-accent">
          <span className="text-[10px] font-mono text-accent font-black tracking-[0.2em]">
            {Math.round(((currentIdx + 1) / STAGES.length) * 100)}% COMPLETE
          </span>
        </div>
      </div>

      <div className="relative flex items-center justify-between px-6">
        {/* The Liquid Energy Tube */}
        <div className="absolute top-5 left-0 right-0 h-[6px] bg-slate-900/50 z-0 mx-10 rounded-full overflow-hidden">
          <div className="absolute inset-0 bg-white/5 opacity-20 animate-pulse" />
        </div>

        {/* Animated Active Liquid Flow */}
        <div
          className="absolute top-5 left-0 h-[6px] z-10 mx-10 transition-all duration-1000 ease-out rounded-full overflow-hidden"
          style={{ width: `calc(${(currentIdx / (STAGES.length - 1)) * 100}%)` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-accent via-success to-accent bg-[length:200%_100%] animate-[liquid-move_3s_linear_infinite] shadow-[0_0_20px_var(--accent)]" />
        </div>

        {STAGES.map((stage, i) => {
          const isCompleted = i < currentIdx;
          const isCurrent = i === currentIdx;

          return (
            <div key={stage.key} className="relative z-20 flex flex-col items-center group/step">
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-700 border
                  ${isCompleted
                    ? "bg-success border-success text-white shadow-glow-success rotate-12 scale-90"
                    : isCurrent
                      ? "bg-panel border-accent text-accent shadow-glow-accent scale-125 -rotate-6"
                      : "bg-black/40 border-slate-800 text-slate-600 scale-100"
                  }`}
              >
                {isCompleted ? (
                  <div className="animate-in zoom-in spin-in-90 duration-700">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                ) : (
                  <span className="text-xs font-black tracking-tighter">{i + 1}</span>
                )}

                {isCurrent && (
                  <div className="absolute inset-[-6px] rounded-3xl border border-accent/0 animate-soft-pulse pointer-events-none" />
                )}
              </div>

              <span className={`absolute -bottom-9 text-[10px] font-black transition-all duration-700 uppercase tracking-[0.2em] whitespace-nowrap
                ${isCompleted ? "text-success opacity-100" : isCurrent ? "text-white scale-110" : "text-slate-600 opacity-40 group-hover/step:opacity-100"}`}
              >
                {stage.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Footer spacer */}
      <div className="h-10" />
    </div>
  );
}
