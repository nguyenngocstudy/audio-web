import Image from "next/image";
import Link from "next/link";
import Badge from "@/components/ui/Badge";
import { GENRE_LABEL } from "@/lib/utils";
import type { Story } from "@/lib/schema";

export default function StoryCard({ story }: { story: Story }) {
  return (
    <Link href={`/stories/${story.id}`}
      className="group flex flex-col bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all">
      <div className="relative aspect-[3/4] bg-gray-100 overflow-hidden">
        {story.coverUrl ? (
          <Image src={story.coverUrl} alt={story.title} fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width:640px) 50vw, 200px" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-brand-100 to-brand-200">
            <i className="ti ti-book text-brand-400" style={{ fontSize: 40 }} />
          </div>
        )}
        <div className="absolute top-2 left-2">
          <Badge variant="info">{GENRE_LABEL[story.genre] ?? story.genre}</Badge>
        </div>
      </div>
      <div className="p-3">
        <p className="text-sm font-semibold text-gray-800 line-clamp-2 leading-snug mb-1">{story.title}</p>
        {story.author && <p className="text-xs text-gray-400 truncate">{story.author}</p>}
        <div className="flex items-center gap-1 mt-1.5 text-xs text-gray-400">
          <i className="ti ti-headphones" style={{ fontSize: 12 }} />
          <span>{story.viewCount.toLocaleString()}</span>
          <span className="mx-1">·</span>
          <span>{story.totalChapters} chương</span>
        </div>
      </div>
    </Link>
  );
}
