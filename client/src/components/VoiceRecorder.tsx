import React, { useRef, useState, useCallback, useEffect } from "react";
import { Mic } from "lucide-react";

interface VoiceRecorderProps {
  onSend: (blob: Blob, duration: number, waveform: number[]) => void;
  disabled?: boolean;
}

export function VoiceRecorder({ onSend, disabled }: VoiceRecorderProps) {
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [cancelled, setCancelled] = useState(false);

  // All mutable state in refs so document-level listeners always see current values
  const recordingRef = useRef(false);
  const cancelledRef = useRef(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef(0);
  const startXRef = useRef(0);
  const timerRef = useRef<number>(0);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const waveformRef = useRef<number[]>([]);
  const waveformIntervalRef = useRef<number>(0);
  const streamRef = useRef<MediaStream | null>(null);
  const onSendRef = useRef(onSend);
  onSendRef.current = onSend;

  const cleanup = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (waveformIntervalRef.current) clearInterval(waveformIntervalRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    mediaRecorderRef.current = null;
    analyserRef.current = null;
    recordingRef.current = false;
    cancelledRef.current = false;
    setRecording(false);
    setElapsed(0);
    setCancelled(false);
  }, []);

  useEffect(() => cleanup, [cleanup]);

  // Document-level pointerup/touchend — fires even after re-render
  const handleGlobalUp = useCallback(() => {
    if (!recordingRef.current) return;
    const wasCancelled = cancelledRef.current;
    const recorder = mediaRecorderRef.current;

    // Stop timers and stream immediately
    if (timerRef.current) clearInterval(timerRef.current);
    if (waveformIntervalRef.current) clearInterval(waveformIntervalRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }

    if (!recorder || recorder.state === "inactive") { cleanup(); return; }

    recorder.onstop = () => {
      if (wasCancelled || chunksRef.current.length === 0) {
        console.log("🎤 VoiceRecorder: cancelled or empty");
        cleanup();
        return;
      }
      const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
      const duration = Math.max(1, Math.floor((Date.now() - startTimeRef.current) / 1000));
      const wf = waveformRef.current.length > 0 ? [...waveformRef.current] : Array(25).fill(20);
      console.log("🎤 VoiceRecorder: auto-sending, size:", blob.size, "duration:", duration);
      cleanup();
      onSendRef.current(blob, duration, wf);
    };
    recorder.stop();
  }, [cleanup]);

  // Document-level pointermove for slide-to-cancel
  const handleGlobalMove = useCallback((e: PointerEvent | TouchEvent) => {
    if (!recordingRef.current) return;
    const clientX = "touches" in e ? e.touches[0]?.clientX ?? 0 : (e as PointerEvent).clientX;
    const dx = clientX - startXRef.current;
    const isCancelled = dx < -80;
    cancelledRef.current = isCancelled;
    setCancelled(isCancelled);
  }, []);

  const startRecording = useCallback(async (clientX: number) => {
    if (disabled || recordingRef.current) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const audioCtx = new AudioContext();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      let mimeType = "audio/webm";
      if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) mimeType = "audio/webm;codecs=opus";
      else if (MediaRecorder.isTypeSupported("audio/mp4")) mimeType = "audio/mp4";
      else if (MediaRecorder.isTypeSupported("audio/ogg")) mimeType = "audio/ogg";

      const recorder = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.start(100);
      mediaRecorderRef.current = recorder;

      startTimeRef.current = Date.now();
      startXRef.current = clientX;
      waveformRef.current = [];
      cancelledRef.current = false;
      recordingRef.current = true;
      setCancelled(false);
      setRecording(true);

      timerRef.current = window.setInterval(() => {
        setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 200);

      waveformIntervalRef.current = window.setInterval(() => {
        if (!analyserRef.current) return;
        const data = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(data);
        const avg = data.reduce((a, b) => a + b, 0) / data.length / 255;
        waveformRef.current.push(Math.round(avg * 100));
        if (waveformRef.current.length > 30) waveformRef.current.shift();
      }, 100);

      // Attach document-level listeners for release detection
      document.addEventListener("pointerup", handleGlobalUp, { once: true });
      document.addEventListener("touchend", handleGlobalUp, { once: true });
      document.addEventListener("pointermove", handleGlobalMove);
      document.addEventListener("touchmove", handleGlobalMove as any);
    } catch (err) {
      console.warn("🎤 VoiceRecorder: mic access denied:", err);
      cleanup();
    }
  }, [disabled, cleanup, handleGlobalUp, handleGlobalMove]);

  // Cleanup document listeners when recording ends
  useEffect(() => {
    if (!recording) {
      document.removeEventListener("pointermove", handleGlobalMove);
      document.removeEventListener("touchmove", handleGlobalMove as any);
      document.removeEventListener("pointerup", handleGlobalUp);
      document.removeEventListener("touchend", handleGlobalUp);
    }
  }, [recording, handleGlobalMove, handleGlobalUp]);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  // While holding: show timer + slide to cancel
  if (recording) {
    return (
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <div className={`flex items-center gap-2 flex-1 px-3 py-2 rounded-full ${cancelled ? "bg-red-100 dark:bg-red-900/30" : "bg-orange-100 dark:bg-orange-900/30"}`}>
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          <span className="text-sm font-mono font-medium text-gray-900 dark:text-white">{formatTime(elapsed)}</span>
          {cancelled ? (
            <span className="text-xs text-red-500 font-medium ml-auto">Release to cancel</span>
          ) : (
            <span className="text-xs text-gray-400 ml-auto">← Slide to cancel</span>
          )}
        </div>
        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${cancelled ? "bg-red-500" : "bg-orange-500"} text-white shadow-lg`}>
          <Mic className="w-5 h-5" />
        </div>
      </div>
    );
  }

  // Idle: hold to record
  return (
    <button
      type="button"
      onPointerDown={(e) => {
        e.preventDefault();
        startRecording(e.clientX);
      }}
      onTouchStart={(e) => {
        // Fallback for iOS Safari which may not fire pointerdown reliably
        if (!recordingRef.current) {
          startRecording(e.touches[0]?.clientX ?? 0);
        }
      }}
      disabled={disabled}
      className="w-9 h-9 rounded-full flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors disabled:opacity-50 shrink-0"
      title="Hold to record voice message"
    >
      <Mic className="w-5 h-5" />
    </button>
  );
}
