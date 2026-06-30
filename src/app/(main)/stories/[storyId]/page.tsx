export const revalidate = 60;
import { db } from "@/lib/db";
import { stories, chapters, chapterUnlocks } from "@/lib/schema";
import { eq, and, asc, sql } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import Image from "next/image";
import { GENRE_LABEL, fmtDuration } from "@/lib/utils";
import StoryActions from "./StoryActions";
import ChapterCommentTabs from "./ChapterCommentTabs";

const GENRE_COLORS: Record<string, string> = {
  ngon_tinh:    "bg-rose-500/20 text-rose-300 border-rose-500/30",
  tra_xanh:    "bg-rose-500/20 text-rose-300 border-rose-500/30",
  trong_sinh:   "bg-purple-500/20 text-purple-300 border-purple-500/30",
  trinh_tham:   "bg-purple-500/20 text-purple-300 border-purple-500/30",
  co_dai:      "bg-amber-500/20 text-amber-300 border-amber-500/30",
  hoc_duong: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  hai_huoc:    "bg-slate-500/20 text-slate-300 border-slate-500/30",
  hanh_dong:   "bg-red-500/20 text-red-300 border-red-500/30",
};

export default async function StoryDetailPage({ params }: { params: { storyId: string } }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [story] = await Promise.all([
    db.select().from(stories)
      .where(and(eq(stories.id, params.storyId), eq(stories.isPublished, true)))
      .limit(1).then(r => r[0]),
  ]);
  if (!story) notFound();

  db.execute(sql`UPDATE stories SET view_count = view_count + 1 WHERE id = ${story.id}`);

  const [chapterList, unlocked, user, initialCommentCount] = await Promise.all([
    db.select().from(chapters)
      .where(and(eq(chapters.storyId, story.id), eq(chapters.isPublished, true)))
      .orderBy(asc(chapters.chapterNumber)),
    session?.user?.id
      ? db.select({ chapterId: chapterUnlocks.chapterId })
          .from(chapterUnlocks).where(eq(chapterUnlocks.userId, session.user.id))
          .then(rows => new Set(rows.map(r => r.chapterId)))
      : Promise.resolve(new Set<string>()),
    session?.user?.id
      ? db.query.users.findFirst({ where: (u, { eq }) => eq(u.id, session.user.id!) })
      : Promise.resolve(null),
    db.execute(sql`
      SELECT COUNT(c.id)::int AS cnt
      FROM community_comments c
      JOIN community_posts p ON p.id = c.post_id
      WHERE p.metadata = ${story.id} AND c.is_hidden = FALSE
    `).then(r => (r.rows[0] as any)?.cnt ?? 0).catch(() => 0),
  ]);

  const isVip = user?.vipUntil && new Date(user.vipUntil) > new Date();

  const totalDuration = chapterList.reduce((s, c) => s + (c.durationSec ?? 0), 0);
  const genreColor = GENRE_COLORS[story.genre] ?? "bg-gray-500/20 text-gray-300 border-gray-500/30";

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex gap-5 mb-6">
        <div className="relative w-32 h-44 flex-shrink-0 rounded-xl overflow-hidden">
          {story.coverUrl ? (
            <Image src={story.coverUrl} alt={story.title} fill className="object-cover" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-700">
              <i className="ti ti-book-2 text-white/20" style={{ fontSize: 48 }} />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0 py-1">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${genreColor}`}>
              {GENRE_LABEL[story.genre] ?? story.genre}
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-500/20 text-teal-300 border border-teal-500/30">
              <i className="ti ti-check" style={{ fontSize: 11 }} />Hoàn thành
            </span>
          </div>
          <h1 className="text-xl font-bold text-white mb-2 leading-snug">{story.title}</h1>
          {story.author && <p className="text-sm text-gray-400 mb-0.5">Tác giả: <span className="text-gray-300">{story.author}</span></p>}
          {story.narrator && <p className="text-sm text-gray-400 mb-3">Đọc bởi: <span className="text-gray-300">{story.narrator}</span></p>}
          <div className="flex items-center gap-4 text-sm text-gray-500 mb-4 flex-wrap">
            <span className="flex items-center gap-1.5"><i className="ti ti-headphones" style={{ fontSize: 14 }} />{story.viewCount.toLocaleString()} lượt</span>
            <span className="flex items-center gap-1.5"><i className="ti ti-list" style={{ fontSize: 14 }} />{story.totalChapters} tập</span>
            {totalDuration > 0 && <span className="flex items-center gap-1.5"><i className="ti ti-clock" style={{ fontSize: 14 }} />{Math.floor(totalDuration/3600)}h{Math.floor((totalDuration%3600)/60)}p</span>}
          </div>
          <StoryActions storyId={story.id} firstChapterId={chapterList[0]?.id} storyTitle={story.title} />
        </div>
      </div>

      {story.description && (
        <div className="rounded-xl p-4 mb-5 text-sm text-gray-400 leading-relaxed border border-white/8" style={{ backgroundColor: "rgba(255,255,255,0.03)" }}>
          {story.description}
        </div>
      )}

      <ChapterCommentTabs
        storyId={story.id}
        chapterList={chapterList}
        unlocked={unlocked}
        isVip={!!isVip}
        currentUserId={session?.user?.id}
        currentUserName={user?.name ?? undefined}
        initialComments={[]}
        initialCommentCount={initialCommentCount}
      />
    </div>
  );
}
