import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { users, transactions } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";
import Badge from "@/components/ui/Badge";
import Link from "next/link";
import { fmtVnd, fmtDate, fmtDateTime, TX_TYPE_LABEL } from "@/lib/utils";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [user] = await db.select().from(users).where(eq(users.id, session.user.id)).limit(1);
  if (!user) redirect("/login");

  const txHistory = await db.select().from(transactions)
    .where(eq(transactions.userId, user.id))
    .orderBy(desc(transactions.createdAt)).limit(20);

  const isVip = user.vipUntil && new Date(user.vipUntil) > new Date();
  const STATUS: Record<string, "success" | "warning" | "danger" | "neutral"> = {
    paid: "success", pending: "warning", failed: "danger", cancelled: "neutral",
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex items-center gap-4 mb-5">
          <div className="w-14 h-14 rounded-full bg-brand-100 flex items-center justify-center text-xl font-bold text-brand-700 flex-shrink-0">
            {user.name?.[0]?.toUpperCase() ?? "?"}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-semibold text-gray-900 text-lg">{user.name ?? "Người dùng"}</p>
              {isVip && <Badge variant="vip">✦ VIP</Badge>}
            </div>
            <p className="text-sm text-gray-400">{user.email}</p>
            <p className="text-xs text-gray-400 mt-0.5">Tham gia {fmtDate(user.createdAt)}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 bg-gray-50 rounded-xl">
            <p className="text-xl font-bold text-gray-900">{user.coinBalance.toLocaleString()}</p>
            <p className="text-xs text-gray-400 mt-0.5">Coin</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-xl">
            <p className="text-sm font-bold text-gray-900">{isVip ? "VIP" : "Free"}</p>
            <p className="text-xs text-gray-400 mt-0.5">Gói hiện tại</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-xl">
            <p className="text-sm font-bold text-gray-900">{isVip ? fmtDate(user.vipUntil) : "—"}</p>
            <p className="text-xs text-gray-400 mt-0.5">VIP đến</p>
          </div>
        </div>

        {!isVip && (
          <Link href="/vip"
            className="mt-4 w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500 text-white font-medium py-2.5 rounded-xl text-sm transition-all">
            <i className="ti ti-crown" style={{ fontSize: 16 }} />Nâng cấp VIP ngay
          </Link>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {[
          { href: "/history", icon: "ti-history", label: "Lịch sử nghe", sub: "Tiếp tục các truyện đang nghe" },
          { href: "/vip",     icon: "ti-crown",   label: "Gói VIP & Coin", sub: "Mua gói hoặc nạp coin" },
        ].map((item, i, arr) => (
          <Link key={item.href} href={item.href}
            className={`flex items-center gap-3 px-5 py-4 hover:bg-gray-50 transition-colors ${i < arr.length - 1 ? "border-b border-gray-50" : ""}`}>
            <div className="w-9 h-9 bg-brand-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <i className={`ti ${item.icon} text-brand-600`} style={{ fontSize: 18 }} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-800">{item.label}</p>
              <p className="text-xs text-gray-400">{item.sub}</p>
            </div>
            <i className="ti ti-chevron-right text-gray-300" style={{ fontSize: 16 }} />
          </Link>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <p className="font-semibold text-gray-800 mb-4">Lịch sử giao dịch</p>
        {txHistory.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">Chưa có giao dịch nào</p>
        ) : (
          <div className="space-y-2">
            {txHistory.map(tx => (
              <div key={tx.id} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-800">{TX_TYPE_LABEL[tx.type] ?? tx.type}</p>
                  <p className="text-xs text-gray-400">{fmtDateTime(tx.createdAt)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">{fmtVnd(tx.amountVnd)}</p>
                  <Badge variant={STATUS[tx.status] ?? "neutral"} className="mt-0.5">
                    {tx.status === "paid" ? "Đã TT" : tx.status === "pending" ? "Chờ TT" : tx.status === "failed" ? "Thất bại" : "Đã huỷ"}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
