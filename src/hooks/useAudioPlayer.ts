"use client";
import { useState, useRef, useCallback } from "react";

export function useAudioPlayer({ chapterId, initialPosition = 0 }: { chapterId: string; initialPosition?: number }) {
  const audioRef                    = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying]       = useState(false);
  const [current, setCurrent]       = useState(initialPosition);
  const [duration, setDuration]     = useState(0);
  const [loading, setLoading]       = useState(true);
  const [speed, setSpeed]           = useState(1);
  const saveRef                     = useRef<NodeJS.Timeout>();

  const saveProgress = useCallback(async (pos: number) => {
    try {
      await fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chapterId, positionSec: Math.floor(pos) }),
      });
    } catch {}
  }, [chapterId]);

  const togglePlay = useCallback(() => {
    if (!audioRef.current) return;
    playing ? audioRef.current.pause() : audioRef.current.play();
  }, [playing]);

  const seek = useCallback((sec: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = sec;
    setCurrent(sec);
  }, []);

  const changeSpeed = useCallback((s: number) => {
    setSpeed(s);
    if (audioRef.current) audioRef.current.playbackRate = s;
  }, []);

  return { audioRef, playing, current, duration, loading, speed,
    togglePlay, seek, changeSpeed, saveProgress, setPlaying,
    setCurrent, setDuration, setLoading, saveRef };
}
