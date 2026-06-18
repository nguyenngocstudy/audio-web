import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ isAdmin: false });

  const [u] = await db
    .select({ isAdmin: users.isAdmin, email: users.email, name: users.name, vipUntil: users.vipUntil, coinBalance: users.coinBalance })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  return NextResponse.json(u ?? { isAdmin: false });
}