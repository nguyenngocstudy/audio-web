import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { communityComments, communityPosts, notifications, users } from "@/lib/schema";
import { eq, asc, sql } from "drizzle-orm";

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const rows = await db.execute(sql`
    SELECT c.id, c.content, c.created_at,
           u.id AS user_id, u.name AS user_name, u.is_admin AS user_is_admin
    FROM community_comments c
    JOIN users u ON u.id = c.user_id
    WHERE c.post_id = ${params.id} AND c.is_hidden = FALSE
    ORDER BY c.created_at ASC
  `);
  return NextResponse.json(rows.rows);
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { content } = await req.json();
  if (!content?.trim()) return NextResponse.json({ error: "Nội dung trống" }, { status: 400 });

  const [comment] = await db.insert(communityComments).values({
    postId: params.id, userId: session.user.id, content: content.trim(),
  }).returning();

  // Update reply count
  await db.execute(sql`UPDATE community_posts SET reply_count = reply_count + 1 WHERE id = ${params.id}`);

  // Notify post owner (if not replying to own post)
  const [post] = await db.select({ userId: communityPosts.userId }).from(communityPosts).where(eq(communityPosts.id, params.id)).limit(1);
  const [commenter] = await db.select({ name: users.name }).from(users).where(eq(users.id, session.user.id)).limit(1);

  if (post && post.userId !== session.user.id) {
    await db.insert(notifications).values({
      userId: post.userId,
      type: "reply",
      title: `${commenter?.name ?? "Ai đó"} đã bình luận bài của bạn`,
      body: content.trim().slice(0, 100),
      link: `/community#${params.id}`,
    });
  }

  return NextResponse.json(comment, { status: 201 });
}
