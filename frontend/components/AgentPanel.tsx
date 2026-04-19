"use client";

interface AgentPanelProps {
  currentText: string;
  isStreaming: boolean;
  currentState: string;
}

const STATE_LABELS: Record<string, string> = {
  intro: "Introduction",
  income: "Income Verification",
  documents: "Document Check",
  assets: "Assets & Liabilities",
  close: "Wrapping Up",
};

export default function AgentPanel({
  currentText,
  isStreaming,
  currentState,
}: AgentPanelProps) {
  return (
    <div className="bg-gradient-to-br from-[#0A1628] to-[#0D1B2A] rounded-2xl border border-white/10 p-5 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00B4D8] to-[#0077B6] flex items-center justify-center">
            <svg
              className="w-4 h-4 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"
              />
            </svg>
          </div>
          <div>
            <span className="text-sm font-semibold text-white">Credify AI</span>
            <span className="block text-[10px] text-[#64748B]">
              {STATE_LABELS[currentState] || currentState}
            </span>
          </div>
        </div>

        {isStreaming && (
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-[#00B4D8]/10">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00B4D8] animate-pulse" />
            <span className="text-[10px] font-medium text-[#00B4D8]">
              Thinking
            </span>
          </div>
        )}
      </div>

      {/* Response area */}
      <div className="min-h-[100px] max-h-[200px] overflow-y-auto">
        {currentText ? (
          <p className="text-sm leading-relaxed text-[#CBD5E1]">
            {currentText}
            {isStreaming && (
              <span className="inline-block w-0.5 h-4 bg-[#00B4D8] ml-0.5 animate-pulse align-middle" />
            )}
          </p>
        ) : (
          <p className="text-sm text-[#475569] italic">
            Waiting for AI response…
          </p>
        )}
      </div>
    </div>
  );
}
