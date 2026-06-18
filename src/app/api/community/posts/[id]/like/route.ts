import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { communityLikes, communityPosts } from "@/lib/schema";
import { and, eq, sql } from "drizzle-orm";

export async function POST(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await db.select({ id: communityLikes.id }).from(communityLikes)
    .where(and(eq(communityLikes.userId, session.user.id), eq(communityLikes.postId, params.id))).limit(1);

  if (existing.length) {
    await db.delete(communityLikes).where(and(eq(communityLikes.userId, session.user.id), eq(communityLikes.postId, params.id)));
    await db.execute(sql`UPDATE community_posts SET like_count = GREATEST(0, like_count - 1) WHERE id = ${params.id}`);
    return NextResponse.json({ liked: false });
  } else {
    await db.insert(communityLikes).values({ userId: session.user.id, postId: params.id });
    await db.execute(sql`UPDATE community_posts SET like_count = like_count + 1 WHERE id = ${params.id}`);
    return NextResponse.json({ liked: true });
  }
}
