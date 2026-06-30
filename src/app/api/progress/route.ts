import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { listenProgress } from "@/lib/schema";
import { sql } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { chapterId, positionSec } = await req.json();
  if (!chapterId || positionSec === undefined) return NextResponse.json({ error: "Bad request" }, { status: 400 });
  await db.insert(listenProgress).values({
    userId: session.user.id,
    chapterId,
    positionSec: Math.floor(positionSec),
  }).onConflictDoUpdate({
    target: [listenProgress.userId, listenProgress.chapterId],
    set: { positionSec: Math.floor(positionSec), updatedAt: sql`now()` },
  });
  return NextResponse.json({ ok: true });
}
