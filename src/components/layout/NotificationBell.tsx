"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { timeAgoVN } from "@/lib/utils";

interface Notif {
  id: string; type: string; title: string;
  body: string | null; link: string | null;
  isRead: boolean; createdAt: string;
}

const TYPE_ICON: Record<string, string> = {
  reply:       "ti-message-circle",
  like:        "ti-heart",
  admin_reply: "ti-shield-check",
  system:      "ti-bell",
};

const TYPE_COLOR: Record<string, string> = {
  reply:       "bg-blue-500/20 text-blue-400",
  like:        "bg-rose-500/20 text-rose-400",
  admin_reply: "bg-amber-500/20 text-amber-400",
  system:      "bg-gray-700 text-gray-400",
};

export default function NotificationBell() {
  const { data: session } = useSession();
  const [open, setOpen]     = useState(false);
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [unread, setUnread] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!session?.user?.id) return;
    fetchNotifs();
    const iv = setInterval(fetchNotifs, 60000);
    return () => clearInterval(iv);
  }, [session?.user?.id]);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  async function fetchNotifs() {
    try {
      const res = await fetch("/api/notifications");
      const data = await res.json();
      setNotifs(data.items ?? []);
      setUnread(data.unread ?? 0);
    } catch {}
  }

  async function markAllRead() {
    await fetch("/api/notifications/read", { method: "POST" });
    setNotifs(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnread(0);
  }

  function toggleOpen() {
    setOpen(o => !o);
    if (!open && unread > 0) setTimeout(markAllRead, 1500);
  }

  if (!session) return null;

  return (
    <div className="relative" ref={ref}>
      <button onClick={toggleOpen}
        className="relative flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
        aria-label="Thông báo">
        <i className="ti ti-bell" style={{ fontSize: 18 }} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-xs font-bold flex items-center justify-center leading-none">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 w-80 rounded-2xl border border-white/10 shadow-2xl z-50 overflow-hidden"
          style={{ backgroundColor: "rgba(15,15,26,0.98)", backdropFilter: "blur(12px)" }}>

          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-white text-sm">Thông báo</p>
              {unread > 0 && (
                <span className="bg-rose-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">{unread}</span>
              )}
            </div>
            {unread > 0 && (
              <button onClick={markAllRead}
                className="text-xs hover:text-white transition-colors"
                style={{ color: "var(--accent)" }}>
                Đánh dấu đã đọc
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifs.length === 0 ? (
              <div className="py-10 text-center">
                <i className="ti ti-bell-off text-gray-600 block mb-2" style={{ fontSize: 32 }} />
                <p className="text-sm text-gray-500">Chưa có thông báo</p>
              </div>
            ) : (
              notifs.map(n => (
                <a key={n.id} href={n.link ?? "/community"} onClick={() => setOpen(false)}
                  className={`flex gap-3 px-4 py-3 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0 ${!n.isRead ? "bg-white/5" : ""}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${TYPE_COLOR[n.type] ?? "bg-gray-700 text-gray-400"}`}>
                    <i className={`ti ${TYPE_ICON[n.type] ?? "ti-bell"}`} style={{ fontSize: 14 }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm leading-snug ${n.isRead ? "text-gray-400" : "text-white font-medium"}`}>
                      {n.title}
                    </p>
                    {n.body && <p className="text-xs text-gray-500 mt-0.5 truncate">{n.body}</p>}
                    {/* Use timeAgoVN to fix timezone */}
                    <p className="text-xs text-gray-600 mt-1">{timeAgoVN(n.createdAt)}</p>
                  </div>
                  {!n.isRead && <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1.5" />}
                </a>
              ))
            )}
          </div>

          <div className="border-t border-white/10 px-4 py-2.5">
            <Link href="/community" onClick={() => setOpen(false)}
              className="flex items-center justify-center gap-1.5 text-xs font-medium hover:text-white transition-colors"
              style={{ color: "var(--accent)" }}>
              Xem cộng đồng
              <i className="ti ti-arrow-right" style={{ fontSize: 13 }} />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
