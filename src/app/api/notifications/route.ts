import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { notifications } from "@/lib/schema";
import { eq, desc, count } from "drizzle-orm";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ items: [], unread: 0 });

  const [items, unreadRow] = await Promise.all([
    db.select().from(notifications)
      .where(eq(notifications.userId, session.user.id))
      .orderBy(desc(notifications.createdAt))
      .limit(30),
    db.select({ c: count() }).from(notifications)
      .where(eq(notifications.userId, session.user.id))
      .where(eq(notifications.isRead, false)),
  ]);

  return NextResponse.json({ items, unread: unreadRow[0].c });
}
