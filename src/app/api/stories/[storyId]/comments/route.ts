import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { communityPosts, communityComments, users } from "@/lib/schema";
import { eq, sql } from "drizzle-orm";

async function getOrCreateStoryPost(storyId: string): Promise<string> {
  const existing = await db.execute(
    sql`SELECT id FROM community_posts WHERE metadata = ${storyId} LIMIT 1`
  );
  if ((existing.rows as any[]).length > 0)
    return (existing.rows[0] as any).id as string;

  const [admin] = await db.select({ id: users.id }).from(users)
    .where(eq(users.isAdmin, true)).limit(1);
  if (!admin) throw new Error("No admin");

  const result = await db.execute(sql`
    INSERT INTO community_posts (id, user_id, type, content, metadata, created_at, updated_at)
    VALUES (gen_random_uuid(), ${admin.id}, 'discussion', 'Binh luan cho truyen', ${storyId}, NOW(), NOW())
    RETURNING id`);
  return (result.rows[0] as any).id as string;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { storyId: string } }
) {
  try {
    const rows = await db.execute(sql`
      SELECT
        c.id, c.content, c.created_at, c.parent_id,
        u.id        AS user_id,
        u.name      AS user_name,
        u.is_admin  AS user_is_admin,
        u.vip_until AS user_vip_until
      FROM community_comments c
      JOIN users u ON u.id = c.user_id
      JOIN community_posts p ON p.id = c.post_id
      WHERE p.metadata = ${params.storyId}
        AND c.is_hidden = FALSE
      ORDER BY c.created_at ASC
    `).catch(() => ({ rows: [] }));

    const all = rows.rows as any[];

    const nested = all
      .filter(c => !c.parent_id)
      .map(c => ({
        ...c,
        replies: all
          .filter(r => r.parent_id === c.id)
          .sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),
      }))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return NextResponse.json(nested);
  } catch (err) {
    console.error("GET story comments:", err);
    return NextResponse.json([]);
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { storyId: string } }
) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { content, parentId } = await req.json();
  if (!content?.trim())
    return NextResponse.json({ error: "Noi dung trong" }, { status: 400 });
  if (content.length > 1000)
    return NextResponse.json({ error: "Toi da 1000 ky tu" }, { status: 400 });

  try {
    const postId = await getOrCreateStoryPost(params.storyId);

    const result = await db.execute(sql`
      INSERT INTO community_comments (id, post_id, user_id, parent_id, content, created_at)
      VALUES (
        gen_random_uuid(),
        ${postId}::uuid,
        ${session.user.id}::uuid,
        ${parentId ?? null},
        ${content.trim()},
        NOW()
      )
      RETURNING id, content, created_at, parent_id
    `);

    const c = result.rows[0] as any;

    const [u] = await db
      .select({ name: users.name, isAdmin: users.isAdmin, vipUntil: users.vipUntil })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    return NextResponse.json({
      id:             c.id,
      content:        c.content,
      created_at:     c.created_at,
      parent_id:      c.parent_id ?? null,
      user_id:        session.user.id,
      user_name:      u?.name ?? null,
      user_is_admin:  u?.isAdmin ?? false,
      user_vip_until: u?.vipUntil ?? null,
      replies:        [],
    }, { status: 201 });
  } catch (err) {
    console.error("POST story comment:", err);
    return NextResponse.json({ error: "Loi server" }, { status: 500 });
  }
}
