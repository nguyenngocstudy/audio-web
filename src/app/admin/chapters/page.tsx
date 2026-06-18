export const dynamic = "force-dynamic";
import { db } from "@/lib/db";
import { chapters, stories } from "@/lib/schema";
import { eq, asc, desc } from "drizzle-orm";
import Link from "next/link";
import Badge from "@/components/ui/Badge";
import { fmtDuration, fmtDate } from "@/lib/utils";
import AdminChaptersClient from "./AdminChaptersClient";

export default async function AdminChaptersPage({
  searchParams,
}: {
  searchParams: { storyId?: string; q?: string };
}) {
  const storyList = await db
    .select({ id: stories.id, title: stories.title })
    .from(stories)
    .orderBy(desc(stories.createdAt));

  const selectedId = searchParams.storyId ?? storyList[0]?.id;
  const selectedStory = storyList.find(s => s.id === selectedId);

  const chapterList = selectedId
    ? await db.select().from(chapters)
        .where(eq(chapters.storyId, selectedId))
        .orderBy(asc(chapters.chapterNumber))
    : [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Quản lý chương</h1>
          <p className="text-sm text-gray-400 mt-0.5">{selectedStory?.title ?? "Chọn truyện"}</p>
        </div>
        <Link
          href={`/admin/chapters/new?storyId=${selectedId ?? ""}`}
          className="inline-flex items-center gap-2 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          style={{ backgroundColor: "var(--accent)" }}>
          <i className="ti ti-plus" style={{ fontSize: 15 }} />Thêm chương
        </Link>
      </div>

      {/* Searchable story selector */}
      <AdminChaptersClient
        storyList={storyList}
        selectedId={selectedId}
        chapterList={chapterList}
      />
    </div>
  );
}
