export const dynamic = "force-dynamic";
import { db } from "@/lib/db";
import { stories } from "@/lib/schema";
import { desc, sql } from "drizzle-orm";
import Link from "next/link";
import Badge from "@/components/ui/Badge";
import { GENRE_LABEL, fmtDate } from "@/lib/utils";

const PAGE_SIZE = 20;

export default async function AdminStoriesPage({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  const page = Math.max(1, Number(searchParams.page) || 1);
  const offset = (page - 1) * PAGE_SIZE;

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(stories);
  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));

  const data = await db
    .select()
    .from(stories)
    .orderBy(desc(stories.createdAt))
    .limit(PAGE_SIZE)
    .offset(offset);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-xl font-semibold text-gray-900">Quản lý truyện</h1>
          <p className="text-sm text-gray-400 mt-0.5">{count.toLocaleString()} truyện</p></div>
        <Link href="/admin/stories/new"
          className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          <i className="ti ti-plus" style={{ fontSize: 15 }} />Thêm truyện
        </Link>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="bg-gray-50 border-b border-gray-100">
            {["Tên truyện", "Thể loại", "Chương", "Lượt xem", "Trạng thái", "Ngày tạo", ""].map(h => (
              <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500">{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {data.map(s => (
              <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50 last:border-0">
                <td className="px-4 py-3"><p className="font-medium text-gray-800 max-w-xs truncate">{s.title}</p><p className="text-xs text-gray-400">{s.author ?? ""}</p></td>
                <td className="px-4 py-3 text-gray-600">{GENRE_LABEL[s.genre] ?? s.genre}</td>
                <td className="px-4 py-3 text-gray-600">{s.totalChapters}</td>
                <td className="px-4 py-3 text-gray-600">{s.viewCount.toLocaleString()}</td>
                <td className="px-4 py-3"><Badge variant={s.isPublished ? "success" : "neutral"}>{s.isPublished ? "Đã đăng" : "Nháp"}</Badge></td>
                <td className="px-4 py-3 text-gray-400 text-xs">{fmtDate(s.createdAt)}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-3">
                    <Link href={`/admin/stories/${s.id}`} className="text-xs text-brand-600 hover:underline">Sửa</Link>
                    <Link href={`/admin/chapters?storyId=${s.id}`} className="text-xs text-gray-500 hover:underline">Chương</Link>
                  </div>
                </td>
              </tr>
            ))}
            {data.length === 0 && <tr><td colSpan={7} className="py-12 text-center text-gray-400">Chưa có truyện nào</td></tr>}
          </tbody>
        </table>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-sm text-gray-400">Trang {page}/{totalPages}</p>
            <div className="flex gap-2">
              {page > 1 && (
                <Link
                  href={`/admin/stories?page=${page - 1}`}
                  className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Trước
                </Link>
              )}
              {page < totalPages && (
                <Link
                  href={`/admin/stories?page=${page + 1}`}
                  className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Sau
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
