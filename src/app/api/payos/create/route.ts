import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { transactions } from "@/lib/schema";
import { payos, PLANS, type PlanKey } from "@/lib/payos";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { planKey } = await req.json() as { planKey: PlanKey };
  const plan = PLANS[planKey];
  if (!plan)
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });

  // Tạo orderCode dạng số nguyên dương (PayOS yêu cầu)
  const orderCode = Number(`${Date.now()}`.slice(-9));
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  console.log("[PayOS Create] planKey:", planKey, "orderCode:", orderCode, "appUrl:", appUrl);

  // Lưu transaction vào DB
  await db.insert(transactions).values({
    userId: session.user.id,
    payosOrderCode: String(orderCode),
    type: plan.days > 0 ? "subscription" : "coin_topup",
    status: "pending",
    amountVnd: plan.price,
    coinAmount: plan.coins > 0 ? plan.coins : null,
    metadata: JSON.stringify({ planKey, days: plan.days, coins: plan.coins }),
  });

  try {
    const paymentLink = await payos.createPaymentLink({
      orderCode,
      amount: plan.price,
      description: plan.label.slice(0, 25), // PayOS giới hạn 25 ký tự
      returnUrl: `${appUrl}/vip/success`,
      cancelUrl: `${appUrl}/vip?cancelled=1`,
    });

    console.log("[PayOS Create] Payment link created:", paymentLink.checkoutUrl);
    return NextResponse.json({ checkoutUrl: paymentLink.checkoutUrl });
  } catch (err: any) {
    console.error("[PayOS Create] Error:", err?.response?.data ?? err);
    return NextResponse.json(
      { error: "Lỗi tạo thanh toán: " + (err?.message ?? "unknown") },
      { status: 500 }
    );
  }
}
