import React, { useRef, useState, useCallback, useEffect } from "react";
import { Play, Pause, Mic } from "lucide-react";

interface VoiceMessageBubbleProps {
  audioUrl: string | null;
  duration: number; // seconds
  waveform?: number[]; // 0-100 amplitude values
  isOwn?: boolean;
}

export function VoiceMessageBubble({ audioUrl, duration, waveform, isOwn }: VoiceMessageBubbleProps) {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0); // 0-1
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const rafRef = useRef<number>(0);

  const bars = waveform && waveform.length > 0 ? waveform : Array(25).fill(30);

  const tick = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || audio.paused) return;
    setProgress(audio.duration > 0 ? audio.currentTime / audio.duration : 0);
    setCurrentTime(audio.currentTime);
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  useEffect(() => () => {
    cancelAnimationFrame(rafRef.current);
    audioRef.current?.pause();
  }, []);

  const togglePlay = useCallback(() => {
    if (!audioUrl) return;
    if (!audioRef.current) {
      audioRef.current = new Audio(audioUrl);
      audioRef.current.onended = () => { setPlaying(false); setProgress(0); setCurrentTime(0); };
      audioRef.current.onerror = () => { setPlaying(false); };
    }
    if (playing) {
      audioRef.current.pause();
      cancelAnimationFrame(rafRef.current);
      setPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setPlaying(true);
        rafRef.current = requestAnimationFrame(tick);
      }).catch(() => setPlaying(false));
    }
  }, [audioUrl, playing, tick]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  // Expired voice message
  if (!audioUrl) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 max-w-[260px]">
        <Mic className="w-4 h-4 text-gray-400 shrink-0" />
        <span className="text-xs text-gray-400 italic">Voice message expired</span>
      </div>
    );
  }

  const playedBars = Math.floor(progress * bars.length);

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-2xl max-w-[280px] ${
      isOwn
        ? "bg-blue-600 dark:bg-blue-700"
        : "bg-gray-100 dark:bg-gray-800"
    }`}>
      {/* Play/Pause */}
      <button
        type="button"
        onClick={togglePlay}
        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors ${
          isOwn
            ? "bg-white/20 hover:bg-white/30 text-white"
            : "bg-orange-500 hover:bg-orange-600 text-white"
        }`}
      >
        {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
      </button>

      {/* Waveform */}
      <div className="flex items-center gap-[2px] flex-1 min-w-0 h-8">
        {bars.map((amp, i) => {
          const h = Math.max(4, (amp / 100) * 28);
          const played = i < playedBars;
          return (
            <div
              key={i}
              className="rounded-full transition-colors duration-150"
              style={{
                width: 3,
                height: h,
                backgroundColor: played
                  ? (isOwn ? "rgba(255,255,255,0.9)" : "#f97316")
                  : (isOwn ? "rgba(255,255,255,0.3)" : "rgba(156,163,175,0.5)"),
              }}
            />
          );
        })}
      </div>

      {/* Duration */}
      <span className={`text-[10px] font-mono shrink-0 ${
        isOwn ? "text-white/70" : "text-gray-500 dark:text-gray-400"
      }`}>
        {playing ? formatTime(currentTime) : formatTime(duration)}
      </span>
    </div>
  );
}
