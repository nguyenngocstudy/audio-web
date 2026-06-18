"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { fmtDuration, timeAgoVN } from "@/lib/utils";
import type { Chapter } from "@/lib/schema";

interface CommentUser {
  user_id: string; user_name: string | null;
  user_is_admin: boolean; user_vip_until: string | null;
}
interface Reply extends CommentUser {
  id: string; content: string; created_at: string; parent_id: string;
}
interface Comment extends CommentUser {
  id: string; content: string; created_at: string; parent_id: null; replies: Reply[];
}
interface Props {
  storyId: string; chapterList: Chapter[]; unlocked: Set<string>;
  isVip: boolean; currentUserId?: string; currentUserName?: string;
  initialComments: Comment[]; initialCommentCount: number;
}

function isVipActive(v: string | null | undefined) {
  if (!v) return false;
  const s = v.toString().trim();
  const iso = s.endsWith("Z") || s.includes("+") ? s : s.replace(" ", "T") + "Z";
  return new Date(iso) > new Date();
}

function Avatar({ name, isAdmin }: { name: string | null; isAdmin: boolean }) {
  return (
    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${isAdmin ? "bg-amber-500 text-black" : "bg-white/10 text-gray-300"}`}>
      {name?.[0]?.toUpperCase() ?? "?"}
    </div>
  );
}

function Badges({ isAdmin, vipUntil }: { isAdmin: boolean; vipUntil?: string | null }) {
  return (
    <>
      {isAdmin && <span className="text-xs bg-amber-500/20 text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded-full flex items-center gap-0.5"><i className="ti ti-shield-check" style={{ fontSize: 10 }} />Admin</span>}
      {!isAdmin && isVipActive(vipUntil) && <span className="text-xs bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded-full flex items-center gap-0.5"><i className="ti ti-crown" style={{ fontSize: 10 }} />VIP</span>}
    </>
  );
}

function ReplyItem({ reply, currentUserId, onReply }: { reply: Reply; currentUserId?: string; onReply: (pid: string, name: string) => void }) {
  return (
    <div className="flex gap-2.5 mt-2 pl-3 border-l-2 border-white/10">
      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${reply.user_is_admin ? "bg-amber-500 text-black" : "bg-white/10 text-gray-300"}`}>
        {reply.user_name?.[0]?.toUpperCase() ?? "?"}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
          <span className="text-xs font-semibold text-gray-200">{reply.user_name ?? "Người dùng"}</span>
          <Badges isAdmin={reply.user_is_admin} vipUntil={reply.user_vip_until} />
          <span className="text-xs text-gray-600">{timeAgoVN(reply.created_at)}</span>
        </div>
        <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">{reply.content}</p>
        {currentUserId && (
          <button onClick={() => onReply(reply.parent_id, reply.user_name ?? "bạn")}
            className="flex items-center gap-1 mt-1 text-xs text-gray-500 hover:text-gray-300 transition-colors">
            <i className="ti ti-corner-down-right" style={{ fontSize: 12 }} />Phản hồi
          </button>
        )}
      </div>
    </div>
  );
}

