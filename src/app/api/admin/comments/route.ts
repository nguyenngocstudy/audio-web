import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { communityComments, communityPosts, users } from "@/lib/schema";
import { eq, sql, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const [u] = await db.select({ isAdmin: users.isAdmin }).from(users)
    .where(eq(users.id, session.user.id)).limit(1);
  return u?.isAdmin ? session : null;
}

// GET - list all comments (for admin moderation)
export async function GET(req: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const page = Number(req.nextUrl.searchParams.get("page") ?? 1);
  const limit = 30;
  const offset = (page - 1) * limit;
  const storyId = req.nextUrl.searchParams.get("storyId");

  const rows = await db.execute(sql`
    SELECT
      c.id, c.content, c.created_at, c.is_hidden, c.parent_id,
      u.id AS user_id, u.name AS user_name, u.email AS user_email,
      p.metadata AS story_id,
      s.title AS story_title
    FROM community_comments c
    JOIN users u ON u.id = c.user_id
    JOIN community_posts p ON p.id = c.post_id
    LEFT JOIN stories s ON s.id::text = p.metadata
    WHERE ${storyId ? sql`p.metadata = ${storyId}` : sql`TRUE`}
    ORDER BY c.created_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `);

  return NextResponse.json(rows.rows);
}

// DELETE - hard delete a comment
export async function DELETE(req: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { commentId } = await req.json();
  if (!commentId) return NextResponse.json({ error: "commentId required" }, { status: 400 });

  await db.delete(communityComments).where(eq(communityComments.id, commentId));
  return NextResponse.json({ ok: true });
}

// PATCH - hide/unhide comment
export async function PATCH(req: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { commentId, isHidden } = await req.json();
  await db.update(communityComments)
    .set({ isHidden })
    .where(eq(communityComments.id, commentId));
  return NextResponse.json({ ok: true });
}
