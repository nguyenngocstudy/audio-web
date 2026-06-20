"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Story } from "@/lib/schema";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Image from "next/image";

const GENRES = [
  { v: "ngon_tinh", l: "Ngôn tình" }, { v: "tra_xanh", l: "Trà xanh" },
   { v: "trong_sinh", l: "Trọng sinh" },
   { v: "trinh_tham", l: "Trinh thám" },
  { v: "co_dai", l: "Cổ đại" },     { v: "hoc_duong", l: "Học đường" },
  { v: "hai_huoc", l: "Hài hước" }, { v: "hanh_dong", l: "Hành động" },
];

export default function StoryForm({ story }: { story: Story | null }) {
  const router = useRouter();
  const isNew = !story;
  const [f, setF] = useState({
    title:       story?.title       ?? "",
    author:      story?.author      ?? "",
    narrator:    story?.narrator    ?? "",
    description: story?.description ?? "",
    genre:       story?.genre       ?? "ngon_tinh",
    isPublished: story?.isPublished ?? false,
    coverUrl:    story?.coverUrl    ?? "",
  });
  const [saving, setSaving]         = useState(false);
  const [uploading, setUploading]   = useState(false);
  const [error, setError]           = useState("");
  const [coverPreview, setCoverPreview] = useState<string>(story?.coverUrl ?? "");

  async function handleCoverUpload(file: File) {
    if (!file.type.startsWith("image/")) { setError("Chỉ chấp nhận file ảnh"); return; }
    setUploading(true); setError("");

    // Preview ngay lập tức
    const reader = new FileReader();
    reader.onload = e => setCoverPreview(e.target?.result as string);
    reader.readAsDataURL(file);

    // Lấy presigned URL từ R2
    const storyId = story?.id ?? crypto.randomUUID();
    const res = await fetch("/api/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "cover", storyId }),
    });
    const { uploadUrl, key } = await res.json();

    // Upload lên R2
    await fetch(uploadUrl, {
      method: "PUT",
      body: file,
      headers: { "Content-Type": file.type },
    });

    const cdnBase = process.env.NEXT_PUBLIC_R2_PUBLIC_URL ?? "";
    const url = `${cdnBase}/${key}`;
    setF(prev => ({ ...prev, coverUrl: url }));
    setUploading(false);
  }

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

      {/* Cover image upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Ảnh bìa truyện
        </label>
        <div className="flex gap-4 items-start">
          {/* Preview */}
          <div className="relative w-28 h-40 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-200">
            {coverPreview ? (
              <Image src={coverPreview} alt="Cover preview" fill className="object-cover" />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-gray-300">
                <i className="ti ti-photo" style={{ fontSize: 28 }} />
                <span className="text-xs">Chưa có ảnh</span>
              </div>
            )}
            {uploading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <i className="ti ti-loader-2 animate-spin text-white" style={{ fontSize: 24 }} />
              </div>
            )}
          </div>

          {/* Upload controls */}
          <div className="flex-1 space-y-2">
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center hover:border-brand-300 transition-colors">
              <input type="file" accept="image/*" className="hidden" id="cover-upload"
                onChange={e => { const file = e.target.files?.[0]; if (file) handleCoverUpload(file); }} />
              <label htmlFor="cover-upload" className="cursor-pointer">
                <i className="ti ti-cloud-upload text-gray-300 block mb-1" style={{ fontSize: 24 }} />
                <p className="text-sm text-gray-500">Click để chọn ảnh bìa</p>
                <p className="text-xs text-gray-400 mt-1">JPG, PNG, WebP · Tỷ lệ 3:4 đẹp nhất</p>
              </label>
            </div>
            <p className="text-xs text-gray-400">Hoặc dán URL ảnh trực tiếp:</p>
            <Input
              placeholder="https://example.com/cover.jpg"
              value={f.coverUrl}
              onChange={e => { setF({ ...f, coverUrl: e.target.value }); setCoverPreview(e.target.value); }}
            />
          </div>
        </div>
      </div>

      {/* Title */}
      <Input label="Tên truyện *" value={f.title}
        onChange={e => setF({ ...f, title: e.target.value })}
        placeholder="Yêu nhầm tổng tài lạnh lùng..." />

      {/* Author + Narrator */}
      <div className="grid grid-cols-2 gap-4">
        <Input label="Tác giả" value={f.author}
          onChange={e => setF({ ...f, author: e.target.value })}
          placeholder="Tên tác giả" />
        <Input label="Người đọc" value={f.narrator}
          onChange={e => setF({ ...f, narrator: e.target.value })}
          placeholder="Tên người đọc" />
      </div>

      {/* Genre */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Thể loại</label>
          <select value={f.genre} onChange={e =>
          setF({
            ...f,
            genre: e.target.value as typeof f.genre
          })
        }
          className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-400">
          {GENRES.map(g => <option key={g.v} value={g.v}>{g.l}</option>)}
        </select>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả / Tóm tắt</label>
        <textarea value={f.description} rows={4}
          onChange={e => setF({ ...f, description: e.target.value })}
          placeholder="Tóm tắt nội dung truyện..."
          className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-400 resize-none" />
      </div>

      {/* Published toggle */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
        <div>
          <p className="text-sm font-medium text-gray-700">Công khai</p>
          <p className="text-xs text-gray-400 mt-0.5">Hiện với người dùng trên trang chủ</p>
        </div>
        <button type="button" role="switch" aria-checked={f.isPublished}
          onClick={() => setF({ ...f, isPublished: !f.isPublished })}
          className={`relative w-11 h-6 rounded-full transition-colors ${f.isPublished ? "bg-brand-600" : "bg-gray-300"}`}>
          <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${f.isPublished ? "translate-x-5" : ""}`} />
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-rose-500 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">
          <i className="ti ti-alert-circle flex-shrink-0" style={{ fontSize: 15 }} />
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-1">
        {!isNew ? (
          <button onClick={del}
            className="text-sm text-rose-500 hover:text-rose-700 flex items-center gap-1.5 transition-colors">
            <i className="ti ti-trash" style={{ fontSize: 15 }} />Xoá truyện
          </button>
        ) : <div />}
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => router.back()}>Huỷ</Button>
          <Button loading={saving} onClick={save}>
            {isNew ? "Tạo truyện" : "Lưu thay đổi"}
          </Button>
        </div>
      </div>
    </div>
  );
}
