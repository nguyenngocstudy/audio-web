import { db } from "@/lib/db";
import { stories, chapters, listenProgress, chapterUnlocks } from "@/lib/schema";
import { eq, and, asc } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import AudioPlayer from "@/components/audio/AudioPlayer";
import Link from "next/link";
import { fmtDuration } from "@/lib/utils";

export default async function ChapterPage({ params }: { params: { storyId: string; chapterId: string } }) {
  const session = await auth();

  const [story] = await db.select().from(stories).where(eq(stories.id, params.storyId)).limit(1);
  if (!story) notFound();

  const [chapter] = await db.select().from(chapters)
    .where(and(eq(chapters.id, params.chapterId), eq(chapters.isPublished, true))).limit(1);
  if (!chapter) notFound();

  const user = session?.user?.id
    ? await db.query.users.findFirst({ where: (u, { eq }) => eq(u.id, session.user.id) })
    : null;
  const isVip = user?.vipUntil && new Date(user.vipUntil) > new Date();

  const unlocked = session?.user?.id
    ? !!(await db.select().from(chapterUnlocks)
        .where(and(eq(chapterUnlocks.userId, session.user.id), eq(chapterUnlocks.chapterId, chapter.id)))
        .limit(1)).length
    : false;

  if (!chapter.isFree && !isVip && !unlocked) redirect(`/stories/${story.id}`);
  if (!chapter.audioUrl) notFound();

  const progress = session?.user?.id
    ? (await db.select().from(listenProgress)
        .where(and(eq(listenProgress.userId, session.user.id), eq(listenProgress.chapterId, chapter.id)))
        .limit(1))[0]
    : null;

  const allChapters = await db.select({ id: chapters.id, chapterNumber: chapters.chapterNumber, title: chapters.title })
    .from(chapters)
    .where(and(eq(chapters.storyId, story.id), eq(chapters.isPublished, true)))
    .orderBy(asc(chapters.chapterNumber));

  const idx  = allChapters.findIndex(c => c.id === chapter.id);
  const next = allChapters[idx + 1] ?? null;
  const prev = allChapters[idx - 1] ?? null;

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
        <Link href="/" className="hover:text-gray-600">Trang chủ</Link>
        <i className="ti ti-chevron-right" style={{ fontSize: 13 }} />
        <Link href={`/stories/${story.id}`} className="hover:text-gray-600 truncate max-w-[160px]">{story.title}</Link>
        <i className="ti ti-chevron-right" style={{ fontSize: 13 }} />
        <span className="text-gray-600">Ch.{chapter.chapterNumber}</span>
      </div>

      <h1 className="text-lg font-bold text-gray-900 mb-4">{chapter.title}</h1>

      <AudioPlayer
        audioUrl={chapter.audioUrl}
        title={chapter.title}
        author={story.narrator ?? story.author ?? undefined}
        coverUrl={story.coverUrl ?? undefined}
        chapterId={chapter.id}
        initialPosition={progress?.positionSec ?? 0}
      />

      <div className="flex items-center justify-between mt-4 gap-3">
        {prev ? (
          <Link href={`/stories/${story.id}/chapters/${prev.id}`}
            className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors">
            <i className="ti ti-chevron-left" style={{ fontSize: 15 }} />Chương trước
          </Link>
        ) : <div />}
        {next ? (
          <Link href={`/stories/${story.id}/chapters/${next.id}`}
            className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-medium transition-colors">
            Chương sau<i className="ti ti-chevron-right" style={{ fontSize: 15 }} />
          </Link>
        ) : <div />}
      </div>

      <div className="mt-6 bg-white rounded-xl border border-gray-100 overflow-hidden">
        <p className="px-4 py-3 text-sm font-semibold text-gray-700 border-b border-gray-50">Các chương ({allChapters.length})</p>
        <div className="divide-y divide-gray-50 max-h-72 overflow-y-auto">
          {allChapters.map(c => (
            <Link key={c.id} href={`/stories/${story.id}/chapters/${c.id}`}
              className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${c.id === chapter.id ? "bg-brand-50 text-brand-700 font-medium" : "text-gray-600 hover:bg-gray-50"}`}>
              <span className="w-8 text-center text-xs text-gray-400">{c.chapterNumber}</span>
              <span className="flex-1 truncate">{c.title}</span>
              {c.id === chapter.id && <i className="ti ti-volume text-brand-600" style={{ fontSize: 14 }} />}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
