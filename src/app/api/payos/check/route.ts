import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { transactions, users } from "@/lib/schema";
import { eq, and, desc } from "drizzle-orm";
import { payos } from "@/lib/payos";

export const dynamic = "force-dynamic";

async function activateTxn(txn: typeof transactions.$inferSelect) {
  const meta = txn.metadata ? JSON.parse(txn.metadata) : {};
  if (txn.type === "subscription") {
    const days = meta.days ?? 30;
    const [u] = await db.select({ vipUntil: users.vipUntil })
      .from(users).where(eq(users.id, txn.userId)).limit(1);
    // Nối thêm vào VIP hiện tại thay vì ghi đè từ thời điểm mua
    const base = new Date(Math.max(u?.vipUntil?.getTime() ?? 0, Date.now()));
    const vipUntil = new Date(base.getTime() + days * 86400000);
    await db.update(users).set({ vipUntil }).where(eq(users.id, txn.userId));
    console.log("[PayOS Check] VIP extended until:", vipUntil, "user:", txn.userId);
  } else if (txn.type === "coin_topup" && txn.coinAmount) {
    const [u] = await db.select({ coinBalance: users.coinBalance })
      .from(users).where(eq(users.id, txn.userId)).limit(1);
    await db.update(users)
      .set({ coinBalance: (u?.coinBalance ?? 0) + txn.coinAmount })
      .where(eq(users.id, txn.userId));
    console.log("[PayOS Check] Coins added:", txn.coinAmount, "user:", txn.userId);
  }
}

// User calls this to check & sync payment status
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const orderCode = (body as { orderCode?: string }).orderCode;

  try {
    // Chính xác: popup / success page biết đang chờ link nào
    if (orderCode) {
      const [txn] = await db.select().from(transactions)
        .where(and(
          eq(transactions.userId, session.user.id),
          eq(transactions.payosOrderCode, String(orderCode)),
        ))
        .limit(1);

      if (!txn) return NextResponse.json({ status: "none" });
      if (txn.status === "paid")
        return NextResponse.json({ status: "paid", alreadyPaid: true });

      console.log("[PayOS Check] Checking orderCode:", orderCode);
      const paymentInfo = await payos.getPaymentLinkInformation(Number(orderCode));
      console.log("[PayOS Check] PayOS status:", paymentInfo?.status);

      if (paymentInfo?.status === "PAID") {
        await db.update(transactions)
          .set({ status: "paid", paidAt: new Date() })
          .where(eq(transactions.id, txn.id));
        await activateTxn(txn);
        return NextResponse.json({ status: "paid", activated: true });
      }
      return NextResponse.json({ status: paymentInfo?.status ?? "pending" });
    }

    // Fallback (không có orderCode): xem giao dịch mới nhất trước, rồi quét các pending
    const all = await db.select().from(transactions)
      .where(eq(transactions.userId, session.user.id))
      .orderBy(desc(transactions.createdAt));

    if (all.length === 0) return NextResponse.json({ status: "none" });

    const newest = all[0];
    if (newest.status === "paid")
      return NextResponse.json({ status: "paid", alreadyPaid: true });

    let activated = false;
    let lastStatus = "pending";

    for (const txn of all) {
      if (txn.status !== "pending" || !txn.payosOrderCode) continue;
      try {
        console.log("[PayOS Check] Checking orderCode:", txn.payosOrderCode);
        const paymentInfo = await payos.getPaymentLinkInformation(Number(txn.payosOrderCode));
        console.log("[PayOS Check] PayOS status:", paymentInfo?.status);

        if (paymentInfo?.status === "PAID") {
          await db.update(transactions)
            .set({ status: "paid", paidAt: new Date() })
            .where(eq(transactions.id, txn.id));
          await activateTxn(txn);
          activated = true;
          break;
        }
        if (paymentInfo?.status === "CANCELLED") {
          await db.update(transactions)
            .set({ status: "cancelled" })
            .where(eq(transactions.id, txn.id));
          continue;
        }
        lastStatus = paymentInfo?.status ?? "pending";
      } catch (err: any) {
        console.error("[PayOS Check] Error checking order:", txn.payosOrderCode, err?.message ?? err);
      }
    }

    if (activated) return NextResponse.json({ status: "paid", activated: true });
    return NextResponse.json({ status: lastStatus });
  } catch (err: any) {
    console.error("[PayOS Check] Error:", err);
    return NextResponse.json({ error: err?.message ?? "Error checking payment" }, { status: 500 });
  }
}
