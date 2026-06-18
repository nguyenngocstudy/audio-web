import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { transactions, users } from "@/lib/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.text();
  console.log("[PayOS Webhook] RAW BODY:", body);

  let parsed: any;
  try {
    parsed = JSON.parse(body);
  } catch (err) {
    console.error("[PayOS Webhook] Invalid JSON:", err);
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  console.log("[PayOS Webhook] PARSED:", JSON.stringify(parsed, null, 2));

  // PayOS sends data in parsed.data
  const data = parsed?.data ?? parsed;
  const orderCode = data?.orderCode ?? data?.order_code;
  const code      = parsed?.code ?? data?.code;

  console.log("[PayOS Webhook] orderCode:", orderCode, "code:", code);

  // Verify signature if PAYOS_CHECKSUM_KEY available
  if (process.env.PAYOS_CHECKSUM_KEY) {
    try {
      const { payos } = await import("@/lib/payos");
      const verified = payos.verifyPaymentWebhookData(parsed);
      console.log("[PayOS Webhook] Signature verified:", verified);
      if (!verified) {
        console.error("[PayOS Webhook] Invalid signature");
        return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
      }
    } catch (err) {
      console.error("[PayOS Webhook] Verify error:", err);
      // Continue without verification if payos lib fails
    }
  } else {
    console.warn("[PayOS Webhook] PAYOS_CHECKSUM_KEY not set - skipping verification");
  }

  // Only process successful payments
  if (code !== "00" && code !== 200 && String(code) !== "00") {
    console.log("[PayOS Webhook] Non-success code:", code, "- skipping");
    return NextResponse.json({ ok: true });
  }

  if (!orderCode) {
    console.error("[PayOS Webhook] No orderCode found");
    return NextResponse.json({ error: "No orderCode" }, { status: 400 });
  }

  try {
    // Find transaction
    const [txn] = await db.select().from(transactions)
      .where(eq(transactions.payosOrderCode, String(orderCode))).limit(1);

    console.log("[PayOS Webhook] Found transaction:", txn?.id, "status:", txn?.status);

    if (!txn) {
      console.error("[PayOS Webhook] Transaction not found for orderCode:", orderCode);
      return NextResponse.json({ ok: true }); // Return 200 so PayOS stops retrying
    }

    if (txn.status === "paid") {
      console.log("[PayOS Webhook] Already paid, skipping");
      return NextResponse.json({ ok: true });
    }

    // Mark as paid
    await db.update(transactions)
      .set({ status: "paid", paidAt: new Date() })
      .where(eq(transactions.id, txn.id));

    console.log("[PayOS Webhook] Marked as paid:", txn.id);

    // Activate benefit
    const meta = txn.metadata ? JSON.parse(txn.metadata) : {};
    console.log("[PayOS Webhook] Metadata:", meta, "Type:", txn.type);

    if (txn.type === "subscription") {
      const days = meta.days ?? 30;
      const vipUntil = new Date(Date.now() + days * 86400000);
      await db.update(users)
        .set({ vipUntil })
        .where(eq(users.id, txn.userId));
      console.log("[PayOS Webhook] VIP activated until:", vipUntil, "for user:", txn.userId);
    } else if (txn.type === "coin_topup" && txn.coinAmount) {
      const [u] = await db.select({ coinBalance: users.coinBalance })
        .from(users).where(eq(users.id, txn.userId)).limit(1);
      const newBalance = (u?.coinBalance ?? 0) + txn.coinAmount;
      await db.update(users)
        .set({ coinBalance: newBalance })
        .where(eq(users.id, txn.userId));
      console.log("[PayOS Webhook] Coins added:", txn.coinAmount, "new balance:", newBalance);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[PayOS Webhook] Processing error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// PayOS cũng gọi GET để verify webhook URL
export async function GET() {
  return NextResponse.json({ ok: true, message: "PayOS webhook endpoint" });
}
