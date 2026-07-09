import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { communityPosts, communityLikes, users, notifications } from "@/lib/schema";
import { desc, eq, and, sql } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const session = await auth();
  const type    = req.nextUrl.searchParams.get("type");
  const page    = Number(req.nextUrl.searchParams.get("page") ?? 1);
  const limit   = 20;
  const offset  = (page - 1) * limit;

  const rows = await db.execute(sql`
    SELECT
      p.id, p.type, p.content, p.like_count, p.reply_count,
      p.is_pinned, p.created_at,
      u.id   AS user_id,
      u.name AS user_name,
      u.is_admin AS user_is_admin,
      ${session?.user?.id
        ? sql`EXISTS(SELECT 1 FROM community_likes l WHERE l.post_id=p.id AND l.user_id=${session.user.id})`
        : sql`FALSE`
      } AS liked_by_me
    FROM community_posts p
    JOIN users u ON u.id = p.user_id
    WHERE p.is_hidden = FALSE
      ${type ? sql`AND p.type = ${type}::post_type` : sql``}
    ORDER BY p.is_pinned DESC, p.created_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `);

  return NextResponse.json(rows.rows);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { type, content } = await req.json();
  if (!content?.trim()) return NextResponse.json({ error: "Nội dung không được trống" }, { status: 400 });
  if (content.length > 2000) return NextResponse.json({ error: "Nội dung quá dài (tối đa 2000 ký tự)" }, { status: 400 });

  const [post] = await db.insert(communityPosts).values({
    userId: session.user.id,
    type: type ?? "discussion",
    content: content.trim(),
  }).returning();

  // Notify all admins about the new post (skip if the poster is an admin)
  const posterIsAdmin = await db.select({ isAdmin: users.isAdmin }).from(users)
    .where(eq(users.id, session.user.id)).limit(1).then(r => r[0]?.isAdmin);
  if (!posterIsAdmin) {
    const admins = await db.select({ id: users.id }).from(users)
      .where(eq(users.isAdmin, true));
    if (admins.length > 0) {
      const posterName = (await db.select({ name: users.name }).from(users)
        .where(eq(users.id, session.user.id)).limit(1))[0]?.name ?? "Ai đó";
      await db.insert(notifications).values(
        admins.map(a => ({
          userId: a.id,
          type: "new_post" as const,
          title: `${posterName} đã đăng bài viết mới`,
          body: content.trim().slice(0, 120),
          link: `/community#${post.id}`,
        }))
      );
    }
  }

  return NextResponse.json(post, { status: 201 });
}
