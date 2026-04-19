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
    <div className="relative w-full aspect-[4/3] bg-black rounded-2xl overflow-hidden border border-white/10 shadow-lg shadow-black/40">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover user-camera-video"
      />
      {/* Live badge */}
      <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-full">
        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
        <span className="text-xs font-medium text-white/90">LIVE</span>
      </div>
    </div>
  );
}
