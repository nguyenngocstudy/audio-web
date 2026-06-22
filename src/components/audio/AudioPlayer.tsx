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
  const [playing, setPlaying]       = useState(false);
  const [current, setCurrent]       = useState(initialPosition);
  const [duration, setDuration]     = useState(0);
  const [volume, setVolume]         = useState(1);
  const [speed, setSpeed]           = useState(1);
  const [loading, setLoading]       = useState(true);
  // Track nếu user đã interact (để phép autoplay)
  const [userInteracted, setUserInteracted] = useState(false);
  // AutoPlay blocked error
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);

  const [autoNext, setAutoNext] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    const v = localStorage.getItem("setting-auto-next");
    return v === null ? true : v === "true";
  });

  const [countdown, setCountdown]   = useState(0);
  const countdownRef = useRef<NodeJS.Timeout>();
  const saveTimer    = useRef<NodeJS.Timeout>();

  // ── HLS init ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    setLoading(true);
    setAutoplayBlocked(false);
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
    navigator.mediaSession.setActionHandler("play",         () => handlePlay());
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

  // ── Play with autoplay error handling ─────────────────────────────────────
  async function handlePlay() {
    const audio = audioRef.current;
    if (!audio) return;
    try {
      await audio.play();
      setUserInteracted(true);
      setAutoplayBlocked(false);
    } catch (err: any) {
      if (err?.name === "NotAllowedError") {
        // Autoplay blocked - show play button, wait for user click
        setAutoplayBlocked(true);
        setPlaying(false);
        console.log("[AudioPlayer] Autoplay blocked - waiting for user interaction");
      } else {
        console.error("[AudioPlayer] Play error:", err);
      }
    }
  }

  function togglePlay() {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
    } else {
      handlePlay();
    }
  }

  function toggleAutoNext() {
    const next = !autoNext;
    setAutoNext(next);
    localStorage.setItem("setting-auto-next", String(next));
    if (!next) { clearInterval(countdownRef.current); setCountdown(0); }
  }

  function cancelCountdown() {
    clearInterval(countdownRef.current);
    setCountdown(0);
  }

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

  const pct = duration > 0 ? (current / duration) * 100 : 0;

  return (
    <div className="rounded-2xl border border-white/10 p-5 relative" style={{ backgroundColor: "rgba(255,255,255,0.04)" }}>

      {/* Countdown toast */}
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

      {/* Autoplay blocked banner */}
      {autoplayBlocked && (
        <div className="mb-4 flex items-center gap-3 px-4 py-3 rounded-xl border border-amber-500/30 bg-amber-500/10">
          <i className="ti ti-info-circle text-amber-400 flex-shrink-0" style={{ fontSize: 18 }} />
          <p className="text-sm text-amber-300 flex-1">
            Nhấn nút phát để bắt đầu nghe
          </p>
          <button onClick={togglePlay}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-white"
            style={{ backgroundColor: "var(--accent)" }}>
            <i className="ti ti-player-play" style={{ fontSize: 14 }} />
            Phát
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

      {/* Controls - dùng SVG thay vì icon font để tránh lỗi không load */}
      <div className="flex items-center justify-center gap-6 my-4">
        {/* Rewind 10s */}
        <button onClick={() => { if (audioRef.current) audioRef.current.currentTime -= 10; }}
          className="p-2 text-gray-400 hover:text-white transition-colors" aria-label="Tua lùi 10s">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="19 20 9 12 19 4 19 20" /><line x1="5" y1="19" x2="5" y2="5" />
          </svg>
        </button>

        {/* Play/Pause */}
        <button onClick={togglePlay}
          className="w-14 h-14 rounded-full text-white flex items-center justify-center shadow-lg transition-all hover:scale-105 active:scale-95"
          style={{ backgroundColor: "var(--accent)" }}
          aria-label={playing ? "Tạm dừng" : "Phát"}>
          {loading ? (
            <svg className="animate-spin" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
          ) : playing ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          )}
        </button>

        {/* Skip forward to next chapter */}
        <button onClick={() => nextChapterUrl && (window.location.href = nextChapterUrl)}
          disabled={!nextChapterUrl}
          className={`p-2 transition-colors ${nextChapterUrl ? "text-gray-400 hover:text-white" : "text-gray-700 cursor-not-allowed"}`}
          aria-label="Chương tiếp">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="5 4 15 12 5 20 5 4" /><line x1="19" y1="5" x2="19" y2="19" />
          </svg>
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
          {/* Volume icon SVG */}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-500">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
          </svg>
          <input type="range" min={0} max={1} step={0.05} value={volume}
            onChange={e => { setVolume(+e.target.value); if (audioRef.current) audioRef.current.volume = +e.target.value; }}
            className="w-16 h-1 cursor-pointer"
            style={{ background: `linear-gradient(to right, var(--accent) ${volume*100}%, rgba(255,255,255,0.1) ${volume*100}%)` }} />
        </div>
      </div>

      {/* Auto-next toggle */}
      <div className="flex items-center justify-between pt-3 border-t border-white/8">
        <div className="flex items-center gap-2">
          {/* Auto-next icon SVG */}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
            <polygon points="5 4 15 12 5 20 5 4" /><polygon points="13 4 23 12 13 20 13 4" />
          </svg>
          <span className="text-sm text-gray-300">Tự động nghe tiếp</span>
          {!nextChapterUrl && <span className="text-xs text-gray-600">(Chương cuối)</span>}
        </div>
        <button onClick={toggleAutoNext} role="switch" aria-checked={autoNext}
          className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${autoNext ? "" : "bg-gray-600"}`}
          style={autoNext ? { backgroundColor: "var(--accent)" } : {}}>
          <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${autoNext ? "translate-x-5" : ""}`} />
        </button>
      </div>

      {/* Hidden audio element */}
      <audio ref={audioRef} preload="metadata"
        onPlay={() => {
          setPlaying(true);
          setAutoplayBlocked(false);
          if ("mediaSession" in navigator) navigator.mediaSession.playbackState = "playing";
        }}
        onPause={() => {
          setPlaying(false);
          if ("mediaSession" in navigator) navigator.mediaSession.playbackState = "paused";
          saveProgress(audioRef.current?.currentTime ?? 0);
        }}
        onTimeUpdate={() => {
          const a = audioRef.current;
          if (!a) return;
          setCurrent(a.currentTime);
          clearTimeout(saveTimer.current);
          saveTimer.current = setTimeout(() => saveProgress(a.currentTime), 10000);
        }}
        onLoadedMetadata={() => {
          if (audioRef.current) {
            setDuration(audioRef.current.duration);
            audioRef.current.currentTime = initialPosition;
          }
        }}
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
