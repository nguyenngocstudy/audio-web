"use client";
import { useState } from "react";
import Link from "next/link";

interface Props {
  storyId: string;
  firstChapterId?: string;
  storyTitle: string;
}

export default function StoryActions({ storyId, firstChapterId, storyTitle }: Props) {
  const [copied, setCopied]   = useState(false);
  const [showShare, setShowShare] = useState(false);

  function copyLink() {
    const url = `${window.location.origin}/stories/${storyId}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {firstChapterId ? (
        <Link href={`/stories/${storyId}/chapters/${firstChapterId}`}
          className="inline-flex items-center gap-2 px-5 py-2 rounded-xl font-semibold text-sm text-white transition-all hover:opacity-90"
          style={{ backgroundColor: "var(--accent)" }}>
          <i className="ti ti-player-play" style={{ fontSize: 15 }} />
          Nghe thử
        </Link>
      ) : (
        <button disabled
          className="inline-flex items-center gap-2 px-5 py-2 rounded-xl font-semibold text-sm text-white opacity-40 cursor-not-allowed"
          style={{ backgroundColor: "var(--accent)" }}>
          <i className="ti ti-player-play" style={{ fontSize: 15 }} />
          Nghe thử
        </button>
      )}

      {/* Share button */}
      <div className="relative">
        <button onClick={() => setShowShare(s => !s)}
          className="inline-flex items-center justify-center w-9 h-9 rounded-xl border border-white/15 text-gray-400 hover:text-white hover:border-white/30 transition-all">
          <i className="ti ti-share" style={{ fontSize: 16 }} />
        </button>

        {showShare && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowShare(false)} />
            <div className="absolute left-0 top-11 z-50 w-72 rounded-xl border border-white/15 p-4 shadow-xl"
              style={{ backgroundColor: "rgba(20,20,35,0.98)", backdropFilter: "blur(12px)" }}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-white">Chia sẻ truyện</p>
                <button onClick={() => setShowShare(false)} className="text-gray-500 hover:text-white">
                  <i className="ti ti-x" style={{ fontSize: 15 }} />
                </button>
              </div>
              <div className="flex gap-2">
                <div className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-gray-400 truncate font-mono">
                  {typeof window !== "undefined" ? `${window.location.origin}/stories/${storyId}` : ""}
                </div>
                <button onClick={copyLink}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-white transition-all whitespace-nowrap"
                  style={{ backgroundColor: copied ? "#16a34a" : "var(--accent)" }}>
                  <i className={`ti ${copied ? "ti-check" : "ti-copy"}`} style={{ fontSize: 13 }} />
                  {copied ? "Đã sao chép" : "Sao chép"}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
