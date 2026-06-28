"use client";

import { useState, useEffect } from "react";
import { timeAgoVN } from "@/lib/utils";

interface Comment {
  id: string; content: string; created_at: string;
  is_hidden: boolean; parent_id: string | null;
  user_id: string; user_name: string | null; user_email: string;
  story_id: string | null; story_title: string | null;
}

export default function AdminCommentsPage() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading]   = useState(true);
  const [page, setPage]         = useState(1);
  const [search, setSearch]     = useState("");
  const [filter, setFilter]     = useState<"all" | "hidden">("all");

  useEffect(() => { fetchComments(); }, [page]);

  async function fetchComments() {
    setLoading(true);
    const res = await fetch(`/api/admin/comments?page=${page}`);
    if (res.ok) setComments(await res.json());
    setLoading(false);
  }

  async function deleteComment(id: string) {
    if (!confirm("Xoá bình luận này vĩnh viễn?")) return;
    await fetch("/api/admin/comments", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ commentId: id }),
    });
    setComments(prev => prev.filter(c => c.id !== id));
  }

  async function toggleHide(c: Comment) {
    await fetch("/api/admin/comments", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ commentId: c.id, isHidden: !c.is_hidden }),
    });
    setComments(prev => prev.map(x => x.id === c.id ? { ...x, is_hidden: !c.is_hidden } : x));
  }

  const filtered = comments.filter(c => {
    const matchSearch = !search.trim() ||
      c.content.toLowerCase().includes(search.toLowerCase()) ||
      (c.user_name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      c.user_email.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || (filter === "hidden" && c.is_hidden);
    return matchSearch && matchFilter;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Quản lý bình luận</h1>
          <p className="text-sm text-gray-400 mt-0.5">{filtered.length} bình luận</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <i className="ti ti-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" style={{ fontSize: 14 }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Tìm nội dung, tên user..."
            className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent" />
        </div>
        <div className="flex gap-2">
          {[
            { key: "all",    label: "Tất cả" },
            { key: "hidden", label: "Đã ẩn"  },
          ].map(f => (
            <button key={f.key} onClick={() => setFilter(f.key as any)}
              className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                filter === f.key
                  ? "text-white border-transparent"
                  : "border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
              style={filter === f.key ? { backgroundColor: "var(--accent)" } : {}}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Comments list */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex justify-center py-12">
            <i className="ti ti-loader-2 animate-spin text-gray-400" style={{ fontSize: 32 }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <i className="ti ti-message-off block mb-2" style={{ fontSize: 40 }} />
            <p>Không có bình luận nào</p>
          </div>
        ) : filtered.map(c => (
          <div key={c.id}
            className={`bg-white rounded-xl border p-4 transition-colors ${c.is_hidden ? "border-gray-100 opacity-60" : "border-gray-200"}`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                {/* User + story info */}
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600">
                    {c.user_name?.[0]?.toUpperCase() ?? "?"}
                  </div>
                  <span className="text-sm font-medium text-gray-800">{c.user_name ?? c.user_email}</span>
                  <span className="text-xs text-gray-400">{c.user_email}</span>
                  {c.story_title && (
                    <>
                      <span className="text-gray-300">·</span>
                      <span className="text-xs text-blue-500 truncate max-w-[200px]">{c.story_title}</span>
                    </>
                  )}
                  {c.parent_id && (
                    <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">Phản hồi</span>
                  )}
                  {c.is_hidden && (
                    <span className="text-xs bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded">Đã ẩn</span>
                  )}
                  <span className="text-xs text-gray-400">{timeAgoVN(c.created_at)}</span>
                </div>

                {/* Content */}
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap break-words">
                  {c.content}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={() => toggleHide(c)}
                  title={c.is_hidden ? "Bỏ ẩn" : "Ẩn bình luận"}
                  className={`p-2 rounded-lg transition-colors text-sm ${
                    c.is_hidden
                      ? "bg-teal-50 text-teal-600 hover:bg-teal-100"
                      : "bg-amber-50 text-amber-600 hover:bg-amber-100"
                  }`}>
                  <i className={`ti ${c.is_hidden ? "ti-eye" : "ti-eye-off"}`} style={{ fontSize: 16 }} />
                </button>
                <button onClick={() => deleteComment(c.id)}
                  title="Xoá vĩnh viễn"
                  className="p-2 rounded-lg bg-rose-50 text-rose-500 hover:bg-rose-100 transition-colors">
                  <i className="ti ti-trash" style={{ fontSize: 16 }} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {!loading && filtered.length === 30 && (
        <div className="flex justify-center gap-3 mt-6">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="px-4 py-2 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors">
            ← Trước
          </button>
          <span className="px-4 py-2 text-sm text-gray-600">Trang {page}</span>
          <button onClick={() => setPage(p => p + 1)}
            className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            Sau →
          </button>
        </div>
      )}
    </div>
  );
}
