import { db } from "@/lib/db";
import { stories, chapters, listenProgress, chapterUnlocks } from "@/lib/schema";
import { eq, and, asc } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import AudioPlayer from "@/components/audio/AudioPlayer";
import Link from "next/link";
import { fmtDuration } from "@/lib/utils";

export default async function ChapterPage({ params }: {
  params: { storyId: string; chapterId: string }
}) {
  const session = await auth();

  const [story] = await db.select().from(stories)
    .where(eq(stories.id, params.storyId)).limit(1);
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

  const allChapters = await db
    .select({ id: chapters.id, chapterNumber: chapters.chapterNumber, title: chapters.title, durationSec: chapters.durationSec })
    .from(chapters)
    .where(and(eq(chapters.storyId, story.id), eq(chapters.isPublished, true)))
    .orderBy(asc(chapters.chapterNumber));

  const idx  = allChapters.findIndex(c => c.id === chapter.id);
  const next = allChapters[idx + 1] ?? null;
  const prev = allChapters[idx - 1] ?? null;

  const nextChapterUrl = next ? `/stories/${story.id}/chapters/${next.id}` : undefined;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-2 text-xs text-gray-500 mb-5 flex-wrap">
        <Link href="/" className="hover:text-gray-300 transition-colors">Trang chủ</Link>
        <i className="ti ti-chevron-right" style={{ fontSize: 11 }} />
        <Link href={`/stories/${story.id}`} className="hover:text-gray-300 transition-colors truncate max-w-[180px]">{story.title}</Link>
        <i className="ti ti-chevron-right" style={{ fontSize: 11 }} />
        <span className="text-gray-400">Ch.{chapter.chapterNumber}</span>
      </div>

      <h1 className="text-lg font-bold text-white mb-5">{chapter.title}</h1>

      <AudioPlayer
        audioUrl={chapter.audioUrl}
        title={chapter.title}
        author={story.narrator ?? story.author ?? undefined}
        coverUrl={story.coverUrl ?? undefined}
        chapterId={chapter.id}
        initialPosition={progress?.positionSec ?? 0}
        nextChapterUrl={nextChapterUrl}
      />

      <div className="flex items-center justify-between mt-5 gap-3">
        {prev ? (
          <Link href={`/stories/${story.id}/chapters/${prev.id}`}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 text-sm text-gray-300 hover:text-white hover:border-white/20 transition-all"
            style={{ backgroundColor: "rgba(255,255,255,0.04)" }}>
            <i className="ti ti-chevron-left" style={{ fontSize: 15 }} />
            <span className="hidden sm:inline">Chương trước</span>
            <span className="sm:hidden">Trước</span>
          </Link>
        ) : <div />}
        {next ? (
          <Link href={`/stories/${story.id}/chapters/${next.id}`}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm text-white font-medium transition-all hover:opacity-90"
            style={{ backgroundColor: "var(--accent)" }}>
            <span className="hidden sm:inline">Chương sau</span>
            <span className="sm:hidden">Sau</span>
            <i className="ti ti-chevron-right" style={{ fontSize: 15 }} />
          </Link>
        ) : <div />}
      </div>

      <div className="mt-6 rounded-xl border border-white/8 overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.02)" }}>
        <div className="px-4 py-3 border-b border-white/8">
          <p className="text-sm font-semibold text-white">Các chương ({allChapters.length})</p>
        </div>
        <div className="divide-y divide-white/5 max-h-72 overflow-y-auto">
          {allChapters.map(c => (
            <Link key={c.id} href={`/stories/${story.id}/chapters/${c.id}`}
              className={`flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                c.id === chapter.id ? "font-medium" : "text-gray-400 hover:text-gray-200 hover:bg-white/3"
              }`}
              style={c.id === chapter.id ? { backgroundColor: "var(--accent-light)", color: "var(--accent)" } : {}}>
              <span className="w-7 text-center text-xs text-gray-500 flex-shrink-0">{c.chapterNumber}</span>
              <span className="flex-1 truncate">{c.title}</span>
              {c.durationSec && <span className="text-xs text-gray-600 flex-shrink-0">{fmtDuration(c.durationSec)}</span>}
              {c.id === chapter.id && <i className="ti ti-volume flex-shrink-0" style={{ fontSize: 14, color: "var(--accent)" }} />}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
