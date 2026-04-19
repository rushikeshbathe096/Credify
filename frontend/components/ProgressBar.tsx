"use client";

interface ProgressBarProps {
  currentState: string;
}

const STAGES = [
  { key: "intro", label: "Intro" },
  { key: "income", label: "Income" },
  { key: "documents", label: "Docs" },
  { key: "assets", label: "Assets" },
  { key: "close", label: "Close" },
];

export default function ProgressBar({ currentState }: ProgressBarProps) {
  const currentIdx = STAGES.findIndex((s) => s.key === currentState);

  return (
    <div className="bg-[#0A1628] rounded-2xl border border-white/10 p-4 shadow-lg">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">
          Progress
        </span>
        <span className="text-xs font-mono text-[#64748B]">
          {currentIdx + 1}/{STAGES.length}
        </span>
      </div>

      {/* Track */}
      <div className="flex items-center gap-1">
        {STAGES.map((stage, i) => {
          const isCompleted = i < currentIdx;
          const isCurrent = i === currentIdx;

          return (
            <div key={stage.key} className="flex-1 flex flex-col items-center gap-1.5">
              {/* Bar segment */}
              <div className="w-full h-1.5 rounded-full overflow-hidden bg-white/5">
                <div
                  className={`h-full rounded-full transition-all duration-700 ease-out ${isCompleted
                      ? "w-full bg-gradient-to-r from-[#00B4D8] to-[#0097B2]"
                      : isCurrent
                        ? "w-1/2 bg-[#00B4D8] animate-pulse"
                        : "w-0"
                    }`}
                />
              </div>

              {/* Label */}
              <span
                className={`text-[10px] font-medium transition-colors duration-300 ${isCompleted
                    ? "text-[#00B4D8]"
                    : isCurrent
                      ? "text-white"
                      : "text-[#475569]"
                  }`}
              >
                {stage.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
