// hooks/useDeepgram.ts
"use client";

import { useEffect, useRef, useCallback, useState } from "react";

export interface TranscriptMessage {
  text: string;
  is_final: boolean;
}

export interface AgentTokenMessage {
  token: string;
  done: boolean;
}

export interface StateChangeMessage {
  state: string;
}

interface UseDeepgramOptions {
  sessionId: string | null;
  onTranscript: (msg: TranscriptMessage) => void;
  onAgentToken: (msg: AgentTokenMessage) => void;
  onStateChange: (msg: StateChangeMessage) => void;
  onError?: (msg: string) => void;
}

export function useDeepgram({
  sessionId,
  onTranscript,
  onAgentToken,
  onStateChange,
  onError,
}: UseDeepgramOptions) {
  const wsRef = useRef<WebSocket | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Store latest callbacks in refs to avoid re-connecting on callback changes
  const onTranscriptRef = useRef(onTranscript);
  const onAgentTokenRef = useRef(onAgentToken);
  const onStateChangeRef = useRef(onStateChange);
  const onErrorRef = useRef(onError);

  onTranscriptRef.current = onTranscript;
  onAgentTokenRef.current = onAgentToken;
  onStateChangeRef.current = onStateChange;
  onErrorRef.current = onError;

  const connect = useCallback(() => {
    if (!sessionId) return;

    const backendUrl =
      process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
    const wsUrl = backendUrl
      .replace(/^http/, "ws")
      .replace(/\/$/, "");

    const ws = new WebSocket(`${wsUrl}/ws/transcribe/${sessionId}`);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("[WS] Connected to transcription service");
      setIsConnected(true);

      // Start sending audio once connected
      startAudioCapture(ws);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        switch (data.type) {
          case "transcript":
            onTranscriptRef.current(data.payload);
            break;
          case "agent_token":
            onAgentTokenRef.current(data.payload);
            break;
          case "state_change":
            onStateChangeRef.current(data.payload);
            break;
          case "error":
            onErrorRef.current?.(data.payload.message);
            break;
          case "pong":
            break;
          default:
            console.log("[WS] Unknown message type:", data.type);
        }
      } catch (err) {
        console.error("[WS] Failed to parse message:", err);
      }
    };

    ws.onerror = (err) => {
      console.error("[WS] Error:", err);
      onErrorRef.current?.("WebSocket connection error");
    };

    ws.onclose = () => {
      console.log("[WS] Disconnected");
      setIsConnected(false);
      stopAudioCapture();
    };
  }, [sessionId]);

  const startAudioCapture = (ws: WebSocket) => {
    // Wait for the global stream from UserCamera
    const waitForStream = () => {
      const stream = window.__credifyStream;
      if (!stream) {
        setTimeout(waitForStream, 200);
        return;
      }

      // Create an AudioContext to get raw PCM data
      const audioContext = new AudioContext({ sampleRate: 16000 });
      const source = audioContext.createMediaStreamSource(stream);
      const processor = audioContext.createScriptProcessor(4096, 1, 1);

      processor.onaudioprocess = (e) => {
        if (ws.readyState !== WebSocket.OPEN) return;

        const inputData = e.inputBuffer.getChannelData(0);
        // Convert Float32 to Int16 (linear16)
        const pcmData = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          const s = Math.max(-1, Math.min(1, inputData[i]));
          pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
        }

        ws.send(pcmData.buffer);
      };

      source.connect(processor);
      processor.connect(audioContext.destination);

      // Store cleanup refs
      (wsRef.current as any).__audioContext = audioContext;
      (wsRef.current as any).__processor = processor;
      (wsRef.current as any).__source = source;
    };

    waitForStream();
  };

  const stopAudioCapture = () => {
    const ws = wsRef.current as any;
    if (ws?.__processor) {
      ws.__processor.disconnect();
      ws.__source?.disconnect();
      ws.__audioContext?.close();
    }
    if (recorderRef.current) {
      recorderRef.current.stop();
      recorderRef.current = null;
    }
  };

  const disconnect = useCallback(() => {
    stopAudioCapture();
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return { isConnected, connect, disconnect };
}
