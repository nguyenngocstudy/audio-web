import Image from "next/image";
import Link from "next/link";
import Badge from "@/components/ui/Badge";
import { GENRE_LABEL } from "@/lib/utils";
import type { Story } from "@/lib/schema";

const GENRE_COLORS: Record<string, string> = {
  ngon_tinh: "bg-rose-500/80",
  tra_xanh: "bg-green-500/80",
  trinh_tham: "bg-purple-500/80",
  trong_sinh: "bg-purple-500/80",
  co_dai: "bg-amber-600/80",
  hoc_duong: "bg-blue-500/80",
  hai_huoc: "bg-slate-500/80",
  hanh_dong: "bg-red-500/80",
};

const GENRE_BG: Record<string, string> = {
  ngon_tinh:    "from-rose-900 to-rose-700",
  tra_xanh:     "from-green-900 to-green-700",
  trinh_tham:   "from-purple-900 to-purple-700",
  trong_sinh:   "from-purple-900 to-purple-700",
  co_dai:      "from-amber-900 to-amber-700",
  hoc_duong: "from-blue-900 to-blue-700",
  hai_huoc:    "from-slate-800 to-slate-600",
  hanh_dong:   "from-red-900 to-red-700",
};

export default function StoryCard({ story, priority }: { story: Story; priority?: boolean }) {
  return (
    <Link href={`/stories/${story.id}`}
      className="group flex flex-col rounded-xl overflow-hidden hover:scale-[1.03] hover:shadow-xl transition-all duration-200 cursor-pointer"
      style={{ backgroundColor: "var(--card-bg, #1a1a2e)" }}>

      {/* Cover */}
      <div className="relative aspect-[3/4] overflow-hidden bg-gray-900">
        {story.coverUrl ? (
          <Image
            src={story.coverUrl}
            alt={story.title}
            fill
            loading={priority ? "eager" : "lazy"}
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width:640px) 50vw, (max-width:1024px) 33vw, 200px"
          />
        ) : (
          <div className={`absolute inset-0 bg-gradient-to-br ${GENRE_BG[story.genre] ?? "from-gray-800 to-gray-600"} flex items-center justify-center`}>
            <i className="ti ti-book-2 text-white/30" style={{ fontSize: 52 }} />
          </div>
        )}

        {/* Gradient overlay at bottom */}
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/80 to-transparent" />

        {/* Genre badge */}
        <div className="absolute top-2 left-2">
          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold text-white ${GENRE_COLORS[story.genre] ?? "bg-gray-500/80"} backdrop-blur-sm`}>
            {GENRE_LABEL[story.genre] ?? story.genre}
          </span>
        </div>

        {/* View count at bottom */}
        <div className="absolute bottom-2 left-2 flex items-center gap-1 text-white/80 text-xs">
          <i className="ti ti-headphones" style={{ fontSize: 11 }} />
          <span>{story.viewCount >= 1000 ? `${(story.viewCount/1000).toFixed(1)}K` : story.viewCount}</span>
        </div>

        {/* Chapter count at bottom right */}
        <div className="absolute bottom-2 right-2 flex items-center gap-1 text-white/80 text-xs">
          <i className="ti ti-list" style={{ fontSize: 11 }} />
          <span>{story.totalChapters} tập</span>
        </div>
      </div>

      {/* Info */}
      <div className="p-2.5">
        <p className="text-sm font-semibold text-gray-100 line-clamp-2 leading-snug mb-1 group-hover:text-white transition-colors">
          {story.title}
        </p>
        {story.author && (
          <p className="text-xs text-gray-500 truncate flex items-center gap-1">
            <i className="ti ti-user" style={{ fontSize: 11 }} />
            {story.author}
          </p>
        )}
      </div>
    </Link>
  );
}
