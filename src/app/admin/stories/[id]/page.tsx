import { db } from "@/lib/db";
import { stories } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import StoryForm from "./StoryForm";

export default async function StoryEditPage({ params }: { params: { id: string } }) {
  const isNew = params.id === "new";
  const story = isNew ? null
    : (await db.select().from(stories).where(eq(stories.id, params.id)).limit(1))[0] ?? null;
  if (!isNew && !story) notFound();
  return (
    <div className="max-w-xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">{isNew ? "Thêm truyện mới" : "Chỉnh sửa truyện"}</h1>
        {story && <p className="text-sm text-gray-400 mt-0.5">{story.title}</p>}
      </div>
      <StoryForm story={story} />
    </div>
  );
}
