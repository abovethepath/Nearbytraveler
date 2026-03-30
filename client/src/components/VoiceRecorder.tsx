import React, { useRef, useState, useCallback, useEffect } from "react";
import { Mic, X, Send } from "lucide-react";

interface VoiceRecorderProps {
  onSend: (blob: Blob, duration: number, waveform: number[]) => void;
  disabled?: boolean;
}

export function VoiceRecorder({ onSend, disabled }: VoiceRecorderProps) {
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [hasRecording, setHasRecording] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef(0);
  const timerRef = useRef<number>(0);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const waveformRef = useRef<number[]>([]);
  const waveformIntervalRef = useRef<number>(0);
  const streamRef = useRef<MediaStream | null>(null);
  const blobRef = useRef<Blob | null>(null);
  const durationRef = useRef(0);

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
    setHasRecording(false);
    setElapsed(0);
    blobRef.current = null;
  }, []);

  useEffect(() => cleanup, [cleanup]);

  const startRecording = useCallback(async () => {
    if (disabled) return;
    try {
      console.log('🎤 VoiceRecorder: requesting mic access');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const audioCtx = new AudioContext();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      // Try multiple MIME types for cross-browser support
      let mimeType = 'audio/webm';
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) mimeType = 'audio/webm;codecs=opus';
      else if (MediaRecorder.isTypeSupported('audio/mp4')) mimeType = 'audio/mp4';
      else if (MediaRecorder.isTypeSupported('audio/ogg')) mimeType = 'audio/ogg';

      console.log('🎤 VoiceRecorder: using MIME type:', mimeType);
      const recorder = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.start(100);
      mediaRecorderRef.current = recorder;

      startTimeRef.current = Date.now();
      waveformRef.current = [];
      setRecording(true);
      setHasRecording(false);

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
    } catch (err) {
      console.warn('🎤 VoiceRecorder: mic access denied:', err);
      cleanup();
    }
  }, [disabled, cleanup]);

  const stopRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === 'inactive') { cleanup(); return; }

    // Stop timers and stream
    if (timerRef.current) clearInterval(timerRef.current);
    if (waveformIntervalRef.current) clearInterval(waveformIntervalRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }

    recorder.onstop = () => {
      if (chunksRef.current.length === 0) { cleanup(); return; }
      const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
      const dur = Math.max(1, Math.floor((Date.now() - startTimeRef.current) / 1000));
      console.log('🎤 VoiceRecorder: recording complete, blob size:', blob.size, 'duration:', dur);
      blobRef.current = blob;
      durationRef.current = dur;
      setRecording(false);
      setHasRecording(true);
    };
    recorder.stop();
  }, [cleanup]);

  const sendRecording = useCallback(() => {
    if (!blobRef.current) return;
    const wf = waveformRef.current.length > 0 ? [...waveformRef.current] : Array(25).fill(20);
    console.log('🎤 VoiceRecorder: sending blob to onSend, size:', blobRef.current.size);
    onSend(blobRef.current, durationRef.current, wf);
    blobRef.current = null;
    setHasRecording(false);
    setElapsed(0);
  }, [onSend]);

  const cancelRecording = useCallback(() => {
    if (recording) {
      const recorder = mediaRecorderRef.current;
      if (recorder && recorder.state !== 'inactive') recorder.stop();
    }
    cleanup();
  }, [recording, cleanup]);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  // After recording: show send/cancel buttons
  if (hasRecording) {
    return (
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-1 px-3 py-2 rounded-full bg-green-100 dark:bg-green-900/30">
          <Mic className="w-4 h-4 text-green-600" />
          <span className="text-sm font-mono font-medium text-gray-900 dark:text-white">{formatTime(durationRef.current)}</span>
          <span className="text-xs text-green-600 dark:text-green-400 ml-auto">Ready to send</span>
        </div>
        <button type="button" onClick={cancelRecording}
          className="w-9 h-9 rounded-full flex items-center justify-center bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 shrink-0">
          <X className="w-4 h-4" />
        </button>
        <button type="button" onClick={sendRecording}
          className="w-9 h-9 rounded-full flex items-center justify-center bg-green-600 hover:bg-green-700 text-white shrink-0 shadow-lg">
          <Send className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // While recording: show timer and stop button
  if (recording) {
    return (
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-1 px-3 py-2 rounded-full bg-orange-100 dark:bg-orange-900/30">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          <span className="text-sm font-mono font-medium text-gray-900 dark:text-white">{formatTime(elapsed)}</span>
          <span className="text-xs text-gray-400 ml-auto">Recording...</span>
        </div>
        <button type="button" onClick={cancelRecording}
          className="w-9 h-9 rounded-full flex items-center justify-center bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 shrink-0">
          <X className="w-4 h-4" />
        </button>
        <button type="button" onClick={stopRecording}
          className="w-9 h-9 rounded-full flex items-center justify-center bg-orange-500 text-white shrink-0 shadow-lg">
          <Mic className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // Idle: show mic button
  return (
    <button
      type="button"
      onClick={startRecording}
      disabled={disabled}
      className="w-9 h-9 rounded-full flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors disabled:opacity-50 shrink-0"
      title="Tap to record voice message"
    >
      <Mic className="w-5 h-5" />
    </button>
  );
}
