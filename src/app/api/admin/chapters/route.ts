import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { chapters, users } from "@/lib/schema";
import { eq, asc, sql } from "drizzle-orm";
import { cdnUrl, audioKey } from "@/lib/r2";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const [u] = await db.select({ isAdmin: users.isAdmin }).from(users)
    .where(eq(users.id, session.user.id)).limit(1);
  return u?.isAdmin ? session : null;
}

export async function GET(req: NextRequest) {
  const storyId = new URL(req.url).searchParams.get("storyId");
  if (!storyId) return NextResponse.json({ error: "storyId required" }, { status: 400 });
  const data = await db.select().from(chapters)
    .where(eq(chapters.storyId, storyId)).orderBy(asc(chapters.chapterNumber));
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json();
  const [chapter] = await db.insert(chapters).values({
    storyId: body.storyId, title: body.title,
    chapterNumber: body.chapterNumber,
    audioUrl: body.audioUrl ?? null,
    durationSec: body.durationSec ?? null,
    isFree: body.isFree ?? false,
    coinCost: body.coinCost ?? 0,
    isPublished: body.isPublished ?? false,
  }).returning();
  await db.execute(sql`UPDATE stories SET total_chapters=(SELECT COUNT(*) FROM chapters WHERE story_id=${body.storyId} AND is_published=true) WHERE id=${body.storyId}`);
  return NextResponse.json(chapter, { status: 201 });
}
