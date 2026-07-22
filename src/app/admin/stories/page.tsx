export const dynamic = "force-dynamic";
import { db } from "@/lib/db";
import { stories } from "@/lib/schema";
import { desc, sql, ilike, or } from "drizzle-orm";
import Link from "next/link";
import Badge from "@/components/ui/Badge";
import { GENRE_LABEL, fmtDate } from "@/lib/utils";

const PAGE_SIZE = 20;

export default async function AdminStoriesPage({
  searchParams,
}: {
  searchParams: { page?: string; q?: string };
}) {
  const page = Math.max(1, Number(searchParams.page) || 1);
  const q = searchParams.q?.trim() ?? "";
  const offset = (page - 1) * PAGE_SIZE;

  const where = q
    ? or(ilike(stories.title, `%${q}%`), ilike(stories.author, `%${q}%`))
    : undefined;

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(stories)
    .where(where);
  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));

  const data = await db
    .select()
    .from(stories)
    .where(where)
    .orderBy(desc(stories.createdAt))
    .limit(PAGE_SIZE)
    .offset(offset);

  return (
    <div>
      <div className="flex items-center justify-between mb-4 sm:mb-6 gap-3">
        <div><h1 className="text-lg sm:text-xl font-semibold text-gray-900">Quản lý truyện</h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-0.5">{count.toLocaleString()} truyện</p></div>
        <Link href="/admin/stories/new"
          className="inline-flex items-center gap-1.5 sm:gap-2 bg-brand-600 hover:bg-brand-700 text-white text-xs sm:text-sm font-medium px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg transition-colors flex-shrink-0">
          <i className="ti ti-plus" style={{ fontSize: 14 }} />Thêm truyện
        </Link>
      </div>
      <form className="mb-3 sm:mb-4">
        <div className="relative">
          <i className="ti ti-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" style={{ fontSize: 16 }} />
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Tìm theo tên truyện hoặc tác giả..."
            className="w-full pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          />
        </div>
      </form>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs sm:text-sm">
            <thead><tr className="bg-gray-50 border-b border-gray-100">
              {["Tên truyện", "Thể loại", "Chương", "Lượt xem", "Trạng thái", "Ngày tạo", ""].map(h => (
                <th key={h} className="px-3 sm:px-4 py-2.5 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 whitespace-nowrap">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {data.map(s => (
                <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50 last:border-0">
                  <td className="px-3 sm:px-4 py-2.5 sm:py-3"><p className="font-medium text-gray-800 max-w-[140px] sm:max-w-xs truncate">{s.title}</p><p className="text-[10px] sm:text-xs text-gray-400 truncate max-w-[140px] sm:max-w-none">{s.author ?? ""}</p></td>
                  <td className="px-3 sm:px-4 py-2.5 sm:py-3 text-gray-600 whitespace-nowrap">{GENRE_LABEL[s.genre] ?? s.genre}</td>
                  <td className="px-3 sm:px-4 py-2.5 sm:py-3 text-gray-600">{s.totalChapters}</td>
                  <td className="px-3 sm:px-4 py-2.5 sm:py-3 text-gray-600 whitespace-nowrap">{s.viewCount.toLocaleString()}</td>
                  <td className="px-3 sm:px-4 py-2.5 sm:py-3"><Badge variant={s.isPublished ? "success" : "neutral"}>{s.isPublished ? "Đã đăng" : "Nháp"}</Badge></td>
                  <td className="px-3 sm:px-4 py-2.5 sm:py-3 text-gray-400 text-[10px] sm:text-xs whitespace-nowrap">{fmtDate(s.createdAt)}</td>
                  <td className="px-3 sm:px-4 py-2.5 sm:py-3">
                    <div className="flex gap-2 sm:gap-3">
                      <Link href={`/admin/stories/${s.id}`} className="text-[10px] sm:text-xs text-brand-600 hover:underline">Sửa</Link>
                      <Link href={`/admin/chapters?storyId=${s.id}`} className="text-[10px] sm:text-xs text-gray-500 hover:underline">Chương</Link>
                    </div>
                  </td>
                </tr>
              ))}
              {data.length === 0 && <tr><td colSpan={7} className="py-8 sm:py-12 text-center text-gray-400 text-sm">Chưa có truyện nào</td></tr>}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 border-t border-gray-100">
            <p className="text-xs sm:text-sm text-gray-400">Trang {page}/{totalPages}</p>
            <div className="flex gap-1.5 sm:gap-2">
              {page > 1 && (
                <Link
                  href={`/admin/stories?page=${page - 1}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
                  className="px-2.5 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm text-gray-600 hover:text-gray-900 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Trước
                </Link>
              )}
              {page < totalPages && (
                <Link
                  href={`/admin/stories?page=${page + 1}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
                  className="px-2.5 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm text-gray-600 hover:text-gray-900 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
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
