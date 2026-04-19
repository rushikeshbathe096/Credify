"use client";

import React from "react";
import { motion } from "framer-motion";

export function EncryptionBadge() {
  return (
    <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-credify-cyan/10 border border-credify-cyan/20 backdrop-blur-md">
      <div className="relative">
        <div className="w-2 h-2 rounded-full bg-credify-cyan animate-pulse" />
        <div className="absolute inset-0 rounded-full border border-credify-cyan animate-ping scale-150 opacity-20" />
      </div>
      <span className="text-[10px] font-black text-credify-cyan uppercase tracking-[0.2em]">AES-256 Encrypted</span>
    </div>
  );
}

export function DataFlowViz() {
  return (
    <div className="flex gap-1 items-center h-4">
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          animate={{ height: ["20%", "100%", "20%"] }}
          transition={{ duration: 1, repeat: Infinity, delay: i * 0.1 }}
          className="w-0.5 bg-credify-cyan opacity-40 rounded-full"
        />
      ))}
    </div>
  );
}

export function SecureZKPBadge() {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
      <svg className="w-3 h-3 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
      <span className="text-[9px] font-black text-white/50 uppercase tracking-widest">ZK-Proof Verified</span>
    </div>
  );
}
