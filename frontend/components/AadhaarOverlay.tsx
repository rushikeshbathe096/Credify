"use client";

import { useState, useCallback } from "react";
import api from "@/lib/api";

interface AadhaarFields {
  name?: string | null;
  dob?: string | null;
  gender?: string | null;
  uid_last4?: string | null;
  extraction_confidence?: string;
}

interface AadhaarOverlayProps {
  sessionId: string;
  onVerified: (fields: AadhaarFields) => void;
  onSkip: () => void;
}

type OverlayState = "waiting" | "capturing" | "done" | "failed";

export default function AadhaarOverlay({
  sessionId,
  onVerified,
  onSkip,
}: AadhaarOverlayProps) {
  const [state, setState] = useState<OverlayState>("waiting");
  const [extractedFields, setExtractedFields] = useState<AadhaarFields | null>(null);

  const [errorDetail, setErrorDetail] = useState<string | null>(null);

  const handleCapture = useCallback(async () => {
    setState("capturing");
    setErrorDetail(null);

    try {
      // Grab the video element from UserCamera
      const video = document.querySelector<HTMLVideoElement>(
        ".user-camera-video"
      );
      if (!video) {
        console.error("Video element not found");
        setErrorDetail("Camera video element not found");
        setState("failed");
        return;
      }

      // Ensure video is actually playing with valid frame data
      if (video.readyState < 2) {
        console.error("Video not ready, readyState:", video.readyState);
        setErrorDetail("Camera is still loading — please wait a moment and try again");
        setState("failed");
        return;
      }

      // Use the video's actual intrinsic dimensions (not hardcoded)
      const vw = video.videoWidth || 640;
      const vh = video.videoHeight || 480;

      if (vw === 0 || vh === 0) {
        console.error("Video has zero dimensions:", vw, vh);
        setErrorDetail("Camera stream has no video data");
        setState("failed");
        return;
      }

      // Create canvas and draw current video frame at native resolution
      const canvas = document.createElement("canvas");
      canvas.width = vw;
      canvas.height = vh;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        setErrorDetail("Could not create canvas context");
        setState("failed");
        return;
      }
      ctx.drawImage(video, 0, 0, vw, vh);

      // Convert canvas to high-quality JPEG blob
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", 0.95)
      );
      if (!blob || blob.size < 1000) {
        console.error("Blob too small:", blob?.size);
        setErrorDetail("Captured image appears blank — ensure camera is active");
        setState("failed");
        return;
      }

      console.log(`Captured frame: ${vw}x${vh}, blob size: ${blob.size} bytes`);

      // Send to backend
      const formData = new FormData();
      formData.append("frame", blob, "aadhaar_capture.jpg");

      const response = await api.post(`/api/cv/doc/${sessionId}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const data = response.data;

      // Check for backend OCR errors
      if (data._error) {
        console.error("Backend OCR error:", data._error);
        setErrorDetail(data._error);
        setState("failed");
        return;
      }

      if (data.extraction_confidence !== "low") {
        setExtractedFields(data);
        setState("done");
        // Auto-close after 2 seconds
        setTimeout(() => {
          onVerified(data);
        }, 2000);
      } else {
        setErrorDetail("Could not extract enough fields — ensure the full card is visible with good lighting");
        setState("failed");
      }
    } catch (err: unknown) {
      console.error("Aadhaar capture error:", err);
      const msg = err instanceof Error ? err.message : String(err);
      setErrorDetail(`Request failed: ${msg}`);
      setState("failed");
    }
  }, [sessionId, onVerified]);

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Card */}
      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="bg-gradient-to-br from-[#0A1628] to-[#0D1B2A] rounded-2xl border border-white/10 shadow-2xl shadow-black/50 overflow-hidden">
          {/* Header strip */}
          <div className="h-1 bg-gradient-to-r from-[#00B4D8] via-[#6366F1] to-[#00B4D8]" />

          <div className="p-6">
            {/* ── WAITING ── */}
            {state === "waiting" && (
              <div className="space-y-5">
                {/* Icon */}
                <div className="flex justify-center">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#00B4D8]/20 to-[#6366F1]/20 border border-[#00B4D8]/30 flex items-center justify-center">
                    <svg
                      className="w-8 h-8 text-[#00B4D8]"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z"
                      />
                    </svg>
                  </div>
                </div>

                {/* Title */}
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-white mb-1">
                    Aadhaar Verification
                  </h3>
                  <p className="text-sm text-[#94A3B8] leading-relaxed">
                    Hold your Aadhaar card clearly in front of the camera, then
                    click capture.
                  </p>
                </div>

                {/* Guide frame indicator */}
                <div className="border-2 border-dashed border-[#00B4D8]/30 rounded-xl p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#00B4D8]/10 flex items-center justify-center shrink-0">
                    <svg
                      className="w-5 h-5 text-[#00B4D8]"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-[#CBD5E1]">
                      Position your card
                    </p>
                    <p className="text-[10px] text-[#64748B]">
                      Ensure good lighting &amp; all text is visible
                    </p>
                  </div>
                </div>

                {/* Buttons */}
                <div className="space-y-2.5">
                  <button
                    id="aadhaar-capture-btn"
                    onClick={handleCapture}
                    className="w-full py-3 rounded-xl font-semibold text-sm text-white cursor-pointer
                             bg-gradient-to-r from-[#00B4D8] to-[#0077B6]
                             hover:from-[#00C4E8] hover:to-[#0087C6]
                             shadow-lg shadow-[#00B4D8]/25
                             transition-all duration-200 active:scale-[0.98]"
                  >
                    📸 Capture &amp; Verify
                  </button>
                  <button
                    id="aadhaar-skip-btn"
                    onClick={onSkip}
                    className="w-full py-2.5 rounded-xl text-sm font-medium cursor-pointer
                             text-[#64748B] hover:text-[#94A3B8]
                             bg-white/5 hover:bg-white/10
                             border border-white/5 hover:border-white/10
                             transition-all duration-200"
                  >
                    Skip for now
                  </button>
                </div>
              </div>
            )}

            {/* ── CAPTURING ── */}
            {state === "capturing" && (
              <div className="space-y-5 py-4">
                <div className="flex justify-center">
                  <div className="w-16 h-16 rounded-2xl bg-[#00B4D8]/10 flex items-center justify-center">
                    <svg
                      className="w-8 h-8 text-[#00B4D8] animate-spin"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                  </div>
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-white mb-1">
                    Reading your Aadhaar card…
                  </h3>
                  <p className="text-sm text-[#64748B]">
                    AI is extracting details from your document
                  </p>
                </div>
                {/* Animated dots */}
                <div className="flex justify-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#00B4D8] animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 rounded-full bg-[#00B4D8] animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 rounded-full bg-[#00B4D8] animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}

            {/* ── DONE ── */}
            {state === "done" && extractedFields && (
              <div className="space-y-5 py-2">
                <div className="flex justify-center">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
                    <svg
                      className="w-8 h-8 text-emerald-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-emerald-400 mb-1">
                    Aadhaar Verified ✓
                  </h3>
                  <p className="text-sm text-[#64748B]">
                    Document details extracted successfully
                  </p>
                </div>

                {/* Extracted fields preview */}
                <div className="bg-white/5 rounded-xl border border-white/10 p-4 space-y-2">
                  {extractedFields.name && (
                    <div className="flex justify-between text-sm">
                      <span className="text-[#64748B]">Name</span>
                      <span className="text-[#CBD5E1] font-medium">
                        {String(extractedFields.name)}
                      </span>
                    </div>
                  )}
                  {extractedFields.dob && (
                    <div className="flex justify-between text-sm">
                      <span className="text-[#64748B]">DOB</span>
                      <span className="text-[#CBD5E1] font-medium">
                        {String(extractedFields.dob)}
                      </span>
                    </div>
                  )}
                  {extractedFields.gender && (
                    <div className="flex justify-between text-sm">
                      <span className="text-[#64748B]">Gender</span>
                      <span className="text-[#CBD5E1] font-medium">
                        {extractedFields.gender === "M" ? "Male" : "Female"}
                      </span>
                    </div>
                  )}
                  {extractedFields.uid_last4 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-[#64748B]">Aadhaar</span>
                      <span className="text-[#CBD5E1] font-medium">
                        •••• •••• {String(extractedFields.uid_last4)}
                      </span>
                    </div>
                  )}
                </div>

                <p className="text-center text-xs text-[#475569]">
                  Closing automatically…
                </p>
              </div>
            )}

            {/* ── FAILED ── */}
            {state === "failed" && (
              <div className="space-y-5 py-4">
                <div className="flex justify-center">
                  <div className="w-16 h-16 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center">
                    <svg
                      className="w-8 h-8 text-red-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                      />
                    </svg>
                  </div>
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-red-400 mb-1">
                    Could not read card
                  </h3>
                  <p className="text-sm text-[#64748B] leading-relaxed">
                    {errorDetail ||
                      "Please ensure the card is well-lit and all text is clearly visible, then try again."}
                  </p>
                </div>
                <div className="space-y-2.5">
                  <button
                    id="aadhaar-retry-btn"
                    onClick={() => setState("waiting")}
                    className="w-full py-3 rounded-xl font-semibold text-sm text-white cursor-pointer
                             bg-gradient-to-r from-[#00B4D8] to-[#0077B6]
                             hover:from-[#00C4E8] hover:to-[#0087C6]
                             shadow-lg shadow-[#00B4D8]/25
                             transition-all duration-200 active:scale-[0.98]"
                  >
                    🔄 Try Again
                  </button>
                  <button
                    id="aadhaar-skip-failed-btn"
                    onClick={onSkip}
                    className="w-full py-2.5 rounded-xl text-sm font-medium cursor-pointer
                             text-[#64748B] hover:text-[#94A3B8]
                             bg-white/5 hover:bg-white/10
                             border border-white/5 hover:border-white/10
                             transition-all duration-200"
                  >
                    Skip for now
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
