import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { stories, users } from "@/lib/schema";
import { eq } from "drizzle-orm";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const [u] = await db.select({ isAdmin: users.isAdmin }).from(users)
    .where(eq(users.id, session.user.id)).limit(1);
  return u?.isAdmin ? session : null;
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  
  console.log("PATCH called");
  if (!await requireAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json();

  // Log để debug
  console.log("PATCH story body:", JSON.stringify(body));

  const [updated] = await db.update(stories).set({
    title:       body.title,
    author:      body.author      ?? null,
    narrator:    body.narrator    ?? null,
    description: body.description ?? null,
    genre:       body.genre,
    coverUrl:    body.coverUrl    ?? null,   // ← FIX: thêm field này
    isPublished: body.isPublished,
    updatedAt:   new Date(),
  }).where(eq(stories.id, params.id)).returning();

  console.log("PATCH story result coverUrl:", updated?.coverUrl);
  return NextResponse.json(updated);
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await db.delete(stories).where(eq(stories.id, params.id));
  return NextResponse.json({ ok: true });
}
