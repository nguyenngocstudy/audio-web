import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, notifications } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { PLANS, type PlanKey } from "@/lib/payos";

export const dynamic = "force-dynamic";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const [u] = await db.select({ isAdmin: users.isAdmin }).from(users)
    .where(eq(users.id, session.user.id)).limit(1);
  return u?.isAdmin ? session : null;
}

export async function POST(req: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { userId, planKey } = await req.json() as { userId?: string; planKey?: PlanKey };
  const plan = planKey ? PLANS[planKey] : undefined;

  if (!userId || !plan)
    return NextResponse.json({ error: "Thiếu userId hoặc gói không hợp lệ" }, { status: 400 });

  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user)
    return NextResponse.json({ error: "Không tìm thấy người dùng" }, { status: 404 });

  const now = new Date();
  const base = user.vipUntil && new Date(user.vipUntil) > now
    ? new Date(user.vipUntil)
    : now;
  const vipUntil = new Date(base.getTime() + plan.days * 86400000);

  await db.update(users)
    .set({ vipUntil, updatedAt: new Date() })
    .where(eq(users.id, userId));

  await db.insert(notifications).values({
    userId,
    type: "system",
    title: "VIP được nâng cấp bởi Admin",
    body: `Tài khoản của bạn đã được nâng cấp gói ${plan.label} (${plan.days} ngày). VIP có hiệu lực đến ${vipUntil.toLocaleDateString("vi-VN")}.`,
    link: "/vip",
  });

  return NextResponse.json({ ok: true, vipUntil: vipUntil.toISOString() });
}
