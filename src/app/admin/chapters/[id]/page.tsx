import { db } from "@/lib/db";
import { chapters, stories } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import ChapterForm from "./ChapterForm";

export default async function ChapterEditPage({ params, searchParams }: { params: { id: string }; searchParams: { storyId?: string } }) {
  const isNew = params.id === "new";
  const chapter = isNew ? null
    : (await db.select().from(chapters).where(eq(chapters.id, params.id)).limit(1))[0] ?? null;
  if (!isNew && !chapter) notFound();
  const storyList = await db.select({ id: stories.id, title: stories.title }).from(stories);
  const effectiveStoryId = chapter?.storyId ?? searchParams.storyId ?? storyList[0]?.id ?? "";
  return (
    <div className="max-w-xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">{isNew ? "Thêm chương mới" : "Chỉnh sửa chương"}</h1>
        {chapter && <p className="text-sm text-gray-400 mt-0.5">{chapter.title}</p>}
      </div>
      <ChapterForm chapter={chapter} storyId={effectiveStoryId} storyList={storyList} />
    </div>
  );
}
