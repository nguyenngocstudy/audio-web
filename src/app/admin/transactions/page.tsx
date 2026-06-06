import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import Badge from "@/components/ui/Badge";
import { fmtVnd, fmtDateTime, TX_TYPE_LABEL } from "@/lib/utils";

const STATUS: Record<string, "success" | "warning" | "danger" | "neutral"> = {
  paid: "success", pending: "warning", failed: "danger", cancelled: "neutral",
};

export default async function AdminTransactionsPage() {
  const rows = (await db.execute(sql`
    SELECT t.id, t.payos_order_code, t.type, t.status,
           t.amount_vnd, t.coin_amount, t.created_at, t.paid_at,
           u.email, u.name
    FROM transactions t
    JOIN users u ON u.id = t.user_id
    ORDER BY t.created_at DESC LIMIT 200
  `)).rows as any[];

  const totalPaid   = rows.filter(r => r.status === "paid").reduce((s, r) => s + r.amount_vnd, 0);
  const totalPending = rows.filter(r => r.status === "pending").length;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Giao dịch</h1>
        <p className="text-sm text-gray-400 mt-0.5">200 giao dịch gần nhất</p>
      </div>

      {/* Summary bar */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-400 mb-1">Tổng đã thu</p>
          <p className="text-xl font-bold text-gray-900">{fmtVnd(totalPaid)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-400 mb-1">Tổng giao dịch</p>
          <p className="text-xl font-bold text-gray-900">{rows.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-400 mb-1">Chờ thanh toán</p>
          <p className="text-xl font-bold text-amber-600">{totalPending}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-50 border-b border-gray-100">
              {["Mã đơn", "Người dùng", "Loại", "Số tiền", "Trạng thái", "Ngày tạo", "Thanh toán lúc"].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 whitespace-nowrap">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {rows.map(t => (
                <tr key={t.id} className="border-b border-gray-50 hover:bg-gray-50 last:border-0">
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{t.payos_order_code ?? t.id.slice(0, 8)}</td>
                  <td className="px-4 py-3">
                    <p className="text-gray-800 truncate max-w-[140px]">{t.name ?? t.email}</p>
                    <p className="text-xs text-gray-400 truncate max-w-[140px]">{t.email}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{TX_TYPE_LABEL[t.type] ?? t.type}</td>
                  <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">{fmtVnd(t.amount_vnd)}</td>
                  <td className="px-4 py-3">
                    <Badge variant={STATUS[t.status] ?? "neutral"}>
                      {t.status === "paid" ? "Đã TT" : t.status === "pending" ? "Chờ TT" : t.status === "failed" ? "Thất bại" : "Đã huỷ"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">{fmtDateTime(t.created_at)}</td>
                  <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">{t.paid_at ? fmtDateTime(t.paid_at) : "—"}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={7} className="py-12 text-center text-gray-400">Chưa có giao dịch</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
