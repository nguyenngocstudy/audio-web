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
  nextChapterUrl?: string;
  onEnded?: () => void;
}

export default function AudioPlayer({
  audioUrl, title, author, coverUrl, chapterId,
  initialPosition = 0, nextChapterUrl, onEnded,
}: Props) {
  const audioRef  = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying]   = useState(false);
  const [current, setCurrent]   = useState(initialPosition);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume]     = useState(1);
  const [speed, setSpeed]       = useState(1);
  const [loading, setLoading]   = useState(true);

  // Auto-next: đọc từ localStorage, default TRUE
  const [autoNext, setAutoNext] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    const v = localStorage.getItem("setting-auto-next");
    return v === null ? true : v === "true";
  });

  // Toast countdown
  const [countdown, setCountdown] = useState<number>(0);
  const countdownRef = useRef<NodeJS.Timeout>();
  const saveTimer    = useRef<NodeJS.Timeout>();

  // ── HLS init ──────────────────────────────────────────────────────────────
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

  // ── Media Session ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!("mediaSession" in navigator)) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title, artist: author ?? "",
      artwork: coverUrl ? [{ src: coverUrl, sizes: "512x512", type: "image/jpeg" }] : [],
    });
    navigator.mediaSession.setActionHandler("play",         () => audioRef.current?.play());
    navigator.mediaSession.setActionHandler("pause",        () => audioRef.current?.pause());
    navigator.mediaSession.setActionHandler("seekbackward", () => { if (audioRef.current) audioRef.current.currentTime -= 10; });
    navigator.mediaSession.setActionHandler("seekforward",  () => { if (audioRef.current) audioRef.current.currentTime += 30; });
    if (nextChapterUrl) {
      navigator.mediaSession.setActionHandler("nexttrack", () => { window.location.href = nextChapterUrl; });
    }
  }, [title, author, coverUrl, nextChapterUrl]);

  // ── Save progress ──────────────────────────────────────────────────────────
  const saveProgress = useCallback(async (pos: number) => {
    try {
      await fetch("/api/progress", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chapterId, positionSec: Math.floor(pos) }),
      });
    } catch {}
  }, [chapterId]);

  // ── Toggle auto-next ───────────────────────────────────────────────────────
  function toggleAutoNext() {
    const next = !autoNext;
    setAutoNext(next);
    localStorage.setItem("setting-auto-next", String(next));
    // Cancel countdown if running
    if (!next) {
      clearInterval(countdownRef.current);
      setCountdown(0);
    }
  }

  // ── Cancel countdown ───────────────────────────────────────────────────────
  function cancelCountdown() {
    clearInterval(countdownRef.current);
    setCountdown(0);
  }

  // ── On ended ──────────────────────────────────────────────────────────────
  function handleEnded() {
    setPlaying(false);
    saveProgress(duration);
    onEnded?.();

    if (autoNext && nextChapterUrl) {
      setCountdown(3);
      let c = 3;
      countdownRef.current = setInterval(() => {
        c--;
        if (c <= 0) {
          clearInterval(countdownRef.current);
          setCountdown(0);
          window.location.href = nextChapterUrl;
        } else {
          setCountdown(c);
        }
      }, 1000);
    }
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
    if (!audioRef.current) return;
    playing ? audioRef.current.pause() : audioRef.current.play();
  }

  function skipForward() {
    if (nextChapterUrl) window.location.href = nextChapterUrl;
  }

  const pct = duration > 0 ? (current / duration) * 100 : 0;

  return (
    <div className="rounded-2xl border border-white/10 p-5 relative" style={{ backgroundColor: "rgba(255,255,255,0.04)" }}>

      {/* Auto-next countdown toast */}
      {countdown > 0 && nextChapterUrl && (
        <div className="absolute inset-x-4 -top-16 flex items-center justify-between px-4 py-3 rounded-xl border border-white/20 shadow-2xl z-10"
          style={{ backgroundColor: "rgba(20,20,35,0.98)", backdropFilter: "blur(12px)" }}>
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
              style={{ backgroundColor: "var(--accent)" }}>
              {countdown}
            </div>
            <span className="text-sm text-gray-300">Chuyển sang chương tiếp theo...</span>
          </div>
          <button onClick={cancelCountdown}
            className="text-xs px-3 py-1.5 rounded-lg border border-white/20 text-gray-300 hover:text-white hover:border-white/40 transition-colors">
            Huỷ
          </button>
        </div>
      )}

      {/* Title */}
      <div className="mb-4 text-center">
        <p className="font-semibold text-white text-base truncate">{title}</p>
        {author && <p className="text-sm text-gray-400 mt-0.5">{author}</p>}
      </div>

      {/* Progress bar */}
      <div className="mb-2">
        <input type="range" min={0} max={duration || 100} value={current} step={1}
          onChange={seek} className="w-full h-1 cursor-pointer"
          style={{ background: `linear-gradient(to right, var(--accent) ${pct}%, rgba(255,255,255,0.1) ${pct}%)` }} />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>{fmtDuration(Math.floor(current))}</span>
          <span>{duration ? fmtDuration(Math.floor(duration)) : "--:--"}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-6 my-4">
        <button onClick={() => { if (audioRef.current) audioRef.current.currentTime -= 10; }}
          className="p-2 text-gray-400 hover:text-white transition-colors" aria-label="Tua lùi 10s">
          <i className="ti ti-player-skip-back" style={{ fontSize: 22 }} />
        </button>

        <button onClick={togglePlay}
          className="w-14 h-14 rounded-full text-white flex items-center justify-center shadow-lg transition-all hover:scale-105 active:scale-95"
          style={{ backgroundColor: "var(--accent)" }}>
          {loading
            ? <i className="ti ti-loader-2 animate-spin" style={{ fontSize: 24 }} />
            : <i className={`ti ${playing ? "ti-player-pause-filled" : "ti-player-play-filled"}`} style={{ fontSize: 24 }} />}
        </button>

        <button onClick={skipForward} disabled={!nextChapterUrl}
          className={`p-2 transition-colors ${nextChapterUrl ? "text-gray-400 hover:text-white" : "text-gray-700 cursor-not-allowed"}`}
          aria-label="Chương tiếp">
          <i className="ti ti-player-skip-forward" style={{ fontSize: 22 }} />
        </button>
      </div>

      {/* Speed + Volume */}
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div className="flex gap-1">
          {[0.75, 1, 1.25, 1.5, 2].map(s => (
            <button key={s} onClick={() => changeSpeed(s)}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${speed === s ? "text-white" : "text-gray-500 hover:text-gray-300"}`}
              style={speed === s ? { backgroundColor: "var(--accent-light)", color: "var(--accent)" } : {}}>
              {s}x
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <i className="ti ti-volume text-gray-500" style={{ fontSize: 15 }} />
          <input type="range" min={0} max={1} step={0.05} value={volume}
            onChange={e => { setVolume(+e.target.value); if (audioRef.current) audioRef.current.volume = +e.target.value; }}
            className="w-16 h-1 cursor-pointer"
            style={{ background: `linear-gradient(to right, var(--accent) ${volume*100}%, rgba(255,255,255,0.1) ${volume*100}%)` }} />
        </div>
      </div>

      {/* Auto-next toggle — always visible */}
      <div className="flex items-center justify-between pt-3 border-t border-white/8">
        <div className="flex items-center gap-2">
          <i className="ti ti-player-track-next text-gray-400" style={{ fontSize: 16 }} />
          <span className="text-sm text-gray-300">Tự động nghe tiếp</span>
          {!nextChapterUrl && (
            <span className="text-xs text-gray-600">(Đây là chương cuối)</span>
          )}
        </div>
        <button onClick={toggleAutoNext}
          role="switch" aria-checked={autoNext}
          className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${autoNext ? "" : "bg-gray-600"}`}
          style={autoNext ? { backgroundColor: "var(--accent)" } : {}}>
          <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${autoNext ? "translate-x-5" : ""}`} />
        </button>
      </div>

      {/* Hidden audio */}
      <audio ref={audioRef} preload="metadata"
        onPlay={() => { setPlaying(true); if ("mediaSession" in navigator) navigator.mediaSession.playbackState = "playing"; }}
        onPause={() => { setPlaying(false); if ("mediaSession" in navigator) navigator.mediaSession.playbackState = "paused"; saveProgress(audioRef.current?.currentTime ?? 0); }}
        onTimeUpdate={() => { const a = audioRef.current; if (!a) return; setCurrent(a.currentTime); clearTimeout(saveTimer.current); saveTimer.current = setTimeout(() => saveProgress(a.currentTime), 10000); }}
        onLoadedMetadata={() => { if (audioRef.current) { setDuration(audioRef.current.duration); audioRef.current.currentTime = initialPosition; } }}
        onEnded={handleEnded}
        onWaiting={() => setLoading(true)}
        onCanPlay={() => {
          setLoading(false);

          const audio = audioRef.current;
          if (!audio) return;

          audio.play()
            .then(() => setPlaying(true))
            .catch(err => {
              console.log("Autoplay blocked:", err);
            });
        }}
      />
    </div>
  );
}
