import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { transactions, users } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";
import { payos, PLANS, type PlanKey } from "@/lib/payos";

export const dynamic = "force-dynamic";

// User calls this to manually check & sync payment status
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    // Get latest pending transaction for this user
    const [txn] = await db.select().from(transactions)
      .where(eq(transactions.userId, session.user.id))
      .orderBy(desc(transactions.createdAt))
      .limit(1);

    if (!txn || txn.status === "paid") {
      return NextResponse.json({ status: txn?.status ?? "none", alreadyPaid: txn?.status === "paid" });
    }

    if (!txn.payosOrderCode) {
      return NextResponse.json({ status: "pending", error: "No order code" });
    }

    // Check with PayOS API
    console.log("[PayOS Check] Checking orderCode:", txn.payosOrderCode);
    const paymentInfo = await payos.getPaymentLinkInformation(Number(txn.payosOrderCode));
    console.log("[PayOS Check] PayOS status:", paymentInfo?.status);

    if (paymentInfo?.status === "PAID") {
      // Update DB
      await db.update(transactions)
        .set({ status: "paid", paidAt: new Date() })
        .where(eq(transactions.id, txn.id));

      // Activate benefit
      const meta = txn.metadata ? JSON.parse(txn.metadata) : {};
      if (txn.type === "subscription") {
        const days = meta.days ?? 30;
        const vipUntil = new Date(Date.now() + days * 86400000);
        await db.update(users).set({ vipUntil }).where(eq(users.id, txn.userId));
        console.log("[PayOS Check] VIP activated:", vipUntil);
      } else if (txn.type === "coin_topup" && txn.coinAmount) {
        const [u] = await db.select({ coinBalance: users.coinBalance })
          .from(users).where(eq(users.id, txn.userId)).limit(1);
        await db.update(users)
          .set({ coinBalance: (u?.coinBalance ?? 0) + txn.coinAmount })
          .where(eq(users.id, txn.userId));
      }

      return NextResponse.json({ status: "paid", activated: true });
    }

    return NextResponse.json({ status: paymentInfo?.status ?? "pending" });
  } catch (err: any) {
    console.error("[PayOS Check] Error:", err);
    return NextResponse.json({ error: err?.message ?? "Error checking payment" }, { status: 500 });
  }
}
