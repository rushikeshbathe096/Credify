"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface CheckmarkSequenceProps {
  isVisible: boolean;
  onComplete: () => void;
}

export default function CheckmarkSequence({ isVisible, onComplete }: CheckmarkSequenceProps) {
  const [act, setAct] = useState(0);

  useEffect(() => {
    if (isVisible) {
      setAct(1);
      // Timeline choreography
      const t1 = setTimeout(() => setAct(2), 300); // The Freeze to Pulse
      const t2 = setTimeout(() => setAct(3), 900); // Pulse to Reveal
      const t3 = setTimeout(() => {
        setAct(0);
        onComplete();
      }, 3500); // End sequence

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
      };
    }
  }, [isVisible, onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none">
          {/* Act 1 & 2: Overlay & Shockwave */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/20 backdrop-blur-sm"
          />

          {act >= 2 && (
            <motion.div
              initial={{ scale: 0.1, opacity: 1 }}
              animate={{ scale: 5, opacity: 0 }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="absolute w-[400px] h-[400px] rounded-full border-[4px] border-credify-cyan blur-md"
            />
          )}

          {/* Act 3: The Reveal */}
          {act >= 3 && (
            <div className="relative flex flex-col items-center">
              {/* Giant Checkmark */}
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="relative w-48 h-48 flex items-center justify-center"
              >
                <svg className="w-full h-full text-credify-cyan" viewBox="0 0 100 100">
                  <motion.path
                    d="M20 50 L45 75 L80 30"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1, ease: "easeInOut" }}
                  />
                </svg>
                {/* Traveling Light Glow */}
                <motion.div
                  className="absolute w-8 h-8 bg-white rounded-full blur-xl"
                  animate={{
                    x: [-40, 0, 40],
                    y: [0, 30, -30],
                  }}
                  transition={{ duration: 1, ease: "easeInOut" }}
                />
              </motion.div>

              {/* Success Card */}
              <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="mt-12 glass-card-premium p-8 border-2 border-credify-cyan/50 shadow-[0_0_50px_rgba(0,229,255,0.2)]"
              >
                <div className="flex flex-col items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-credify-cyan/10 flex items-center justify-center">
                    <svg className="w-6 h-6 text-credify-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-black text-white uppercase tracking-[0.2em]">Protocol Cleared</h2>
                  <p className="text-xs font-black text-white/50 uppercase tracking-widest text-center max-w-[280px]">
                    Identity Synchronized & Securely Encrypted
                  </p>
                </div>
                {/* Shimmer Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
              </motion.div>
            </div>
          )}

          {/* Confetti Particles */}
          {act >= 3 && (
            <div className="absolute inset-0 flex items-center justify-center">
              {[...Array(40)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ x: 0, y: 0, scale: 0 }}
                  animate={{
                    x: (Math.random() - 0.5) * 600,
                    y: (Math.random() - 0.5) * 600,
                    scale: Math.random() * 1.5,
                    rotate: Math.random() * 360,
                  }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="absolute w-2 h-2 rounded-full bg-credify-cyan"
                />
              ))}
            </div>
          )}
        </div>
      )}
    </AnimatePresence>
  );
}
