import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { listenProgress, chapters, stories } from "@/lib/schema";
import { eq, desc, and, ilike, countDistinct } from "drizzle-orm";
import Link from "next/link";
import { fmtDuration, fmtDateTime } from "@/lib/utils";

const PAGE_SIZE = 10;

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: { q?: string; page?: string };
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const q = searchParams.q?.trim() || "";
  const page = Math.max(1, Number(searchParams.page) || 1);
  const offset = (page - 1) * PAGE_SIZE;

  const qFilter = q ? ilike(stories.title, `%${q}%`) : undefined;

  const [{ count }] = await db
    .select({ count: countDistinct(listenProgress.chapterId) })
    .from(listenProgress)
    .innerJoin(chapters, eq(listenProgress.chapterId, chapters.id))
    .innerJoin(stories, eq(chapters.storyId, stories.id))
    .where(and(eq(listenProgress.userId, session.user.id), qFilter));

  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));

  // subquery: latest listenProgress per chapter via DISTINCT ON
  const latest = db.selectDistinctOn([listenProgress.chapterId], {
    id:          listenProgress.id,
    positionSec: listenProgress.positionSec,
    updatedAt:   listenProgress.updatedAt,
    chapterId:   listenProgress.chapterId,
  })
    .from(listenProgress)
    .where(eq(listenProgress.userId, session.user.id))
    .orderBy(listenProgress.chapterId, desc(listenProgress.updatedAt))
    .as("latest");

  const data = await db
    .select({
      progressId:    latest.id,
      positionSec:   latest.positionSec,
      updatedAt:     latest.updatedAt,
      chapterId:     chapters.id,
      chapterTitle:  chapters.title,
      chapterNumber: chapters.chapterNumber,
      durationSec:   chapters.durationSec,
      storyId:       stories.id,
      storyTitle:    stories.title,
    })
    .from(latest)
    .innerJoin(chapters, eq(latest.chapterId, chapters.id))
    .innerJoin(stories, eq(chapters.storyId, stories.id))
    .where(qFilter)
    .orderBy(desc(latest.updatedAt))
    .limit(PAGE_SIZE)
    .offset(offset);

  const pageHref = (p: number) => {
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    sp.set("page", String(p));
    return `/history?${sp.toString()}`;
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-xl font-bold text-gray-900 mb-5">Lịch sử nghe</h1>

      <form action="/history" method="GET" className="relative mb-4">
        <input
          name="q"
          defaultValue={q}
          placeholder="Tìm kiếm truyện..."
          className="w-full px-4 py-2.5 pl-10 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
        />
        <i className="ti ti-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" style={{ fontSize: 16 }} />
      </form>

      {data.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <i className="ti ti-history block mb-2" style={{ fontSize: 40 }} />
          <p>{q ? "Không tìm thấy kết quả" : "Bạn chưa nghe truyện nào"}</p>
          <Link href="/" className="text-brand-600 hover:underline text-sm mt-2 inline-block">Khám phá truyện hay</Link>
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-400 mb-3">{count.toLocaleString()} kết quả</p>
          <div className="space-y-2">
            {data.map(row => {
              const pct = row.durationSec && row.positionSec
                ? Math.round((row.positionSec / row.durationSec) * 100) : 0;
              return (
                <Link key={row.progressId} href={`/stories/${row.storyId}/chapters/${row.chapterId}`}
                  className="flex items-center gap-4 bg-white rounded-xl border border-gray-100 p-4 hover:shadow-sm transition-all">
                  <div className="w-12 h-12 rounded-lg bg-brand-100 flex items-center justify-center flex-shrink-0">
                    <i className="ti ti-headphones text-brand-500" style={{ fontSize: 20 }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 truncate">{row.storyTitle}</p>
                    <p className="text-sm text-gray-500 truncate">Ch.{row.chapterNumber} · {row.chapterTitle}</p>
                    <div className="mt-1.5 h-1 bg-gray-100 rounded-full w-full max-w-[200px]">
                      <div className="h-full bg-brand-500 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-gray-400">{fmtDateTime(row.updatedAt)}</p>
                    {row.durationSec && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        {fmtDuration(row.positionSec)} / {fmtDuration(row.durationSec)}
                      </p>
                    )}
                    <p className="text-xs text-brand-600 mt-1">Tiếp tục ›</p>
                  </div>
                </Link>
              );
            })}
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-gray-400">Trang {page}/{totalPages}</p>
              <div className="flex gap-2">
                {page > 1 && (
                  <Link href={pageHref(page - 1)}
                    className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    Trước
                  </Link>
                )}
                {page < totalPages && (
                  <Link href={pageHref(page + 1)}
                    className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    Sau
                  </Link>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
