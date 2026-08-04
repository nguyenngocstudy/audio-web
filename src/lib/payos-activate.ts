import { db } from "@/lib/db";
import { transactions, users } from "@/lib/schema";
import { eq, and } from "drizzle-orm";

type TxnInput = {
  id: string;
  userId: string;
  type: "subscription" | "coin_topup" | "chapter_unlock";
  coinAmount: number | null;
  metadata: string | null;
};

// Kích hoạt quyền lợi của giao dịch, đảm bảo chỉ kích hoạt ĐÚNG MỘT lần
// kể cả khi webhook và route check chạy đồng thời.
// Trả về true nếu request này là người duy nhất thực hiện kích hoạt.
export async function activateTxnIfPending(txn: TxnInput): Promise<boolean> {
  const claimed = await db.update(transactions)
    .set({ status: "paid", paidAt: new Date() })
    .where(and(
      eq(transactions.id, txn.id),
      eq(transactions.status, "pending"),
    ))
    .returning({ id: transactions.id });

  if (claimed.length === 0) return false;

  const meta = txn.metadata ? JSON.parse(txn.metadata) : {};
  if (txn.type === "subscription") {
    const days = meta.days ?? 30;
    const [u] = await db.select({ vipUntil: users.vipUntil })
      .from(users).where(eq(users.id, txn.userId)).limit(1);
    // Nối thêm vào VIP hiện tại thay vì ghi đè từ thời điểm mua
    const base = new Date(Math.max(u?.vipUntil?.getTime() ?? 0, Date.now()));
    const vipUntil = new Date(base.getTime() + days * 86400000);
    await db.update(users).set({ vipUntil }).where(eq(users.id, txn.userId));
    console.log("[PayOS Activate] VIP extended until:", vipUntil, "user:", txn.userId);
  } else if (txn.type === "coin_topup" && txn.coinAmount) {
    const [u] = await db.select({ coinBalance: users.coinBalance })
      .from(users).where(eq(users.id, txn.userId)).limit(1);
    await db.update(users)
      .set({ coinBalance: (u?.coinBalance ?? 0) + txn.coinAmount })
      .where(eq(users.id, txn.userId));
    console.log("[PayOS Activate] Coins added:", txn.coinAmount, "user:", txn.userId);
  }
  return true;
}
