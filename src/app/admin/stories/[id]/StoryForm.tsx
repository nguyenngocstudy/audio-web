"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Story } from "@/lib/schema";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

const GENRES = [
  { v: "tinh_cam", l: "Tình cảm" }, { v: "ngon_tinh", l: "Ngôn tình" },
  { v: "co_dai", l: "Cổ đại" },     { v: "huyen_huyen", l: "Huyền huyễn" },
  { v: "tram_cam", l: "Trầm cảm" }, { v: "hanh_dong", l: "Hành động" },
];

export default function StoryForm({ story }: { story: Story | null }) {
  const router = useRouter();
  const isNew = !story;
  const [f, setF] = useState({
    title: story?.title ?? "", author: story?.author ?? "",
    narrator: story?.narrator ?? "", description: story?.description ?? "",
    genre: story?.genre ?? "tinh_cam", isPublished: story?.isPublished ?? false,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState("");

  async function save() {
    if (!f.title.trim()) { setError("Tên truyện không được để trống"); return; }
    setSaving(true); setError("");
    const res = await fetch(isNew ? "/api/admin/stories" : `/api/admin/stories/${story!.id}`, {
      method: isNew ? "POST" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(f),
    });
    setSaving(false);
    if (!res.ok) { const d = await res.json(); setError(d.error ?? "Lỗi lưu"); return; }
    router.push("/admin/stories"); router.refresh();
  }

  async function del() {
    if (!confirm("Xoá truyện này và toàn bộ chương?")) return;
    await fetch(`/api/admin/stories/${story!.id}`, { method: "DELETE" });
    router.push("/admin/stories"); router.refresh();
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
      <Input label="Tên truyện *" value={f.title} onChange={e => setF({ ...f, title: e.target.value })} placeholder="Yêu nhầm tổng tài..." />
      <div className="grid grid-cols-2 gap-4">
        <Input label="Tác giả" value={f.author} onChange={e => setF({ ...f, author: e.target.value })} />
        <Input label="Người đọc" value={f.narrator} onChange={e => setF({ ...f, narrator: e.target.value })} />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Thể loại</label>
        <select value={f.genre} onChange={e => setF({ ...f, genre: e.target.value })}
          className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-400">
          {GENRES.map(g => <option key={g.v} value={g.v}>{g.l}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
        <textarea value={f.description} onChange={e => setF({ ...f, description: e.target.value })} rows={3}
          className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-400 resize-none" />
      </div>
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
        <div><p className="text-sm font-medium text-gray-700">Công khai</p><p className="text-xs text-gray-400">Hiện với người dùng</p></div>
        <button type="button" role="switch" aria-checked={f.isPublished}
          onClick={() => setF({ ...f, isPublished: !f.isPublished })}
          className={`relative w-10 h-6 rounded-full transition-colors ${f.isPublished ? "bg-brand-600" : "bg-gray-300"}`}>
          <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${f.isPublished ? "translate-x-4" : ""}`} />
        </button>
      </div>
      {error && <p className="text-sm text-rose-500 bg-rose-50 rounded-lg px-3 py-2">{error}</p>}
      <div className="flex items-center justify-between pt-1">
        {!isNew ? (
          <button onClick={del} className="text-sm text-rose-500 hover:text-rose-700 flex items-center gap-1.5">
            <i className="ti ti-trash" style={{ fontSize: 14 }} />Xoá
          </button>
        ) : <div />}
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => router.back()}>Huỷ</Button>
          <Button loading={saving} onClick={save}>{isNew ? "Tạo truyện" : "Lưu thay đổi"}</Button>
        </div>
      </div>
    </div>
  );
}
