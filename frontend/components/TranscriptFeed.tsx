"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";

interface Message {
  role: "user" | "agent" | "system";
  text: string;
}

interface TranscriptFeedProps {
  messages: Message[];
}

export default function TranscriptFeed({ messages }: TranscriptFeedProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex flex-col gap-10 h-full overflow-y-auto custom-scrollbar pr-4 relative">
      {messages.length === 0 && (
        <div className="flex flex-col items-center justify-center h-full opacity-10 py-20">
          <div className="w-16 h-16 border border-dashed border-white/20 rounded-full animate-spin-slow mb-4" />
          <p className="text-[10px] font-black uppercase tracking-[0.5em] text-white">Establishing Link</p>
        </div>
      )}

      {messages.map((msg, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: msg.role === "user" ? 20 : -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className={`flex flex-col ${msg.role === "user" ? "items-end text-right" : "items-start text-left"}`}
        >
          {msg.role === "system" ? (
            <div className="w-full flex justify-center py-4">
              <div className="px-6 py-2 rounded-full bg-credify-cyan/5 border border-credify-cyan/20 text-[9px] font-black text-credify-cyan uppercase tracking-[0.3em]">
                {msg.text}
              </div>
            </div>
          ) : (
            <div className={`group flex flex-col ${msg.role === "user" ? "items-end" : "items-start"} max-w-[85%] relative`}>
              {/* Timestamp & Meta */}
              <div className="flex items-center gap-2 mb-3 px-1">
                <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">
                  {msg.role === "user" ? "Client_Protocol" : "Intelligence_Node"}
                </span>
                <div className={`w-1 h-1 rounded-full ${msg.role === "user" ? "bg-credify-cyan" : "bg-credify-blue"}`} />
              </div>

              {/* Message Bubble */}
              <div
                className={`
                  p-6 rounded-2xl text-[15px] leading-relaxed relative border-l-2
                  ${msg.role === "user"
                    ? "bg-white/[0.06] text-white border-credify-cyan/50 shadow-[0_10px_30px_rgba(0,0,0,0.1)] rounded-tr-none"
                    : "bg-gradient-to-br from-credify-blue/[0.08] to-credify-cyan/[0.08] text-slate-100 border-credify-blue/50 rounded-tl-none backdrop-blur-3xl"
                  }
                `}
              >
                <p className="font-medium tracking-tight whitespace-pre-wrap">{msg.text}</p>

                {/* Decorative Micro-Glow */}
                <div className={`absolute -top-1 -left-1 w-2 h-2 rounded-full blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-500
                   ${msg.role === "user" ? "bg-credify-cyan" : "bg-credify-blue"}`} />
              </div>
            </div>
          )}
        </motion.div>
      ))}
      <div ref={bottomRef} className="h-4" />
    </div>
  );
}
