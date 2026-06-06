import { db } from "@/lib/db";
import { chapters, stories } from "@/lib/schema";
import { eq, asc, desc } from "drizzle-orm";
import Link from "next/link";
import Badge from "@/components/ui/Badge";
import { fmtDuration, fmtDate } from "@/lib/utils";

export default async function AdminChaptersPage({ searchParams }: { searchParams: { storyId?: string } }) {
  const storyList = await db.select({ id: stories.id, title: stories.title })
    .from(stories).orderBy(desc(stories.createdAt));
  const selectedId = searchParams.storyId ?? storyList[0]?.id;
  const selectedStory = storyList.find(s => s.id === selectedId);
  const chapterList = selectedId
    ? await db.select().from(chapters).where(eq(chapters.storyId, selectedId)).orderBy(asc(chapters.chapterNumber))
    : [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-xl font-semibold text-gray-900">Quản lý chương</h1>
          <p className="text-sm text-gray-400 mt-0.5">{selectedStory?.title ?? "Chọn truyện"}</p></div>
        <Link href={`/admin/chapters/new?storyId=${selectedId ?? ""}`}
          className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          <i className="ti ti-plus" style={{ fontSize: 15 }} />Thêm chương
        </Link>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-2 mb-5">
        {storyList.map(s => (
          <Link key={s.id} href={`/admin/chapters?storyId=${s.id}`}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${s.id === selectedId ? "bg-brand-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
            {s.title.length > 22 ? s.title.slice(0, 22) + "…" : s.title}
          </Link>
        ))}
      </div>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="bg-gray-50 border-b border-gray-100">
            {["#", "Tên chương", "Thời lượng", "Loại", "Trạng thái", "Ngày tạo", ""].map(h => (
              <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500">{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {chapterList.map(ch => (
              <tr key={ch.id} className="border-b border-gray-50 hover:bg-gray-50 last:border-0">
                <td className="px-4 py-3 text-gray-500 font-mono text-xs">{ch.chapterNumber}</td>
                <td className="px-4 py-3 font-medium text-gray-800 max-w-xs truncate">{ch.title}</td>
                <td className="px-4 py-3 text-gray-500">{ch.durationSec ? fmtDuration(ch.durationSec) : "—"}</td>
                <td className="px-4 py-3">
                  {ch.isFree ? <Badge variant="success">Miễn phí</Badge>
                    : ch.coinCost > 0 ? <Badge variant="warning">{ch.coinCost} coin</Badge>
                    : <Badge variant="neutral">VIP</Badge>}
                </td>
                <td className="px-4 py-3"><Badge variant={ch.isPublished ? "success" : "neutral"}>{ch.isPublished ? "Đã đăng" : "Nháp"}</Badge></td>
                <td className="px-4 py-3 text-gray-400 text-xs">{fmtDate(ch.createdAt)}</td>
                <td className="px-4 py-3">
                  <Link href={`/admin/chapters/${ch.id}?storyId=${selectedId}`} className="text-xs text-brand-600 hover:underline">Sửa</Link>
                </td>
              </tr>
            ))}
            {chapterList.length === 0 && <tr><td colSpan={7} className="py-12 text-center text-gray-400">Chưa có chương nào</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
