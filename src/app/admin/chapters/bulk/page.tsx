import { db } from "@/lib/db";
import { stories } from "@/lib/schema";
import { desc } from "drizzle-orm";
import BulkChaptersClient from "./BulkChaptersClient";

export const dynamic = "force-dynamic";

export default async function BulkChaptersPage({
  searchParams,
}: {
  searchParams: { storyId?: string };
}) {
  const storyList = await db
    .select({ id: stories.id, title: stories.title })
    .from(stories)
    .orderBy(desc(stories.createdAt));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Thêm hàng loạt chương</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Thêm nhiều chương cùng lúc cho một truyện
          </p>
        </div>
      </div>
      <BulkChaptersClient
        storyList={storyList}
        initialStoryId={searchParams.storyId}
      />
    </div>
  );
}
