"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    __credifyStream?: MediaStream;
  }
}

export default function UserCamera() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;

    async function startCamera() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, facingMode: "user" },
          audio: true,
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        // Store globally so useDeepgram can access the audio track
        window.__credifyStream = stream;
      } catch (err) {
        console.error("Camera access denied:", err);
      }
    }

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
      window.__credifyStream = undefined;
    };
  }, []);

  return (
    <div className="relative w-full aspect-[4/3] bg-panel rounded-3xl overflow-hidden border-2 border-white/5 shadow-2xl group transition-all duration-700 hover:shadow-[0_0_50px_rgba(0,180,216,0.2)]">
      {/* Suble Glow Overlay */}
      <div className="absolute inset-0 bg-gradient-to-tr from-accent/5 to-transparent pointer-events-none z-10" />

      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover grayscale-[10%] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-[1.5s] ease-out user-camera-video"
      />

      {/* Live badge */}
      <div className="absolute top-5 left-5 flex items-center gap-3 bg-black/40 backdrop-blur-xl px-4 py-2 rounded-2xl border border-white/10 z-20 shadow-2xl animate-in slide-in-from-left-4 duration-1000">
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]"></span>
        </span>
        <span className="text-[11px] font-black text-white tracking-[0.2em] uppercase">Secure Live Feed</span>
      </div>

      {/* Decorative corners - Apple Style */}
      <div className="absolute top-4 right-4 text-[10px] font-mono text-white/30 tracking-widest z-20">
        CH_01 // ACTIVE
      </div>

      <div className="absolute inset-0 border-[20px] border-black/10 pointer-events-none z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
    </div>
  );
}