function CommentItem({ comment, currentUserId, onReply, onReplySubmit, replyingTo, setReplyingTo }: {
  comment: Comment; currentUserId?: string;
  onReply: (pid: string, name: string) => void;
  onReplySubmit: (pid: string, content: string) => Promise<void>;
  replyingTo: { parentId: string; mention: string } | null;
  setReplyingTo: (v: { parentId: string; mention: string } | null) => void;
}) {
  const [replyText, setReplyText] = useState("");
  const [posting, setPosting]     = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const isReplying = replyingTo?.parentId === comment.id;

  useEffect(() => {
    if (isReplying && inputRef.current) {
      inputRef.current.focus();
      const val = `@${replyingTo!.mention} `;
      setReplyText(val);
      setTimeout(() => inputRef.current?.setSelectionRange(val.length, val.length), 0);
    }
  }, [isReplying]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!replyText.trim()) return;
    setPosting(true);
    await onReplySubmit(comment.id, replyText.trim());
    setReplyText(""); setPosting(false); setReplyingTo(null);
  }

  return (
    <div className="py-4 border-b border-white/6 last:border-0">
      <div className="flex gap-3">
        <Avatar name={comment.user_name} isAdmin={comment.user_is_admin} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-sm font-semibold text-gray-200">{comment.user_name ?? "Người dùng"}</span>
            <Badges isAdmin={comment.user_is_admin} vipUntil={comment.user_vip_until} />
            <span className="text-xs text-gray-600">{timeAgoVN(comment.created_at)}</span>
          </div>
          <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap mb-2">{comment.content}</p>
          <div className="flex items-center gap-3">
            {currentUserId && (
              <button onClick={() => isReplying ? setReplyingTo(null) : onReply(comment.id, comment.user_name ?? "bạn")}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 transition-colors">
                <i className="ti ti-corner-down-right" style={{ fontSize: 13 }} />Phản hồi
              </button>
            )}
            {comment.replies.length > 0 && (
              <span className="text-xs text-gray-600">{comment.replies.length} phản hồi</span>
            )}
          </div>
          {comment.replies.length > 0 && (
            <div className="mt-3 space-y-1">
              {comment.replies.map(r => (
                <ReplyItem key={r.id} reply={r} currentUserId={currentUserId} onReply={onReply} />
              ))}
            </div>
          )}
          {isReplying && currentUserId && (
            <form onSubmit={submit} className="mt-3 flex gap-2 items-start">
              <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: "var(--accent)" }}>
                <i className="ti ti-user" style={{ fontSize: 12 }} />
              </div>
              <div className="flex-1">
                <textarea ref={inputRef} value={replyText} onChange={e => setReplyText(e.target.value)}
                  placeholder={`Phản hồi @${replyingTo?.mention}...`} rows={2}
                  className="w-full bg-white/5 border border-white/15 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-white/25 resize-none" />
                <div className="flex items-center gap-2 mt-1.5">
                  <button type="submit" disabled={posting || !replyText.trim()}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white disabled:opacity-50 transition-all"
                    style={{ backgroundColor: "var(--accent)" }}>
                    {posting ? <i className="ti ti-loader-2 animate-spin" style={{ fontSize: 12 }} /> : <i className="ti ti-send" style={{ fontSize: 12 }} />}
                    Gửi
                  </button>
                  <button type="button" onClick={() => setReplyingTo(null)}
                    className="text-xs text-gray-500 hover:text-gray-300 transition-colors">Huỷ</button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ChapterCommentTabs({
  storyId, chapterList, unlocked, isVip,
  currentUserId, currentUserName, initialComments, initialCommentCount,
}: Props) {
  const [tab, setTab]             = useState<"chapters" | "comments">("chapters");
  const [comments, setComments]   = useState<Comment[]>(initialComments);
  // Use server-fetched count so tab shows correct number on F5
  const [commentCount, setCommentCount] = useState(initialCommentCount);
  const [newCmt, setNewCmt]       = useState("");
  const [posting, setPosting]     = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");
  const [replyingTo, setReplyingTo] = useState<{ parentId: string; mention: string } | null>(null);

  // Fetch when switching to comments tab
  useEffect(() => {
    if (tab === "comments") fetchComments();
  }, [tab]);

  async function fetchComments() {
    setLoading(true);
    try {
      const res = await fetch(`/api/stories/${storyId}/comments`);
      if (res.ok) {
        const data = await res.json();
        setComments(data);
        setCommentCount(data.reduce((acc: number, c: Comment) => acc + 1 + (c.replies?.length ?? 0), 0));
      }
    } catch {}
    setLoading(false);
  }

  async function submitTopLevel(e: React.FormEvent) {
    e.preventDefault();
    if (!newCmt.trim()) return;
    setError(""); setPosting(true);
    const res = await fetch(`/api/stories/${storyId}/comments`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: newCmt.trim() }),
    });
    setPosting(false);
    if (res.ok) {
      const c = await res.json();
      const normalized = { ...c, created_at: c.created_at ?? new Date().toISOString(), replies: [] };
      setComments(prev => [normalized, ...prev]);
      setCommentCount(prev => prev + 1);
      setNewCmt("");
    } else {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "Lỗi gửi bình luận");
    }
  }

  async function submitReply(parentId: string, content: string) {
    const res = await fetch(`/api/stories/${storyId}/comments`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, parentId }),
    });
    if (res.ok) {
      const reply = await res.json();
      const normalized = { ...reply, created_at: reply.created_at ?? new Date().toISOString() };
      setComments(prev => prev.map(c =>
        c.id === parentId ? { ...c, replies: [...c.replies, normalized] } : c
      ));
      setCommentCount(prev => prev + 1);
    }
  }

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-1 mb-5 border-b border-white/8">
        {[
          { key: "chapters", label: `Danh sách tập (${chapterList.length})`, icon: "ti-list" },
          { key: "comments", label: `Bình luận (${commentCount})`,           icon: "ti-message-circle" },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key as any)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${tab === t.key ? "border-current" : "border-transparent text-gray-500 hover:text-gray-300"}`}
            style={tab === t.key ? { borderColor: "var(--accent)", color: "var(--accent)" } : {}}>
            <i className={`ti ${t.icon}`} style={{ fontSize: 14 }} />{t.label}
          </button>
        ))}
      </div>

      {/* Chapters tab */}
      {tab === "chapters" && (
        <div className="rounded-xl overflow-hidden border border-white/8">
          {chapterList.map((ch, idx) => {
            const canPlay = ch.isFree || isVip || unlocked.has(ch.id);
            return (
              <div key={ch.id}
                className="flex items-center gap-3 px-4 py-3.5 border-b border-white/5 last:border-0 hover:bg-white/3 transition-colors"
                style={{ backgroundColor: "rgba(255,255,255,0.02)" }}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-semibold ${canPlay ? "bg-white/10 text-gray-300" : "bg-white/5 text-gray-600"}`}>
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm truncate ${canPlay ? "text-gray-200" : "text-gray-500"}`}>{ch.title}</p>
                  {ch.durationSec && (
                    <p className="text-xs text-gray-600 mt-0.5 flex items-center gap-1">
                      <i className="ti ti-clock" style={{ fontSize: 11 }} />{fmtDuration(ch.durationSec)}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {ch.isFree && <span className="text-xs px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-400 border border-teal-500/30">Miễn phí</span>}
                  {!ch.isFree && ch.coinCost > 0 && !isVip && !unlocked.has(ch.id) && <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">{ch.coinCost} coin</span>}
                  {!ch.isFree && !isVip && !unlocked.has(ch.id) && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-gray-400 border border-white/15 flex items-center gap-1">
                      <i className="ti ti-lock" style={{ fontSize: 11 }} />VIP
                    </span>
                  )}
                  {canPlay ? (
                    <Link href={`/stories/${storyId}/chapters/${ch.id}`}
                      className="flex items-center justify-center w-8 h-8 rounded-full text-white transition-all hover:opacity-80"
                      style={{ backgroundColor: "var(--accent)" }}>
                      <i className="ti ti-player-play-filled" style={{ fontSize: 13 }} />
                    </Link>
                  ) : (
                    <Link href="/vip"
                      className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30 transition-all">
                      <i className="ti ti-lock" style={{ fontSize: 13 }} />
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
          {chapterList.length === 0 && (
            <div className="py-10 text-center text-gray-600">
              <i className="ti ti-music-off block mb-2" style={{ fontSize: 32 }} /><p className="text-sm">Chưa có tập nào</p>
            </div>
          )}
        </div>
      )}

      {/* Comments tab */}
      {tab === "comments" && (
        <div>
          {currentUserId ? (
            <form onSubmit={submitTopLevel} className="mb-6">
              <p className="text-sm text-gray-400 mb-2">
                Bình luận với tên: <span className="text-white font-medium">{currentUserName ?? "bạn"}</span>
              </p>
              <textarea value={newCmt} onChange={e => setNewCmt(e.target.value)}
                placeholder="Nhập bình luận của bạn..." rows={3} maxLength={1000}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-white/20 resize-none mb-2" />
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">{newCmt.length}/1000</span>
                <div className="flex items-center gap-3">
                  {error && <p className="text-xs text-rose-400">{error}</p>}
                  <button type="submit" disabled={posting || !newCmt.trim()}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white disabled:opacity-50 transition-all"
                    style={{ backgroundColor: "var(--accent)" }}>
                    {posting ? <><i className="ti ti-loader-2 animate-spin" style={{ fontSize: 14 }} />Đang gửi...</> : <><i className="ti ti-send" style={{ fontSize: 14 }} />Gửi bình luận</>}
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <div className="mb-5 p-4 rounded-xl border border-white/8 text-center" style={{ backgroundColor: "rgba(255,255,255,0.02)" }}>
              <p className="text-sm text-gray-400">
                <Link href="/login" className="font-medium hover:underline" style={{ color: "var(--accent)" }}>Đăng nhập</Link>{" "}để tham gia bình luận
              </p>
            </div>
          )}
          {loading ? (
            <div className="flex justify-center py-8"><i className="ti ti-loader-2 animate-spin text-gray-500" style={{ fontSize: 28 }} /></div>
          ) : (
            <div className="divide-y divide-white/0">
              {comments.map(c => (
                <CommentItem key={c.id} comment={c} currentUserId={currentUserId}
                  onReply={(pid, name) => setReplyingTo({ parentId: pid, mention: name })}
                  onReplySubmit={submitReply}
                  replyingTo={replyingTo} setReplyingTo={setReplyingTo} />
              ))}
              {comments.length === 0 && (
                <div className="py-10 text-center text-gray-600">
                  <i className="ti ti-message-off block mb-2" style={{ fontSize: 32 }} />
                  <p className="text-sm">Chưa có bình luận nào. Hãy là người đầu tiên!</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
