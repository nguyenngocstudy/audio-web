"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Story  { id: string; title: string; }
interface Chapter {
  id: string; chapterNumber: number; title: string;
  durationSec: number | null; isFree: boolean; coinCost: number;
  isPublished: boolean; createdAt: Date;
}

interface Props {
  storyList:   Story[];
  selectedId:  string | undefined;
  chapterList: Chapter[];
}

function fmtDur(sec: number | null) {
  if (!sec) return "—";
  const m = Math.floor(sec / 60), s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function fmtDate(d: Date | string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

// ── Searchable story combobox ─────────────────────────────────────────────────
function StorySearchCombo({ storyList, selectedId }: { storyList: Story[]; selectedId?: string }) {
  const router = useRouter();
  const [query, setQuery]     = useState("");
  const [open, setOpen]       = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = storyList.find(s => s.id === selectedId);
  const filtered = query.trim()
    ? storyList.filter(s => s.title.toLowerCase().includes(query.toLowerCase()))
    : storyList;

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  function select(id: string) {
    setOpen(false); setQuery("");
    router.push(`/admin/chapters?storyId=${id}`);
  }

  return (
    <div ref={ref} className="relative mb-5">
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm hover:border-gray-300 transition-colors">
        <div className="flex items-center gap-2 min-w-0">
          <i className="ti ti-book text-gray-400 flex-shrink-0" style={{ fontSize: 16 }} />
          <span className="text-gray-800 truncate">{selected?.title ?? "Chọn truyện..."}</span>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0 text-gray-400">
          <span className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">{storyList.length} truyện</span>
          <i className={`ti ${open ? "ti-chevron-up" : "ti-chevron-down"}`} style={{ fontSize: 14 }} />
        </div>
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-white rounded-xl border border-gray-200 shadow-xl overflow-hidden">
          {/* Search input */}
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <i className="ti ti-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" style={{ fontSize: 14 }} />
              <input
                autoFocus
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Tìm truyện..."
                className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent"
              />
            </div>
          </div>
          {/* List */}
          <div className="max-h-64 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-gray-400">Không tìm thấy truyện</p>
            ) : filtered.map(s => (
              <button key={s.id} onClick={() => select(s.id)}
                className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-left hover:bg-gray-50 transition-colors ${s.id === selectedId ? "font-medium" : "text-gray-700"}`}
                style={s.id === selectedId ? { color: "var(--accent)", backgroundColor: "var(--accent-light)" } : {}}>
                {s.id === selectedId && <i className="ti ti-check flex-shrink-0" style={{ fontSize: 14, color: "var(--accent)" }} />}
                <span className="truncate">{s.title}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Searchable combo for ChapterForm ─────────────────────────────────────────
export function StoryComboBox({
  storyList, value, onChange,
}: {
  storyList: Story[];
  value: string;
  onChange: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen]   = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = storyList.find(s => s.id === value);
  const filtered = query.trim()
    ? storyList.filter(s => s.title.toLowerCase().includes(query.toLowerCase()))
    : storyList;

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg border border-gray-300 bg-white text-sm hover:border-gray-400 transition-colors focus:outline-none focus:ring-2">
        <span className="text-gray-800 truncate">{selected?.title ?? "Chọn truyện..."}</span>
        <i className={`ti ${open ? "ti-chevron-up" : "ti-chevron-down"} text-gray-400 flex-shrink-0`} style={{ fontSize: 14 }} />
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-white rounded-xl border border-gray-200 shadow-xl overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <i className="ti ti-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" style={{ fontSize: 13 }} />
              <input autoFocus value={query} onChange={e => setQuery(e.target.value)}
                placeholder="Tìm truyện..." className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent" />
            </div>
          </div>
          <div className="max-h-52 overflow-y-auto">
            {filtered.map(s => (
              <button key={s.id} type="button" onClick={() => { onChange(s.id); setOpen(false); setQuery(""); }}
                className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm text-left hover:bg-gray-50 transition-colors ${s.id === value ? "font-medium" : "text-gray-700"}`}
                style={s.id === value ? { color: "var(--accent)" } : {}}>
                {s.id === value && <i className="ti ti-check flex-shrink-0" style={{ fontSize: 13, color: "var(--accent)" }} />}
                <span className="truncate">{s.title}</span>
              </button>
            ))}
            {filtered.length === 0 && <p className="px-4 py-6 text-center text-sm text-gray-400">Không tìm thấy</p>}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main client component ──────────────────────────────────────────────────────
export default function AdminChaptersClient({ storyList, selectedId, chapterList }: Props) {
  const [search, setSearch] = useState("");

  const filtered = search.trim()
    ? chapterList.filter(c => c.title.toLowerCase().includes(search.toLowerCase()))
    : chapterList;

  return (
    <>
      <StorySearchCombo storyList={storyList} selectedId={selectedId} />

      {selectedId && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {/* Chapter search bar */}
          {chapterList.length > 10 && (
            <div className="p-3 border-b border-gray-100">
              <div className="relative max-w-xs">
                <i className="ti ti-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" style={{ fontSize: 14 }} />
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Tìm chương..."
                  className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent" />
              </div>
            </div>
          )}

          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {["#", "Tên chương", "Thời lượng", "Loại", "Trạng thái", "Ngày tạo", ""].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(ch => (
                <tr key={ch.id} className="border-b border-gray-50 hover:bg-gray-50 last:border-0 transition-colors">
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs">{ch.chapterNumber}</td>
                  <td className="px-4 py-3 font-medium text-gray-800 max-w-xs truncate">{ch.title}</td>
                  <td className="px-4 py-3 text-gray-500">{fmtDur(ch.durationSec)}</td>
                  <td className="px-4 py-3">
                    {ch.isFree
                      ? <span className="text-xs px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">Miễn phí</span>
                      : ch.coinCost > 0
                        ? <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">{ch.coinCost} coin</span>
                        : <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">VIP</span>}
                  </td>
                  <td className="px-4 py-3">
                    {ch.isPublished
                      ? <span className="text-xs px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">Đã đăng</span>
                      : <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">Nháp</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{fmtDate(ch.createdAt)}</td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/chapters/${ch.id}?storyId=${selectedId}`}
                      className="text-xs font-medium hover:underline"
                      style={{ color: "var(--accent)" }}>
                      Sửa
                    </Link>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="py-12 text-center text-gray-400">
                  {search ? "Không tìm thấy chương nào" : "Chưa có chương nào"}
                </td></tr>
              )}
            </tbody>
          </table>

          {chapterList.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-400">
              {search ? `${filtered.length}/${chapterList.length} chương` : `${chapterList.length} chương`}
            </div>
          )}
        </div>
      )}

      {!selectedId && (
        <div className="text-center py-16 text-gray-400">
          <i className="ti ti-book-off block mb-3" style={{ fontSize: 40 }} />
          <p>Chọn truyện để xem danh sách chương</p>
        </div>
      )}
    </>
  );
}
