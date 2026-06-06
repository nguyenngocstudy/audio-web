import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { createUploadUrl, audioKey, coverKey } from "@/lib/r2";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const [u] = await db.select({ isAdmin: users.isAdmin }).from(users).where(eq(users.id, session.user.id)).limit(1);
  if (!u?.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { type, storyId, chapterId } = await req.json();
  if (type === "audio") {
    if (!storyId || !chapterId) return NextResponse.json({ error: "Missing ids" }, { status: 400 });
    const key = audioKey(storyId, chapterId);
    const url = await createUploadUrl(key, "application/x-mpegURL");
    return NextResponse.json({ uploadUrl: url, key });
  }
  if (type === "cover") {
    if (!storyId) return NextResponse.json({ error: "Missing storyId" }, { status: 400 });
    const key = coverKey(storyId);
    const url = await createUploadUrl(key, "image/jpeg");
    return NextResponse.json({ uploadUrl: url, key });
  }
  return NextResponse.json({ error: "Invalid type" }, { status: 400 });
}
