import { db } from "@/lib/db";
import { stories } from "@/lib/schema";
import { eq, desc, and } from "drizzle-orm";
import StoryCard from "@/components/story/StoryCard";
import { GENRE_LABEL } from "@/lib/utils";

const GENRES = Object.entries(GENRE_LABEL);

export default async function HomePage({ searchParams }: { searchParams: { genre?: string } }) {
  debugger
  const where = searchParams.genre
    ? and(eq(stories.isPublished, true), eq(stories.genre, searchParams.genre as any))
    : eq(stories.isPublished, true);

  const data = await db.select().from(stories)
    .where(where).orderBy(desc(stories.viewCount)).limit(48);
     console.log("STORIES COUNT:", data.length, "DATA:", JSON.stringify(data.slice(0,2)));

  return (
    <div>
      <div className="bg-gradient-to-r from-brand-600 to-purple-500 rounded-2xl p-6 mb-6 text-white">
        <h1 className="text-2xl font-bold mb-1">Truyện Audio Hay Nhất</h1>
        <p className="text-brand-100 text-sm">Nghe tình cảm, ngôn tình, cổ đại mọi lúc mọi nơi</p>
        <div className="mt-4 relative max-w-sm">
          <i className="ti ti-search absolute left-3 top-1/2 -translate-y-1/2 text-white/60" style={{ fontSize: 16 }} />
          <input placeholder="Tìm truyện yêu thích..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/20 placeholder-white/60 text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/50" />
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
        <a href="/" className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${!searchParams.genre ? "bg-brand-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
          Tất cả
        </a>
        {GENRES.map(([val, label]) => (
          <a key={val} href={`/?genre=${val}`}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${searchParams.genre === val ? "bg-brand-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
            {label}
          </a>
        ))}
      </div>

      {data.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {data.map(s => <StoryCard key={s.id} story={s} />)}
        </div>
      ) : (
        <div className="text-center py-20 text-gray-400">
          <i className="ti ti-mood-empty block mb-2" style={{ fontSize: 40 }} />
          <p>Chưa có truyện nào</p>
        </div>
      )}
    </div>
  );
}
