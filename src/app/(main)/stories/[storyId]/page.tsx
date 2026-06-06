import { db } from "@/lib/db";
import { stories, chapters, chapterUnlocks } from "@/lib/schema";
import { eq, and, asc } from "drizzle-orm";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import Image from "next/image";
import Link from "next/link";
import Badge from "@/components/ui/Badge";
import { GENRE_LABEL, fmtDuration } from "@/lib/utils";

export default async function StoryDetailPage({ params }: { params: { storyId: string } }) {
  debugger
  const session = await auth();

  const [story] = await db.select().from(stories)
    .where(and(eq(stories.id, params.storyId), eq(stories.isPublished, true))).limit(1);
  if (!story) notFound();

  const chapterList = await db.select().from(chapters)
    .where(and(eq(chapters.storyId, story.id), eq(chapters.isPublished, true)))
    .orderBy(asc(chapters.chapterNumber));

  const unlocked = session?.user?.id
    ? new Set((await db.select({ chapterId: chapterUnlocks.chapterId })
        .from(chapterUnlocks).where(eq(chapterUnlocks.userId, session.user.id)))
        .map(r => r.chapterId))
    : new Set<string>();

  const user = session?.user?.id
    ? await db.query.users.findFirst({ where: (u, { eq }) => eq(u.id, session.user.id) })
    : null;
  const isVip = user?.vipUntil && new Date(user.vipUntil) > new Date();

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex gap-5 mb-6">
        <div className="relative w-28 h-40 flex-shrink-0 rounded-xl overflow-hidden bg-gray-100">
          {story.coverUrl ? (
            <Image src={story.coverUrl} alt={story.title} fill className="object-cover" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-brand-100 to-brand-200">
              <i className="ti ti-book text-brand-400" style={{ fontSize: 32 }} />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <Badge variant="info" className="mb-2">{GENRE_LABEL[story.genre]}</Badge>
          <h1 className="text-xl font-bold text-gray-900 mb-1">{story.title}</h1>
          {story.author   && <p className="text-sm text-gray-500 mb-0.5">Tác giả: {story.author}</p>}
          {story.narrator && <p className="text-sm text-gray-500 mb-2">Đọc bởi: {story.narrator}</p>}
          <div className="flex items-center gap-3 text-xs text-gray-400">
            <span className="flex items-center gap-1"><i className="ti ti-headphones" style={{ fontSize: 13 }} />{story.viewCount.toLocaleString()} lượt</span>
            <span className="flex items-center gap-1"><i className="ti ti-list" style={{ fontSize: 13 }} />{story.totalChapters} chương</span>
          </div>
          {chapterList.length > 0 && (
            <Link href={`/stories/${story.id}/chapters/${chapterList[0].id}`}
              className="inline-flex items-center gap-2 mt-3 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg transition-colors">
              <i className="ti ti-player-play" style={{ fontSize: 15 }} />Nghe từ đầu
            </Link>
          )}
        </div>
      </div>

      {story.description && (
        <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
          <p className="text-sm text-gray-600 leading-relaxed">{story.description}</p>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-50">
          <p className="font-semibold text-gray-800">Danh sách chương ({chapterList.length})</p>
        </div>
        <div className="divide-y divide-gray-50">
          {chapterList.map(ch => {
            const canPlay = ch.isFree || isVip || unlocked.has(ch.id);
            return (
              <div key={ch.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-medium text-gray-500">{ch.chapterNumber}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800 truncate">{ch.title}</p>
                  {ch.durationSec && <p className="text-xs text-gray-400 mt-0.5">{fmtDuration(ch.durationSec)}</p>}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {ch.isFree && <Badge variant="success">Miễn phí</Badge>}
                  {!ch.isFree && !isVip && !unlocked.has(ch.id) && ch.coinCost > 0 && (
                    <Badge variant="warning">{ch.coinCost} coin</Badge>
                  )}
                  {canPlay ? (
                    <Link href={`/stories/${story.id}/chapters/${ch.id}`}
                      className="flex items-center gap-1 px-3 py-1.5 bg-brand-50 hover:bg-brand-100 text-brand-700 text-xs font-medium rounded-lg transition-colors">
                      <i className="ti ti-player-play" style={{ fontSize: 12 }} />Nghe
                    </Link>
                  ) : (
                    <Link href="/vip"
                      className="flex items-center gap-1 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-medium rounded-lg transition-colors">
                      <i className="ti ti-lock" style={{ fontSize: 12 }} />VIP
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
          {chapterList.length === 0 && (
            <p className="py-10 text-center text-sm text-gray-400">Chưa có chương nào</p>
          )}
        </div>
      </div>
    </div>
  );
}
