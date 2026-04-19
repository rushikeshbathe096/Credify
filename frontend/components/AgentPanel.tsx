"use client";

import AIEntity from "./ai-entity/AIEntity";

interface AgentPanelProps {
  currentText: string;
  isStreaming: boolean;
  currentState: string;
}

export default function AgentPanel({ currentText, isStreaming, currentState }: AgentPanelProps) {
  const status = isStreaming ? "Speaking..." : "Listening...";

  return (
    <div className="w-[380px] h-[550px] glass-card-premium flex flex-col items-center justify-between p-10 relative overflow-hidden group">
      {/* Entity Section */}
      <div className="flex-1 flex flex-col items-center justify-center gap-8 w-full">
        <div className="relative w-[300px] h-[300px] flex items-center justify-center">
          <AIEntity state={isStreaming ? "speaking" : "idle"} />
        </div>

        {/* Status Indicator */}
        <div className="flex items-center gap-3">
          <div className={`w-1.5 h-1.5 rounded-full bg-credify-cyan ${isStreaming ? 'animate-pulse' : 'opacity-40'}`} />
          <span className="text-[11px] font-black text-credify-cyan uppercase tracking-[0.4em]">
            {status}
          </span>
        </div>
      </div>

      {/* Response Area */}
      <div className="w-full mt-6 min-h-[100px] flex flex-col items-center">
        <p className="text-sm font-black text-white/90 text-center leading-relaxed max-w-[280px]">
          {currentText || (isStreaming ? "Analyzing protocol parameters..." : "Awaiting user input...")}
        </p>
      </div>

      {/* Decorative Corner Shimmers */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-credify-cyan/5 blur-3xl rounded-full" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-credify-blue/5 blur-3xl rounded-full" />
    </div>
  );
}
