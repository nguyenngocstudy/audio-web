import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { transactions } from "@/lib/schema";
import { payos, PLANS, type PlanKey } from "@/lib/payos";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { planKey } = await req.json() as { planKey: PlanKey };
  const plan = PLANS[planKey];
  if (!plan) return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  const orderCode = Number(String(Date.now()).slice(-8) + String(Math.floor(Math.random() * 10)));
  await db.insert(transactions).values({
    userId: session.user.id,
    payosOrderCode: String(orderCode),
    type: plan.days > 0 ? "subscription" : "coin_topup",
    status: "pending",
    amountVnd: plan.price,
    coinAmount: plan.coins > 0 ? plan.coins : null,
    metadata: JSON.stringify({ planKey, days: plan.days }),
  });
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  try {
    const paymentLink = await payos.createPaymentLink({
      orderCode,
      amount: plan.price,
      description: plan.label,
      returnUrl: `${appUrl}/vip/success`,
      cancelUrl: `${appUrl}/vip`,
    });
    return NextResponse.json({ checkoutUrl: paymentLink.checkoutUrl });
  } catch (err) {
    console.error("PayOS error:", err);
    return NextResponse.json({ error: "Lỗi tạo thanh toán" }, { status: 500 });
  }
}
