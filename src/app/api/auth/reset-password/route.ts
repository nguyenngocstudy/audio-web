import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, passwordResetTokens } from "@/lib/schema";
import { eq, and, gt } from "drizzle-orm";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json();
    if (!token || !password) return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    if (password.length < 6) return NextResponse.json({ error: "Mat khau toi thieu 6 ky tu" }, { status: 400 });

    const [resetToken] = await db.select().from(passwordResetTokens)
      .where(and(
        eq(passwordResetTokens.token, token),
        eq(passwordResetTokens.used, false),
        gt(passwordResetTokens.expiresAt, new Date())
      )).limit(1);

    if (!resetToken) return NextResponse.json({ error: "Link dat lai mat khau khong hop le hoac da het han" }, { status: 400 });

    const hash = await bcrypt.hash(password, 12);
    await db.update(users).set({ passwordHash: hash }).where(eq(users.id, resetToken.userId));
    await db.update(passwordResetTokens).set({ used: true }).where(eq(passwordResetTokens.id, resetToken.id));

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
