import React, { useRef, useState, useCallback, useEffect } from "react";
import { Mic, X } from "lucide-react";

interface VoiceRecorderProps {
  onSend: (blob: Blob, duration: number, waveform: number[]) => void;
  disabled?: boolean;
}

export function VoiceRecorder({ onSend, disabled }: VoiceRecorderProps) {
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [cancelled, setCancelled] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef(0);
  const timerRef = useRef<number>(0);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const waveformRef = useRef<number[]>([]);
  const waveformIntervalRef = useRef<number>(0);
  const startXRef = useRef(0);
  const streamRef = useRef<MediaStream | null>(null);

  const cleanup = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (waveformIntervalRef.current) clearInterval(waveformIntervalRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    mediaRecorderRef.current = null;
    analyserRef.current = null;
    setRecording(false);
    setElapsed(0);
    setCancelled(false);
  }, []);

  useEffect(() => cleanup, [cleanup]);

  const startRecording = useCallback(async (clientX: number) => {
    if (disabled) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Waveform analyser
      const audioCtx = new AudioContext();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      const recorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : "audio/webm",
      });
      chunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.start(100);
      mediaRecorderRef.current = recorder;

      startTimeRef.current = Date.now();
      startXRef.current = clientX;
      waveformRef.current = [];
      setCancelled(false);
      setRecording(true);

      // Timer
      timerRef.current = window.setInterval(() => {
        setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 200);

      // Sample waveform ~10x/sec → keep last 30 samples
      waveformIntervalRef.current = window.setInterval(() => {
        if (!analyserRef.current) return;
        const data = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(data);
        const avg = data.reduce((a, b) => a + b, 0) / data.length / 255;
        waveformRef.current.push(Math.round(avg * 100));
        if (waveformRef.current.length > 30) waveformRef.current.shift();
      }, 100);
    } catch (err) {
      console.warn("Mic access denied:", err);
      cleanup();
    }
  }, [disabled, cleanup]);

  const stopRecording = useCallback((wasCancelled: boolean) => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === "inactive") { cleanup(); return; }

    recorder.onstop = () => {
      if (wasCancelled || chunksRef.current.length === 0) { cleanup(); return; }
      const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
      const duration = Math.max(1, Math.floor((Date.now() - startTimeRef.current) / 1000));
      // Normalize waveform to 30 bars
      const wf = waveformRef.current.length > 0 ? waveformRef.current : Array(30).fill(20);
      onSend(blob, duration, wf);
      cleanup();
    };
    recorder.stop();
  }, [onSend, cleanup]);

  // Touch/mouse handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    startRecording(e.clientX);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!recording) return;
    const dx = e.clientX - startXRef.current;
    if (dx < -80) setCancelled(true);
    else setCancelled(false);
  };

  const handlePointerUp = () => {
    if (!recording) return;
    stopRecording(cancelled);
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

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
        <button
          type="button"
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${cancelled ? "bg-red-500" : "bg-orange-500"} text-white shadow-lg`}
        >
          {cancelled ? <X className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onPointerDown={handlePointerDown}
      disabled={disabled}
      className="w-9 h-9 rounded-full flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors disabled:opacity-50 shrink-0"
      title="Hold to record voice message"
    >
      <Mic className="w-5 h-5" />
    </button>
  );
}
