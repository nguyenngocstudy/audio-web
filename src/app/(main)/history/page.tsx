import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { listenProgress, chapters, stories } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";
import { fmtDuration, fmtDateTime } from "@/lib/utils";

export default async function HistoryPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const data = await db
    .select({
      progressId:    listenProgress.id,
      positionSec:   listenProgress.positionSec,
      updatedAt:     listenProgress.updatedAt,
      chapterId:     chapters.id,
      chapterTitle:  chapters.title,
      chapterNumber: chapters.chapterNumber,
      durationSec:   chapters.durationSec,
      storyId:       stories.id,
      storyTitle:    stories.title,
    })
    .from(listenProgress)
    .innerJoin(chapters, eq(listenProgress.chapterId, chapters.id))
    .innerJoin(stories, eq(chapters.storyId, stories.id))
    .where(eq(listenProgress.userId, session.user.id))
    .orderBy(desc(listenProgress.updatedAt))
    .limit(50);

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-xl font-bold text-gray-900 mb-5">Lịch sử nghe</h1>
      {data.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <i className="ti ti-history block mb-2" style={{ fontSize: 40 }} />
          <p>Bạn chưa nghe truyện nào</p>
          <Link href="/" className="text-brand-600 hover:underline text-sm mt-2 inline-block">Khám phá truyện hay</Link>
        </div>
      ) : (
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
      )}
    </div>
  );
}
