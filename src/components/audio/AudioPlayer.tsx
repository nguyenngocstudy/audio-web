"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { fmtDuration } from "@/lib/utils";

interface Props {
  audioUrl: string;
  title: string;
  author?: string;
  coverUrl?: string;
  chapterId: string;
  initialPosition?: number;
  onEnded?: () => void;
}

export default function AudioPlayer({
  audioUrl, title, author, coverUrl, chapterId, initialPosition = 0, onEnded,
}: Props) {
  const audioRef  = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying]   = useState(false);
  const [current, setCurrent]   = useState(initialPosition);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume]     = useState(1);
  const [speed, setSpeed]       = useState(1);
  const [loading, setLoading]   = useState(true);
  const saveTimer = useRef<NodeJS.Timeout>();

  /* ── HLS init ─────────────────────────────────────────────────────────── */
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    setLoading(true);
    let hlsInstance: any;

    async function init() {
      if (audioUrl.endsWith(".m3u8")) {
        const Hls = (await import("hls.js")).default;
        if (Hls.isSupported()) {
          hlsInstance = new Hls({ startPosition: initialPosition });
          hlsInstance.loadSource(audioUrl);
          hlsInstance.attachMedia(audio!);
          hlsInstance.on(Hls.Events.MANIFEST_PARSED, () => setLoading(false));
        } else if (audio!.canPlayType("application/vnd.apple.mpegurl")) {
          audio!.src = audioUrl;
          audio!.currentTime = initialPosition;
          setLoading(false);
        }
      } else {
        audio!.src = audioUrl;
        audio!.currentTime = initialPosition;
        setLoading(false);
      }
    }

    init();
    return () => { hlsInstance?.destroy(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioUrl]);

  /* ── Media Session API (lock screen) ──────────────────────────────────── */
  useEffect(() => {
    if (!("mediaSession" in navigator)) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title,
      artist: author ?? "",
      artwork: coverUrl ? [{ src: coverUrl, sizes: "512x512", type: "image/jpeg" }] : [],
    });
    navigator.mediaSession.setActionHandler("play",         () => audioRef.current?.play());
    navigator.mediaSession.setActionHandler("pause",        () => audioRef.current?.pause());
    navigator.mediaSession.setActionHandler("seekbackward", () => { if (audioRef.current) audioRef.current.currentTime -= 10; });
    navigator.mediaSession.setActionHandler("seekforward",  () => { if (audioRef.current) audioRef.current.currentTime += 30; });
  }, [title, author, coverUrl]);

  /* ── Save progress ────────────────────────────────────────────────────── */
  const saveProgress = useCallback(async (pos: number) => {
    try {
      await fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chapterId, positionSec: Math.floor(pos) }),
      });
    } catch {}
  }, [chapterId]);

  function onTimeUpdate() {
    const a = audioRef.current;
    if (!a) return;
    setCurrent(a.currentTime);
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => saveProgress(a.currentTime), 10000);
  }

  function seek(e: React.ChangeEvent<HTMLInputElement>) {
    const a = audioRef.current;
    if (!a) return;
    a.currentTime = Number(e.target.value);
    setCurrent(Number(e.target.value));
  }

  function changeSpeed(s: number) {
    setSpeed(s);
    if (audioRef.current) audioRef.current.playbackRate = s;
  }

  function togglePlay() {
    const a = audioRef.current;
    if (!a) return;
    playing ? a.pause() : a.play();
  }

  const pct = duration > 0 ? (current / duration) * 100 : 0;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="mb-4 text-center">
        <p className="font-semibold text-gray-800 text-base truncate">{title}</p>
        {author && <p className="text-sm text-gray-400 mt-0.5">{author}</p>}
      </div>

      {/* Progress */}
      <div className="mb-2">
        <input
          type="range" min={0} max={duration || 100} value={current} step={1}
          onChange={seek} className="w-full h-1 accent-brand-600"
          style={{ background: `linear-gradient(to right, #7c3aed ${pct}%, #e5e7eb ${pct}%)` }}
        />
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>{fmtDuration(Math.floor(current))}</span>
          <span>{duration ? fmtDuration(Math.floor(duration)) : "--:--"}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-5 my-4">
        <button onClick={() => { if (audioRef.current) audioRef.current.currentTime -= 10; }}
          className="p-2 text-gray-500 hover:text-brand-600 transition-colors" aria-label="Tua lùi 10s">
          <i className="ti ti-player-skip-back" style={{ fontSize: 22 }} />
        </button>
        <button onClick={togglePlay}
          className="w-14 h-14 rounded-full bg-brand-600 hover:bg-brand-700 text-white flex items-center justify-center shadow-md transition-colors"
          aria-label={playing ? "Tạm dừng" : "Phát"}>
          {loading
            ? <i className="ti ti-loader-2 animate-spin" style={{ fontSize: 24 }} />
            : <i className={`ti ${playing ? "ti-player-pause" : "ti-player-play"}`} style={{ fontSize: 24 }} />
          }
        </button>
        <button onClick={() => { if (audioRef.current) audioRef.current.currentTime += 30; }}
          className="p-2 text-gray-500 hover:text-brand-600 transition-colors" aria-label="Tua tới 30s">
          <i className="ti ti-player-skip-forward" style={{ fontSize: 22 }} />
        </button>
      </div>

      {/* Speed + Volume */}
      <div className="flex items-center justify-between mt-2">
        <div className="flex gap-1">
          {[0.75, 1, 1.25, 1.5, 2].map(s => (
            <button key={s} onClick={() => changeSpeed(s)}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${speed === s ? "bg-brand-100 text-brand-700" : "text-gray-400 hover:bg-gray-100"}`}>
              {s}x
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <i className="ti ti-volume text-gray-400" style={{ fontSize: 16 }} />
          <input type="range" min={0} max={1} step={0.05} value={volume}
            onChange={e => { setVolume(+e.target.value); if (audioRef.current) audioRef.current.volume = +e.target.value; }}
            className="w-20 h-1 accent-brand-600" />
        </div>
      </div>

      {/* Hidden audio */}
      <audio
        ref={audioRef}
        preload="metadata"
        onPlay={() => { setPlaying(true); if ("mediaSession" in navigator) navigator.mediaSession.playbackState = "playing"; }}
        onPause={() => { setPlaying(false); if ("mediaSession" in navigator) navigator.mediaSession.playbackState = "paused"; saveProgress(audioRef.current?.currentTime ?? 0); }}
        onTimeUpdate={onTimeUpdate}
        onLoadedMetadata={() => { if (audioRef.current) { setDuration(audioRef.current.duration); audioRef.current.currentTime = initialPosition; } }}
        onEnded={() => { setPlaying(false); saveProgress(duration); onEnded?.(); }}
        onWaiting={() => setLoading(true)}
        onCanPlay={() => setLoading(false)}
      />
    </div>
  );
}
