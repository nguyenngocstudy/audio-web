import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const { email, password, name } = await req.json();
    if (!email || !password) return NextResponse.json({ error: "Thiếu email hoặc mật khẩu" }, { status: 400 });
    if (password.length < 6) return NextResponse.json({ error: "Mật khẩu tối thiểu 6 ký tự" }, { status: 400 });
    const existing = await db.select({ id: users.id }).from(users)
      .where(eq(users.email, email.toLowerCase())).limit(1);
    if (existing.length) return NextResponse.json({ error: "Email đã được đăng ký" }, { status: 409 });
    const hash = await bcrypt.hash(password, 12);
    const [u] = await db.insert(users).values({ email: email.toLowerCase(), name: name ?? null, passwordHash: hash }).returning({ id: users.id });
    return NextResponse.json({ success: true, userId: u.id }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}
