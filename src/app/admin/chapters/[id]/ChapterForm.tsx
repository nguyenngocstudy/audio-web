"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Chapter } from "@/lib/schema";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

interface Props { chapter: Chapter | null; storyId: string; storyList: { id: string; title: string }[]; }

export default function ChapterForm({ chapter, storyId, storyList }: Props) {
  const router = useRouter();
  const isNew = !chapter;
  const [f, setF] = useState({
    storyId:       chapter?.storyId       ?? storyId,
    title:         chapter?.title         ?? "",
    chapterNumber: chapter?.chapterNumber ?? 1,
    audioUrl:      chapter?.audioUrl      ?? "",
    durationSec:   chapter?.durationSec   ?? 0,
    isFree:        chapter?.isFree        ?? false,
    coinCost:      chapter?.coinCost      ?? 0,
    isPublished:   chapter?.isPublished   ?? false,
  });
  const [saving, setSaving]       = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError]         = useState("");

  async function handleFileUpload(file: File) {
    if (!f.storyId) { setError("Chọn truyện trước"); return; }
    setUploading(true); setError("");
    const tempId = chapter?.id ?? crypto.randomUUID();
    const res = await fetch("/api/upload", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "audio", storyId: f.storyId, chapterId: tempId }),
    });
    const { uploadUrl, key } = await res.json();
    await fetch(uploadUrl, { method: "PUT", body: file, headers: { "Content-Type": file.type || "application/x-mpegURL" } });
    const cdnBase = process.env.NEXT_PUBLIC_R2_PUBLIC_URL ?? "";
    setF(prev => ({ ...prev, audioUrl: `${cdnBase}/${key}` }));
    setUploading(false);
  }

  async function save() {
    if (!f.title.trim()) { setError("Tên chương không được để trống"); return; }
    setSaving(true); setError("");
    const res = await fetch(isNew ? "/api/admin/chapters" : `/api/admin/chapters/${chapter!.id}`, {
      method: isNew ? "POST" : "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f),
    });
    setSaving(false);
    if (!res.ok) { const d = await res.json(); setError(d.error ?? "Lỗi lưu"); return; }
    router.push(`/admin/chapters?storyId=${f.storyId}`); router.refresh();
  }

  async function del() {
    if (!confirm("Xoá chương này?")) return;
    await fetch(`/api/admin/chapters/${chapter!.id}`, { method: "DELETE" });
    router.push(`/admin/chapters?storyId=${f.storyId}`); router.refresh();
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Truyện</label>
        <select value={f.storyId} onChange={e => setF({ ...f, storyId: e.target.value })}
          className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-400">
          {storyList.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2">
          <Input label="Tên chương *" value={f.title} onChange={e => setF({ ...f, title: e.target.value })} placeholder="Chương 1: Gặp gỡ định mệnh" />
        </div>
        <Input label="Số chương" type="number" value={f.chapterNumber} onChange={e => setF({ ...f, chapterNumber: +e.target.value })} min={1} />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">File audio (.m3u8 / .mp3)</label>
        <div className="border-2 border-dashed border-gray-200 rounded-xl p-5 text-center hover:border-brand-300 transition-colors">
          <input type="file" accept=".m3u8,.mp3,.wav" className="hidden" id="audio-upload"
            onChange={e => { const file = e.target.files?.[0]; if (file) handleFileUpload(file); }} />
          <label htmlFor="audio-upload" className="cursor-pointer">
            {uploading ? (
              <div><i className="ti ti-loader-2 animate-spin text-brand-500 block mb-2" style={{ fontSize: 28 }} />
                <p className="text-sm text-gray-500">Đang upload lên R2...</p></div>
            ) : f.audioUrl ? (
              <div><i className="ti ti-check text-teal-500 block mb-2" style={{ fontSize: 28 }} />
                <p className="text-sm text-teal-600 font-medium">Đã upload</p>
                <p className="text-xs text-gray-400 mt-1 break-all max-w-full">{f.audioUrl}</p>
                <p className="text-xs text-brand-600 mt-1">Click để thay thế</p></div>
            ) : (
              <div><i className="ti ti-cloud-upload text-gray-300 block mb-2" style={{ fontSize: 28 }} />
                <p className="text-sm text-gray-500">Click để chọn file audio</p>
                <p className="text-xs text-gray-400 mt-1">Hỗ trợ .m3u8 (HLS), .mp3, .wav</p></div>
            )}
          </label>
        </div>
        <Input className="mt-2" placeholder="Hoặc dán URL audio trực tiếp..."
          value={f.audioUrl} onChange={e => setF({ ...f, audioUrl: e.target.value })} />
      </div>

      <Input label="Thời lượng (giây)" type="number" value={f.durationSec}
        onChange={e => setF({ ...f, durationSec: +e.target.value })} min={0} placeholder="Ví dụ: 1800 = 30 phút" />

      <div className="p-4 bg-gray-50 rounded-xl space-y-3">
        <p className="text-sm font-medium text-gray-700">Kiểm soát truy cập</p>
        <div className="flex items-center justify-between">
          <div><p className="text-sm text-gray-700">Miễn phí</p><p className="text-xs text-gray-400">Ai cũng nghe được</p></div>
          <button type="button" role="switch" aria-checked={f.isFree}
            onClick={() => setF({ ...f, isFree: !f.isFree, coinCost: !f.isFree ? 0 : f.coinCost })}
            className={`relative w-10 h-6 rounded-full transition-colors ${f.isFree ? "bg-brand-600" : "bg-gray-300"}`}>
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${f.isFree ? "translate-x-4" : ""}`} />
          </button>
        </div>
        {!f.isFree && (
          <Input label="Giá coin (0 = cần VIP)" type="number" value={f.coinCost}
            onChange={e => setF({ ...f, coinCost: +e.target.value })} min={0} />
        )}
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
            <i className="ti ti-trash" style={{ fontSize: 14 }} />Xoá chương
          </button>
        ) : <div />}
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => router.back()}>Huỷ</Button>
          <Button loading={saving} onClick={save}>{isNew ? "Tạo chương" : "Lưu thay đổi"}</Button>
        </div>
      </div>
    </div>
  );
}
