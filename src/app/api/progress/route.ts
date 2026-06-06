import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { listenProgress } from "@/lib/schema";
import { and, eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { chapterId, positionSec } = await req.json();
  if (!chapterId || positionSec === undefined) return NextResponse.json({ error: "Bad request" }, { status: 400 });
  const existing = await db.select({ id: listenProgress.id }).from(listenProgress)
    .where(and(eq(listenProgress.userId, session.user.id), eq(listenProgress.chapterId, chapterId))).limit(1);
  if (existing.length) {
    await db.update(listenProgress)
      .set({ positionSec: Math.floor(positionSec), updatedAt: new Date() })
      .where(and(eq(listenProgress.userId, session.user.id), eq(listenProgress.chapterId, chapterId)));
  } else {
    await db.insert(listenProgress).values({ userId: session.user.id, chapterId, positionSec: Math.floor(positionSec) });
  }
  return NextResponse.json({ ok: true });
}
