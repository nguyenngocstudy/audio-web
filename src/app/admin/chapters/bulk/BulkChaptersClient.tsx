"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { StoryComboBox } from "../AdminChaptersClient";

interface Story { id: string; title: string; }

interface ChapterRow {
  id: string; // local only
  title: string;
  audioUrl: string;
  durationSec: number;
  isFree: boolean;
  coinCost: number;
  isPublished: boolean;
  uploading: boolean;
  uploadDone: boolean;
  uploadError: string;
}

function newRow(num: number): ChapterRow {
  return {
    id: crypto.randomUUID(),
    title: `Chương ${num}`,
    audioUrl: "",
    durationSec: 0,
    isFree: false,
    coinCost: 0,
    isPublished: true,
    uploading: false,
    uploadDone: false,
    uploadError: "",
  };
}

function fmtDur(sec: number) {
  if (!sec) return "";
  const m = Math.floor(sec / 60), s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

interface Props { storyList: Story[]; initialStoryId?: string; }

export default function BulkChaptersClient({ storyList, initialStoryId }: Props) {
  const router = useRouter();
  const [storyId, setStoryId]   = useState(initialStoryId ?? storyList[0]?.id ?? "");
  const [rows, setRows]         = useState<ChapterRow[]>(() => Array.from({length: 5}, (_, i) => newRow(i + 1)));
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);
  const [error, setError]       = useState("");
  const [globalFree, setGlobalFree] = useState(false);
  const [globalPublished, setGlobalPublished] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bulkTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Add rows
  function addRow(n = 1) {
    setRows(prev => {
      const start = prev.length + 1;
      return [...prev, ...Array.from({length: n}, (_, i) => newRow(start + i))];
    });
  }

  // Remove row
  function removeRow(id: string) {
    setRows(prev => prev.filter(r => r.id !== id));
  }

  // Update a field in a row
  function updateRow(id: string, field: keyof ChapterRow, value: any) {
    setRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  }

  // Apply global settings to all rows
  function applyGlobal() {
    setRows(prev => prev.map(r => ({
      ...r, isFree: globalFree, isPublished: globalPublished,
    })));
  }

  // Upload audio file for a row
  async function uploadAudio(rowId: string, file: File) {
    if (!storyId) { setError("Chon truyen truoc"); return; }
    updateRow(rowId, "uploading", true);
    updateRow(rowId, "uploadError", "");

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "audio", storyId, chapterId: rowId }),
      });
      const { uploadUrl, key } = await res.json();

      await fetch(uploadUrl, {
        method: "PUT", body: file,
        headers: { "Content-Type": file.type || "application/octet-stream" },
      });

      const cdnUrl = `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL ?? ""}/${key}`;
      updateRow(rowId, "audioUrl", cdnUrl);
      updateRow(rowId, "uploadDone", true);
    } catch (e) {
      updateRow(rowId, "uploadError", "Upload that bai");
    } finally {
      updateRow(rowId, "uploading", false);
    }
  }

  // Paste URLs in bulk (one per line)
  function handlePasteUrls(text: string) {
    const urls = text.split("\n").map(s => s.trim()).filter(Boolean);
    setRows(prev => {
      const updated = [...prev];
      urls.forEach((url, i) => {
        if (i < updated.length) {
          updated[i] = { ...updated[i], audioUrl: url, uploadDone: !!url };
        } else {
          const row = newRow(updated.length + 1);
          updated.push({ ...row, audioUrl: url, uploadDone: !!url });
        }
      });
      return updated;
    });
  }

  // Auto-generate titles from audio URLs
  function autoTitles() {
    setRows(prev => prev.map((r, i) => ({
      ...r,
      title: r.audioUrl
        ? r.audioUrl.split("/").pop()?.replace(/\.(m3u8|mp3|wav)$/i, "") || r.title
        : r.title,
    })));
  }

  // Save all
  async function save() {
    if (!storyId) { setError("Chon truyen truoc"); return; }
    const valid = rows.filter(r => r.title.trim());
    if (!valid.length) { setError("Can it nhat 1 chuong"); return; }

    setSaving(true); setError(""); setSaved(false);

    const res = await fetch("/api/admin/chapters/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ storyId, chapters: valid }),
    });

    setSaving(false);

    if (!res.ok) {
      const d = await res.json();
      setError(d.error ?? "Loi luu");
      return;
    }

    const data = await res.json();
    setSaved(true);
    setTimeout(() => {
      router.push(`/admin/chapters?storyId=${storyId}`);
      router.refresh();
    }, 1500);
  }

  const completedCount = rows.filter(r => r.uploadDone || r.audioUrl).length;
  const totalCount = rows.length;

  return (
    <div className="space-y-5">
      {/* Story selector */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <label className="block text-sm font-medium text-gray-700 mb-2">Truyện *</label>
        <StoryComboBox storyList={storyList} value={storyId} onChange={setStoryId} />
      </div>

      {/* Global settings */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-semibold text-gray-800">Cài đặt chung</p>
          <button onClick={applyGlobal}
            className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
            Áp dụng cho tất cả
          </button>
        </div>
        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={globalFree} onChange={e => setGlobalFree(e.target.checked)}
              className="w-4 h-4 rounded" />
            <span className="text-sm text-gray-700">Miễn phí</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={globalPublished} onChange={e => setGlobalPublished(e.target.checked)}
              className="w-4 h-4 rounded" />
            <span className="text-sm text-gray-700">Công khai ngay</span>
          </label>
        </div>
      </div>

      {/* Bulk URL paste */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
        <div className="flex items-start gap-3">
          <i className="ti ti-link text-blue-500 mt-0.5 flex-shrink-0" style={{ fontSize: 18 }} />
          <div className="flex-1">
            <p className="text-sm font-semibold text-blue-800 mb-1">Dán nhiều URL audio cùng lúc</p>
            <p className="text-xs text-blue-600 mb-2">Mỗi URL một dòng → tự động điền vào các chương</p>
            <textarea
              ref={bulkTextareaRef}
              rows={3}
              placeholder={"https://pub-xxx.r2.dev/story/ch1/index.m3u8\nhttps://pub-xxx.r2.dev/story/ch2/index.m3u8\nhttps://pub-xxx.r2.dev/story/ch3/index.m3u8"}
              className="w-full text-xs font-mono px-3 py-2 border border-blue-200 rounded-lg bg-white focus:outline-none focus:ring-2 resize-none"
            />
            <div className="flex gap-2 mt-2">
              <button onClick={() => {
                if (!bulkTextareaRef.current?.value) return;
                handlePasteUrls(bulkTextareaRef.current.value);
                bulkTextareaRef.current.value = "";
              }}
                className="text-xs px-3 py-1.5 rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors">
                <i className="ti ti-list mr-1" style={{ fontSize: 12 }} />
                Áp dụng
              </button>
              <button onClick={autoTitles}
                className="text-xs px-3 py-1.5 rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors">
                <i className="ti ti-wand mr-1" style={{ fontSize: 12 }} />
                Tự động tên từ URL
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Chapter table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-gray-800">{totalCount} chương</p>
            {completedCount > 0 && (
              <span className="text-xs bg-teal-50 text-teal-700 border border-teal-200 px-2 py-0.5 rounded-full">
                {completedCount} có audio
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={() => addRow(1)}
              className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors flex items-center gap-1">
              <i className="ti ti-plus" style={{ fontSize: 13 }} />+1 chương
            </button>
            <button onClick={() => addRow(5)}
              className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors flex items-center gap-1">
              <i className="ti ti-plus" style={{ fontSize: 13 }} />+5 chương
            </button>
            <button onClick={() => addRow(10)}
              className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors flex items-center gap-1">
              <i className="ti ti-plus" style={{ fontSize: 13 }} />+10 chương
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 w-8">#</th>
                <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 min-w-[180px]">Tên chương</th>
                <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 min-w-[200px]">Audio URL / Upload</th>
                <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 w-20">Thời lượng</th>
                <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 w-20">Miễn phí</th>
                <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 w-20">Coin</th>
                <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 w-20">Công khai</th>
                <th className="px-3 py-2.5 w-8" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr key={row.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="px-3 py-2 text-gray-400 text-xs font-mono">{idx + 1}</td>

                  {/* Title */}
                  <td className="px-3 py-2">
                    <input value={row.title} onChange={e => updateRow(row.id, "title", e.target.value)}
                      className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent"
                      placeholder={`Chương ${idx + 1}`} />
                  </td>

                  {/* Audio */}
                  <td className="px-3 py-2">
                    <div className="flex gap-1.5 items-center">
                      <input value={row.audioUrl} onChange={e => {
                        const val = e.target.value;
                        setRows(prev => prev.map(r => r.id === row.id ? { ...r, audioUrl: val, uploadDone: !!val } : r));
                      }}
                        className={`flex-1 min-w-0 px-2 py-1.5 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent font-mono ${
                          row.uploadError ? "border-rose-300" : row.uploadDone ? "border-teal-300" : "border-gray-200"
                        }`}
                        placeholder="https://... hoặc upload" />

                      {/* Upload button */}
                      <label className="flex-shrink-0 cursor-pointer">
                        <input type="file" accept=".m3u8,.mp3,.wav" className="hidden"
                          onChange={e => { const f = e.target.files?.[0]; if (f) uploadAudio(row.id, f); }} />
                        <div className={`flex items-center justify-center w-7 h-7 rounded-lg border transition-colors ${
                          row.uploading ? "border-amber-300 bg-amber-50" :
                          row.uploadDone ? "border-teal-300 bg-teal-50" : "border-gray-200 hover:bg-gray-50"
                        }`}>
                          {row.uploading
                            ? <i className="ti ti-loader-2 animate-spin text-amber-500" style={{ fontSize: 13 }} />
                            : row.uploadDone
                              ? <i className="ti ti-check text-teal-500" style={{ fontSize: 13 }} />
                              : <i className="ti ti-upload text-gray-400" style={{ fontSize: 13 }} />}
                        </div>
                      </label>
                    </div>
                    {row.uploadError && <p className="text-xs text-rose-500 mt-0.5">{row.uploadError}</p>}
                  </td>

                  {/* Duration */}
                  <td className="px-3 py-2">
                    <input type="number" value={row.durationSec || ""} min={0}
                      onChange={e => updateRow(row.id, "durationSec", Number(e.target.value))}
                      className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none"
                      placeholder="giây" />
                  </td>

                  {/* Free */}
                  <td className="px-3 py-2 text-center">
                    <input type="checkbox" checked={row.isFree}
                      onChange={e => updateRow(row.id, "isFree", e.target.checked)}
                      className="w-4 h-4 rounded cursor-pointer" />
                  </td>

                  {/* Coin cost */}
                  <td className="px-3 py-2">
                    <input type="number" value={row.coinCost || ""} min={0}
                      disabled={row.isFree}
                      onChange={e => updateRow(row.id, "coinCost", Number(e.target.value))}
                      className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none disabled:opacity-40 disabled:bg-gray-50" />
                  </td>

                  {/* Published */}
                  <td className="px-3 py-2 text-center">
                    <input type="checkbox" checked={row.isPublished}
                      onChange={e => updateRow(row.id, "isPublished", e.target.checked)}
                      className="w-4 h-4 rounded cursor-pointer" />
                  </td>

                  {/* Remove */}
                  <td className="px-3 py-2">
                    <button onClick={() => removeRow(row.id)}
                      className="text-gray-300 hover:text-rose-400 transition-colors p-1">
                      <i className="ti ti-x" style={{ fontSize: 14 }} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Add more buttons (bottom) */}
        <div className="px-5 py-3 border-t border-gray-100 flex gap-2">
          <button onClick={() => addRow(1)}
            className="text-xs px-3 py-1.5 rounded-lg border border-dashed border-gray-200 text-gray-400 hover:text-gray-600 hover:border-gray-300 transition-colors flex items-center gap-1">
            <i className="ti ti-plus" style={{ fontSize: 13 }} />Thêm 1 dòng
          </button>
          <button onClick={() => addRow(10)}
            className="text-xs px-3 py-1.5 rounded-lg border border-dashed border-gray-200 text-gray-400 hover:text-gray-600 hover:border-gray-300 transition-colors flex items-center gap-1">
            <i className="ti ti-plus" style={{ fontSize: 13 }} />Thêm 10 dòng
          </button>
        </div>
      </div>

      {/* Save */}
      {error && (
        <div className="flex items-center gap-2 text-sm text-rose-500 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
          <i className="ti ti-alert-circle flex-shrink-0" style={{ fontSize: 16 }} />{error}
        </div>
      )}
      {saved && (
        <div className="flex items-center gap-2 text-sm text-teal-600 bg-teal-50 border border-teal-200 rounded-xl px-4 py-3">
          <i className="ti ti-check flex-shrink-0" style={{ fontSize: 16 }} />
          Đã lưu thành công! Đang chuyển trang...
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-400">
          {rows.filter(r => r.title.trim()).length} chương sẽ được tạo
        </p>
        <div className="flex gap-3">
          <button onClick={() => router.back()}
            className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
            Huỷ
          </button>
          <button onClick={save} disabled={saving || saved || !storyId}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60 transition-all hover:opacity-90"
            style={{ backgroundColor: "var(--accent)" }}>
            {saving
              ? <><i className="ti ti-loader-2 animate-spin" style={{ fontSize: 16 }} />Đang lưu...</>
              : saved
                ? <><i className="ti ti-check" style={{ fontSize: 16 }} />Đã lưu!</>
                : <><i className="ti ti-device-floppy" style={{ fontSize: 16 }} />Lưu {rows.filter(r=>r.title.trim()).length} chương</>}
          </button>
        </div>
      </div>
    </div>
  );
}
