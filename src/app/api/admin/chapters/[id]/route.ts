import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { chapters, users } from "@/lib/schema";
import { eq, sql } from "drizzle-orm";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const [u] = await db.select({ isAdmin: users.isAdmin }).from(users)
    .where(eq(users.id, session.user.id)).limit(1);
  return u?.isAdmin ? session : null;
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json();
  const [updated] = await db.update(chapters).set({
    title: body.title, chapterNumber: body.chapterNumber,
    audioUrl: body.audioUrl ?? null, durationSec: body.durationSec ?? null,
    isFree: body.isFree, coinCost: body.coinCost ?? 0,
    isPublished: body.isPublished,
  }).where(eq(chapters.id, params.id)).returning();
  await db.execute(sql`UPDATE stories SET total_chapters=(SELECT COUNT(*) FROM chapters WHERE story_id=${updated.storyId} AND is_published=true) WHERE id=${updated.storyId}`);
  return NextResponse.json(updated);
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const [ch] = await db.delete(chapters).where(eq(chapters.id, params.id)).returning({ storyId: chapters.storyId });
  if (ch?.storyId) {
    await db.execute(sql`UPDATE stories SET total_chapters=(SELECT COUNT(*) FROM chapters WHERE story_id=${ch.storyId} AND is_published=true) WHERE id=${ch.storyId}`);
  }
  return NextResponse.json({ ok: true });
}
