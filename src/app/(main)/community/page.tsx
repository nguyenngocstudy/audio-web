"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { fmtDateTime } from "@/lib/utils"; 
import { timeAgoVN } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────
interface Post {
  id: string; type: string; content: string;
  like_count: number; reply_count: number;
  is_pinned: boolean; created_at: string;
  user_id: string; user_name: string | null; user_is_admin: boolean;
  liked_by_me: boolean;
}
interface Comment {
  id: string; content: string; created_at: string;
  user_id: string; user_name: string | null; user_is_admin: boolean;
}

// ── Config ────────────────────────────────────────────────────────────────────
const POST_TYPES = [
  { key: "",           label: "Tất cả",   icon: "ti-layout-grid" },
  { key: "discussion", label: "Thảo luận", icon: "ti-flame"       },
  { key: "suggestion", label: "Đề xuất",   icon: "ti-bulb"        },
  { key: "question",   label: "Hỏi đáp",   icon: "ti-help-circle" },
  { key: "bug_report", label: "Báo lỗi",   icon: "ti-bug"         },
] as const;

const TYPE_BADGE: Record<string, { label: string; cls: string }> = {
  discussion: { label: "Thảo luận", cls: "bg-orange-500/20 text-orange-400 border-orange-500/30" },
  suggestion: { label: "Đề xuất",   cls: "bg-blue-500/20 text-blue-400 border-blue-500/30"       },
  question:   { label: "Hỏi đáp",   cls: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
  bug_report: { label: "Báo lỗi",   cls: "bg-rose-500/20 text-rose-400 border-rose-500/30"       },
};

const TYPE_ICONS: Record<string, string> = {
  discussion: "ti-flame", suggestion: "ti-bulb",
  question: "ti-help-circle", bug_report: "ti-bug",
};

// function timeAgoVN(d: string) {
//   const diff = (Date.now() - new Date(d).getTime()) / 1000;
//   if (diff < 60)    return "Vừa xong";
//   if (diff < 3600)  return `${Math.floor(diff/60)} phút trước`;
//   if (diff < 86400) return `${Math.floor(diff/3600)} giờ trước`;
//   return `${Math.floor(diff/86400)} ngày trước`;
// }

function Avatar({ name, isAdmin }: { name: string | null; isAdmin: boolean }) {
  return (
    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
      isAdmin ? "bg-amber-500 text-white" : "bg-white/10 text-gray-300"
    }`}>
      {name?.[0]?.toUpperCase() ?? "?"}
    </div>
  );
}

// ── PostCard ──────────────────────────────────────────────────────────────────
function PostCard({ post, currentUserId, onLike, onDelete }: {
  post: Post; currentUserId?: string;
  onLike: (id: string) => void; onDelete: (id: string) => void;
}) {
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments]         = useState<Comment[]>([]);
  const [loadingCmt, setLoadingCmt]     = useState(false);
  const [newCmt, setNewCmt]             = useState("");
  const [posting, setPosting]           = useState(false);

  const badge = TYPE_BADGE[post.type];

  async function loadComments() {
    if (showComments) { setShowComments(false); return; }
    setShowComments(true);
    setLoadingCmt(true);
    const res = await fetch(`/api/community/posts/${post.id}/comments`);
    setComments(await res.json());
    setLoadingCmt(false);
  }

  async function submitComment(e: React.FormEvent) {
    e.preventDefault();
    if (!newCmt.trim()) return;
    setPosting(true);
    const res = await fetch(`/api/community/posts/${post.id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: newCmt.trim() }),
    });
    if (res.ok) {
      const cmt = await res.json();
      setComments(prev => [...prev, cmt]);
      setNewCmt("");
    }
    setPosting(false);
  }

  return (
    <div id={post.id}
      className={`rounded-2xl border transition-colors ${
        post.is_pinned ? "border-amber-500/30 bg-amber-500/5" : "border-white/8 bg-white/3"
      }`}
      style={{ backgroundColor: post.is_pinned ? "rgba(245,158,11,0.04)" : "rgba(255,255,255,0.03)" }}>

      <div className="p-4">
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <Avatar name={post.user_name} isAdmin={post.user_is_admin} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-white">{post.user_name ?? "Người dùng"}</span>
              {post.user_is_admin && (
                <span className="text-xs bg-amber-500/20 text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded-full font-medium">
                  Admin
                </span>
              )}
              {badge && (
                <span className={`text-xs border px-1.5 py-0.5 rounded-full font-medium flex items-center gap-1 ${badge.cls}`}>
                  <i className={`ti ${TYPE_ICONS[post.type]}`} style={{ fontSize: 11 }} />
                  {badge.label}
                </span>
              )}
              {post.is_pinned && (
                <span className="text-xs bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                  <i className="ti ti-pin" style={{ fontSize: 11 }} />Ghim
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-0.5">{timeAgoVN(post.created_at)}</p>
          </div>
          {currentUserId === post.user_id && (
            <button onClick={() => onDelete(post.id)}
              className="text-gray-600 hover:text-rose-400 transition-colors p-1">
              <i className="ti ti-trash" style={{ fontSize: 14 }} />
            </button>
          )}
        </div>

        {/* Content */}
        <p className="text-gray-200 text-sm leading-relaxed whitespace-pre-wrap break-words mb-4">
          {post.content}
        </p>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <button onClick={() => onLike(post.id)}
            className={`flex items-center gap-1.5 text-sm transition-colors ${
              post.liked_by_me ? "text-rose-400" : "text-gray-500 hover:text-rose-400"
            }`}>
            <i className={`ti ${post.liked_by_me ? "ti-heart-filled" : "ti-heart"}`} style={{ fontSize: 16 }} />
            <span>{post.like_count}</span>
          </button>

          <button onClick={loadComments}
            className={`flex items-center gap-1.5 text-sm transition-colors ${
              showComments ? "text-blue-400" : "text-gray-500 hover:text-blue-400"
            }`}>
            <i className="ti ti-message-circle" style={{ fontSize: 16 }} />
            <span>{post.reply_count}</span>
          </button>
        </div>
      </div>

      {/* Comments section */}
      {showComments && (
        <div className="border-t border-white/8 px-4 py-3 space-y-3">
          {loadingCmt ? (
            <div className="flex justify-center py-4">
              <i className="ti ti-loader-2 animate-spin text-gray-500" style={{ fontSize: 20 }} />
            </div>
          ) : (
            <>
              {comments.map(c => (
                <div key={c.id} className="flex gap-2.5">
                  <Avatar name={c.user_name} isAdmin={c.user_is_admin} />
                  <div className="flex-1 min-w-0 bg-white/5 rounded-xl px-3 py-2">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-xs font-semibold text-gray-200">{c.user_name ?? "Người dùng"}</span>
                      {c.user_is_admin && <span className="text-xs text-amber-400">Admin</span>}
                      <span className="text-xs text-gray-600">{timeAgoVN(c.created_at)}</span>
                    </div>
                    <p className="text-sm text-gray-300 whitespace-pre-wrap">{c.content}</p>
                  </div>
                </div>
              ))}

              {currentUserId && (
                <form onSubmit={submitComment} className="flex gap-2 mt-2">
                  <div className="w-8 h-8 rounded-full flex-shrink-0" style={{ backgroundColor: "var(--accent)", display:"flex",alignItems:"center",justifyContent:"center" }}>
                    <i className="ti ti-user text-white" style={{ fontSize: 13 }} />
                  </div>
                  <div className="flex-1 flex gap-2">
                    <input value={newCmt} onChange={e => setNewCmt(e.target.value)}
                      placeholder="Viết bình luận..."
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-white/20"
                    />
                    <button type="submit" disabled={posting || !newCmt.trim()}
                      className="px-3 py-2 rounded-xl text-white text-sm font-medium disabled:opacity-50 transition-opacity"
                      style={{ backgroundColor: "var(--accent)" }}>
                      {posting
                        ? <i className="ti ti-loader-2 animate-spin" style={{ fontSize: 14 }} />
                        : <i className="ti ti-send" style={{ fontSize: 14 }} />}
                    </button>
                  </div>
                </form>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function CommunityPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [posts, setPosts]         = useState<Post[]>([]);
  const [filter, setFilter]       = useState("");
  const [loading, setLoading]     = useState(true);
  const [content, setContent]     = useState("");
  const [postType, setPostType]   = useState("discussion");
  const [posting, setPosting]     = useState(false);
  const [charCount, setCharCount] = useState(0);
  const textRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { fetchPosts(); }, [filter]);

  async function fetchPosts() {
    setLoading(true);
    const url = `/api/community/posts${filter ? `?type=${filter}` : ""}`;
    const res = await fetch(url);
    setPosts(await res.json());
    setLoading(false);
  }

  async function handlePost(e: React.FormEvent) {
    e.preventDefault();
    if (!session) { router.push("/login?next=/community"); return; }
    if (!content.trim()) return;
    setPosting(true);
    const res = await fetch("/api/community/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: postType, content }),
    });
    if (res.ok) {
      setContent(""); setCharCount(0);
      await fetchPosts();
    }
    setPosting(false);
  }

  async function handleLike(postId: string) {
    if (!session) { router.push("/login?next=/community"); return; }
    const res = await fetch(`/api/community/posts/${postId}/like`, { method: "POST" });
    const { liked } = await res.json();
    setPosts(prev => prev.map(p => p.id === postId
      ? { ...p, liked_by_me: liked, like_count: liked ? p.like_count+1 : p.like_count-1 }
      : p));
  }

  async function handleDelete(postId: string) {
    if (!confirm("Xoá bài viết này?")) return;
    await fetch(`/api/community/posts/${postId}`, { method: "DELETE" });
    setPosts(prev => prev.filter(p => p.id !== postId));
  }

  return (
    <div className="max-w-2xl mx-auto py-6 px-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
          <i className="ti ti-users text-blue-400" style={{ fontSize: 22 }} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Cộng đồng</h1>
          <p className="text-sm text-gray-500">Thảo luận, đề xuất và hỏi đáp</p>
        </div>
      </div>

      {/* Compose box */}
      <div className="rounded-2xl border border-white/10 p-4 mb-5"
        style={{ backgroundColor: "rgba(255,255,255,0.03)" }}>
        <form onSubmit={handlePost}>
          <textarea ref={textRef} value={content}
            onChange={e => { setContent(e.target.value); setCharCount(e.target.value.length); }}
            placeholder={session ? "Bạn đang nghĩ gì về truyện hôm nay? 🎧" : "Đăng nhập để tham gia thảo luận..."}
            readOnly={!session}
            rows={3}
            maxLength={2000}
            className="w-full bg-transparent text-sm text-white placeholder-gray-500 focus:outline-none resize-none mb-3"
            onClick={() => { if (!session) router.push("/login?next=/community"); }}
          />

          {/* Post type selector + submit */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex gap-1.5 flex-wrap">
              {POST_TYPES.slice(1).map(t => (
                <button key={t.key} type="button" onClick={() => setPostType(t.key)}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    postType === t.key
                      ? "border-white/30 text-white bg-white/10"
                      : "border-white/10 text-gray-400 hover:border-white/20 hover:text-gray-300"
                  }`}>
                  <i className={`ti ${t.icon}`} style={{ fontSize: 12 }} />
                  {t.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              {content.length > 0 && (
                <span className={`text-xs ${charCount > 1800 ? "text-rose-400" : "text-gray-500"}`}>
                  {charCount}/2000
                </span>
              )}
              <button type="submit" disabled={posting || !content.trim()}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold text-white disabled:opacity-50 transition-all"
                style={{ backgroundColor: "var(--accent)" }}>
                {posting
                  ? <><i className="ti ti-loader-2 animate-spin" style={{ fontSize: 14 }} />Đang đăng...</>
                  : <><i className="ti ti-send" style={{ fontSize: 14 }} />Đăng</>}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-5 scrollbar-hide">
        {POST_TYPES.map(t => (
          <button key={t.key} onClick={() => setFilter(t.key)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium border transition-all ${
              filter === t.key
                ? "text-white border-transparent"
                : "border-white/10 text-gray-400 hover:text-gray-200 hover:border-white/20"
            }`}
            style={filter === t.key ? { backgroundColor: "var(--accent)", borderColor: "var(--accent)" } : {}}>
            <i className={`ti ${t.icon}`} style={{ fontSize: 14 }} />
            {t.label}
          </button>
        ))}
      </div>

      {/* Posts */}
      {loading ? (
        <div className="flex justify-center py-16">
          <i className="ti ti-loader-2 animate-spin text-gray-500" style={{ fontSize: 32 }} />
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16">
          <i className="ti ti-message-off text-gray-700 block mb-3" style={{ fontSize: 40 }} />
          <p className="text-gray-500 font-medium">Chưa có bài viết nào</p>
          <p className="text-gray-600 text-sm mt-1">Hãy là người đầu tiên chia sẻ!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map(post => (
            <PostCard key={post.id} post={post}
              currentUserId={session?.user?.id}
              onLike={handleLike} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}
