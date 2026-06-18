export const dynamic = "force-dynamic";
import { db } from "@/lib/db";
import { stories } from "@/lib/schema";
import { eq, desc, and } from "drizzle-orm";
import StoryCard from "@/components/story/StoryCard";
import { GENRE_LABEL } from "@/lib/utils";
import Link from "next/link";

const GENRES = Object.entries(GENRE_LABEL);

const GENRE_ICONS: Record<string, string> = {
  ngon_tinh: "ti-heart",
  tra_xanh: "ti-heart",
  trinh_tham: "ti-sparkles",
  co_dai: "ti-building-castle",
  hoc_duong: "ti-wand",
  hai_huoc: "ti-cloud-rain",
  hanh_dong: "ti-sword",
};

export default async function HomePage({ searchParams }: { searchParams: { genre?: string } }) {
  const where = searchParams.genre
    ? and(eq(stories.isPublished, true), eq(stories.genre, searchParams.genre as any))
    : eq(stories.isPublished, true);

  const allStories = await db.select().from(stories)
    .where(eq(stories.isPublished, true))
    .orderBy(desc(stories.viewCount))
    .limit(48);

  const filtered = searchParams.genre
    ? allStories.filter(s => s.genre === searchParams.genre)
    : allStories;

  const trending  = allStories.slice(0, 6);
  const newest    = [...allStories].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 6);

  return (
    <div className="min-h-screen">
      {/* ── HERO ──────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl mb-8"
        style={{ background: "linear-gradient(135deg, #0f0f1a 0%, #1a0a2e 40%, #2d1b4e 70%, #1a0a2e 100%)" }}>
        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-20 blur-3xl"
          style={{ backgroundColor: "var(--accent)", transform: "translate(30%, -30%)" }} />
        <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full opacity-10 blur-3xl"
          style={{ backgroundColor: "var(--accent)", transform: "translate(-20%, 30%)" }} />

        <div className="relative px-8 py-12 md:py-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium text-orange-300 bg-orange-500/20 border border-orange-500/30 mb-4">
            <i className="ti ti-flame" style={{ fontSize: 13 }} />
            Nội dung mới mỗi tuần
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-3 leading-tight">
            peakaudio<br />
          </h1>
          <p className="text-gray-400 text-sm md:text-base mb-8 max-w-lg">
            Truyện ngôn tình, tình cảm, cổ đại, huyền huyễn... Nghe mọi lúc mọi nơi trên mọi thiết bị.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/?#stories"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-white text-sm shadow-lg transition-all hover:scale-105 hover:shadow-xl"
              style={{ backgroundColor: "var(--accent)" }}>
              <i className="ti ti-player-play-filled" style={{ fontSize: 16 }} />
              Khám phá ngay
            </Link>
            <Link href="/vip"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm border border-amber-500/50 text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 transition-all hover:scale-105">
              <i className="ti ti-crown-filled" style={{ fontSize: 16 }} />
              Đăng ký VIP
            </Link>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap gap-6 mt-8 pt-6 border-t border-white/10">
            {[
              { icon: "ti-book", value: `${allStories.length}+`, label: "Truyện" },
              { icon: "ti-users", value: "10K+", label: "Người nghe" },
              { icon: "ti-headphones", value: "500K+", label: "Lượt nghe" },
              { icon: "ti-refresh", value: "Mỗi tuần", label: "Cập nhật" },
            ].map(s => (
              <div key={s.label} className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: "var(--accent-light)" }}>
                  <i className={`ti ${s.icon} text-sm`} style={{ color: "var(--accent)", fontSize: 15 }} />
                </div>
                <div>
                  <p className="text-white font-bold text-sm leading-none">{s.value}</p>
                  <p className="text-gray-500 text-xs mt-0.5">{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── VIP BANNER ─────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl mb-8 p-5"
        style={{ background: "linear-gradient(135deg, #78350f, #92400e, #b45309)" }}>
        <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-10">
          <i className="ti ti-crown-filled" style={{ fontSize: 80, color: "#fbbf24" }} />
        </div>
        <div className="relative flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center  mb-1">
              <i className="ti ti-crown-filled text-amber-400" style={{ fontSize: 18 }} />
              <p className="font-bold text-white text-base">Nâng cấp VIP ngay hôm nay</p>
            </div>
            <p className="text-amber-200 text-sm">Nghe không giới hạn tất cả truyện · Không quảng cáo · Chỉ từ 37.000đ/tháng</p>
          </div>
          <Link href="/vip"
            className="flex-shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-amber-900 font-bold text-sm transition-all hover:scale-105 shadow-lg">
            <i className="ti ti-star-filled" style={{ fontSize: 15 }} />
            Đăng ký VIP
          </Link>
        </div>
      </div>

      {/* ── GENRE FILTER ───────────────────────────────────────────── */}
      <div id="stories" className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
        <a href="/"
          className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all border ${
            !searchParams.genre
              ? "text-white border-transparent shadow-lg"
              : "bg-white/5 dark:bg-white/5 border-gray-200/30 text-gray-600 dark:text-gray-400 hover:bg-white/10"
          }`}
          style={!searchParams.genre ? { backgroundColor: "var(--accent)", borderColor: "var(--accent)" } : {}}>
          <i className="ti ti-grid-3x3" style={{ fontSize: 14 }} />
          Tất cả
        </a>
        {GENRES.map(([val, label]) => (
          <a key={val} href={`/?genre=${val}`}
            className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all border ${
              searchParams.genre === val
                ? "text-white border-transparent shadow-lg"
                : "bg-white/5 border-gray-200/30 text-gray-600 dark:text-gray-400 hover:bg-white/10"
            }`}
            style={searchParams.genre === val ? { backgroundColor: "var(--accent)", borderColor: "var(--accent)" } : {}}>
            <i className={`ti ${GENRE_ICONS[val] ?? "ti-bookmark"}`} style={{ fontSize: 14 }} />
            {label}
          </a>
        ))}
      </div>

      {/* ── TRENDING (only when no filter) ─────────────────────────── */}
      {!searchParams.genre && trending.length > 0 && (
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-orange-500/20">
                <i className="ti ti-trending-up text-orange-400" style={{ fontSize: 16 }} />
              </div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Xu hướng</h2>
            </div>
            <a href="/" className="text-sm font-medium hover:underline" style={{ color: "var(--accent)" }}>
              Xem tất cả →
            </a>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {trending.map(s => <StoryCard key={s.id} story={s} />)}
          </div>
        </section>
      )}

      {/* ── ALL / FILTERED ─────────────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: "var(--accent-light)" }}>
              <i className="ti ti-books" style={{ color: "var(--accent)", fontSize: 16 }} />
            </div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              {searchParams.genre ? GENRE_LABEL[searchParams.genre] ?? "Thể loại" : "Tất cả truyện"}
            </h2>
            <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
              {filtered.length}
            </span>
          </div>
        </div>
        {filtered.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {filtered.map(s => <StoryCard key={s.id} story={s} />)}
          </div>
        ) : (
          <div className="text-center py-20 text-gray-400">
            <i className="ti ti-mood-empty block mb-3" style={{ fontSize: 48 }} />
            <p className="font-medium">Chưa có truyện nào</p>
            <p className="text-sm mt-1">Hãy quay lại sau nhé!</p>
          </div>
        )}
      </section>
    </div>
  );
}
