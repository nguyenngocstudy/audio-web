import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { stories, users } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const [u] = await db.select({ isAdmin: users.isAdmin }).from(users)
    .where(eq(users.id, session.user.id)).limit(1);
  return u?.isAdmin ? session : null;
}

export async function GET() {
  const data = await db.select().from(stories).orderBy(desc(stories.createdAt));
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json();
  const [story] = await db.insert(stories).values({
    title: body.title, author: body.author ?? null, narrator: body.narrator ?? null,
    description: body.description ?? null, coverUrl: body.coverUrl ?? null,
    genre: body.genre, isPublished: body.isPublished ?? false,
  }).returning();
  return NextResponse.json(story, { status: 201 });
}
