"use client";

import { useEffect, useRef } from "react";

interface Message {
  role: "user" | "agent";
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
    <div className="flex flex-col gap-3 h-full overflow-y-auto pr-1 scrollbar-thin">
      {messages.length === 0 && (
        <div className="flex items-center justify-center h-full">
          <p className="text-sm text-[#475569] italic">
            Conversation will appear here…
          </p>
        </div>
      )}

      {messages.map((msg, i) => (
        <div
          key={i}
          className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
        >
          <div
            className={`
              max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed
              ${msg.role === "user"
                ? "bg-[#00B4D8]/15 text-[#E2E8F0] rounded-br-md border border-[#00B4D8]/20"
                : "bg-white/5 text-[#CBD5E1] rounded-bl-md border border-white/10"
              }
            `}
          >
            <span className="block text-[10px] font-semibold uppercase tracking-wider mb-1 opacity-50">
              {msg.role === "user" ? "You" : "Credify AI"}
            </span>
            {msg.text}
          </div>
        </div>
      ))}

      <div ref={bottomRef} />
    </div>
  );
}
