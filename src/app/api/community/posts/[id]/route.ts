import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { communityPosts, users } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [post] = await db.select({ userId: communityPosts.userId })
    .from(communityPosts).where(eq(communityPosts.id, params.id)).limit(1);

  const [u] = await db.select({ isAdmin: users.isAdmin }).from(users)
    .where(eq(users.id, session.user.id)).limit(1);

  if (!post || (post.userId !== session.user.id && !u?.isAdmin))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await db.delete(communityPosts).where(eq(communityPosts.id, params.id));
  return NextResponse.json({ ok: true });
}

// Admin: hide/pin post
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [u] = await db.select({ isAdmin: users.isAdmin }).from(users)
    .where(eq(users.id, session.user.id)).limit(1);
  if (!u?.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const [updated] = await db.update(communityPosts)
    .set({ isHidden: body.isHidden, isPinned: body.isPinned })
    .where(eq(communityPosts.id, params.id))
    .returning();

  return NextResponse.json(updated);
}
