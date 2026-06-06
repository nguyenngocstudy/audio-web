import { NextRequest, NextResponse } from "next/server";
import { payos, PLANS, type PlanKey } from "@/lib/payos";
import { db } from "@/lib/db";
import { transactions, users } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const verified = payos.verifyPaymentWebhookData(body);
    if (!verified) return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    const { orderCode, code } = body.data ?? {};
    if (code !== "00") return NextResponse.json({ ok: true });
    const [txn] = await db.select().from(transactions)
      .where(eq(transactions.payosOrderCode, String(orderCode))).limit(1);
    if (!txn || txn.status === "paid") return NextResponse.json({ ok: true });
    await db.update(transactions).set({ status: "paid", paidAt: new Date() })
      .where(eq(transactions.id, txn.id));
    const meta = txn.metadata ? JSON.parse(txn.metadata) : {};
    if (txn.type === "subscription") {
      const plan = PLANS[meta.planKey as PlanKey];
      const vipUntil = new Date(Date.now() + plan.days * 86400000);
      await db.update(users).set({ vipUntil }).where(eq(users.id, txn.userId));
    } else if (txn.type === "coin_topup" && txn.coinAmount) {
      const [u] = await db.select({ coinBalance: users.coinBalance }).from(users)
        .where(eq(users.id, txn.userId)).limit(1);
      await db.update(users).set({ coinBalance: (u?.coinBalance ?? 0) + txn.coinAmount })
        .where(eq(users.id, txn.userId));
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Webhook error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
