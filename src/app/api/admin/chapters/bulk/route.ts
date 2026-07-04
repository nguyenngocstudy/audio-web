import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { chapters, users } from "@/lib/schema";
import { eq, max, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const [u] = await db.select({ isAdmin: users.isAdmin }).from(users)
    .where(eq(users.id, session.user.id)).limit(1);
  return u?.isAdmin ? session : null;
}

interface BulkChapter {
  title: string;
  audioUrl: string;
  durationSec: number;
  isFree: boolean;
  coinCost: number;
  isPublished: boolean;
}

export async function POST(req: NextRequest) {
  if (!await requireAdmin())
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { storyId, chapters: bulkChapters } = await req.json() as {
    storyId: string;
    chapters: BulkChapter[];
  };

  if (!storyId)
    return NextResponse.json({ error: "storyId required" }, { status: 400 });
  if (!bulkChapters?.length)
    return NextResponse.json({ error: "No chapters" }, { status: 400 });
  if (bulkChapters.length > 200)
    return NextResponse.json({ error: "Max 200 chapters at once" }, { status: 400 });

  // Get current max chapter number
  const [{ maxNum }] = await db
    .select({ maxNum: max(chapters.chapterNumber) })
    .from(chapters)
    .where(eq(chapters.storyId, storyId));

  let num = (maxNum ?? 0) + 1;

  const toInsert = bulkChapters.map(ch => ({
    storyId,
    title:         ch.title?.trim() || `Chuong ${num}`,
    chapterNumber: num++,
    audioUrl:      ch.audioUrl?.trim() || null,
    durationSec:   ch.durationSec > 0 ? ch.durationSec : null,
    isFree:        ch.isFree ?? false,
    coinCost:      ch.coinCost ?? 0,
    isPublished:   ch.isPublished ?? true,
  }));

  const inserted = await db.insert(chapters).values(toInsert).returning();

  // Update total_chapters
  await db.execute(sql`
    UPDATE stories
    SET total_chapters = (
      SELECT COUNT(*) FROM chapters
      WHERE story_id = ${storyId} AND is_published = true
    )
    WHERE id = ${storyId}
  `);

  return NextResponse.json({ ok: true, count: inserted.length });
}
