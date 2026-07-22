export const dynamic = "force-dynamic";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import Link from "next/link";
import Badge from "@/components/ui/Badge";
import { fmtVnd, fmtDateTime, TX_TYPE_LABEL } from "@/lib/utils";

const PAGE_SIZE = 20;

const STATUS: Record<string, "success" | "warning" | "danger" | "neutral"> = {
  paid: "success", pending: "warning", failed: "danger", cancelled: "neutral",
};

export default async function AdminTransactionsPage({
  searchParams,
}: {
  searchParams: { q?: string; page?: string };
}) {
  const q = searchParams.q?.trim() ?? "";
  const page = Math.max(1, Number(searchParams.page) || 1);
  const offset = (page - 1) * PAGE_SIZE;

  const whereClause = q
    ? sql`WHERE (u.name ILIKE ${`%${q}%`} OR u.email ILIKE ${`%${q}%`} OR t.payos_order_code ILIKE ${`%${q}%`})`
    : sql``;

  const [countResult, rows] = await Promise.all([
    db.execute(sql`
      SELECT COUNT(*)::int AS cnt
      FROM transactions t
      JOIN users u ON u.id = t.user_id
      ${whereClause}
    `),
    db.execute(sql`
      SELECT t.id, t.payos_order_code, t.type, t.status,
             t.amount_vnd, t.coin_amount, t.created_at, t.paid_at,
             u.email, u.name
      FROM transactions t
      JOIN users u ON u.id = t.user_id
      ${whereClause}
      ORDER BY t.created_at DESC
      LIMIT ${PAGE_SIZE} OFFSET ${offset}
    `),
  ]);

  const total = (countResult.rows[0] as any)?.cnt ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const data = rows.rows as any[];

  const totalPaid   = data.filter(r => r.status === "paid").reduce((s, r) => s + r.amount_vnd, 0);
  const totalPending = data.filter(r => r.status === "pending").length;

  function pageUrl(p: number) {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    params.set("page", String(p));
    return `/admin/transactions?${params.toString()}`;
  }

  return (
    <div>
      <div className="mb-4 sm:mb-6">
        <h1 className="text-lg sm:text-xl font-semibold text-gray-900">Giao dịch</h1>
        <p className="text-xs sm:text-sm text-gray-400 mt-0.5">{total.toLocaleString()} giao dịch{q ? ` tìm thấy cho "${q}"` : ""}</p>
      </div>

      <form className="mb-3 sm:mb-4">
        <div className="relative">
          <i className="ti ti-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" style={{ fontSize: 16 }} />
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Tìm theo tên, email hoặc mã đơn..."
            className="w-full pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          />
        </div>
      </form>

      {/* Summary bar */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-3 sm:p-4">
          <p className="text-[10px] sm:text-xs text-gray-400 mb-0.5 sm:mb-1">Tổng đã thu</p>
          <p className="text-sm sm:text-xl font-bold text-gray-900 truncate">{fmtVnd(totalPaid)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-3 sm:p-4">
          <p className="text-[10px] sm:text-xs text-gray-400 mb-0.5 sm:mb-1">Tổng giao dịch</p>
          <p className="text-sm sm:text-xl font-bold text-gray-900">{total}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-3 sm:p-4">
          <p className="text-[10px] sm:text-xs text-gray-400 mb-0.5 sm:mb-1">Chờ thanh toán</p>
          <p className="text-sm sm:text-xl font-bold text-amber-600">{totalPending}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs sm:text-sm">
            <thead><tr className="bg-gray-50 border-b border-gray-100">
              {["Mã đơn", "Người dùng", "Loại", "Số tiền", "Trạng thái", "Ngày tạo", "Thanh toán lúc"].map(h => (
                <th key={h} className="px-3 sm:px-4 py-2.5 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 whitespace-nowrap">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {data.map(t => (
                <tr key={t.id} className="border-b border-gray-50 hover:bg-gray-50 last:border-0">
                  <td className="px-3 sm:px-4 py-2.5 sm:py-3 font-mono text-[10px] sm:text-xs text-gray-500">{t.payos_order_code ?? t.id.slice(0, 8)}</td>
                  <td className="px-3 sm:px-4 py-2.5 sm:py-3">
                    <p className="text-gray-800 truncate max-w-[100px] sm:max-w-[140px]">{t.name ?? t.email}</p>
                    <p className="text-[10px] sm:text-xs text-gray-400 truncate max-w-[100px] sm:max-w-[140px]">{t.email}</p>
                  </td>
                  <td className="px-3 sm:px-4 py-2.5 sm:py-3 text-gray-600 whitespace-nowrap">{TX_TYPE_LABEL[t.type] ?? t.type}</td>
                  <td className="px-3 sm:px-4 py-2.5 sm:py-3 font-medium text-gray-800 whitespace-nowrap">{fmtVnd(t.amount_vnd)}</td>
                  <td className="px-3 sm:px-4 py-2.5 sm:py-3">
                    <Badge variant={STATUS[t.status] ?? "neutral"}>
                      {t.status === "paid" ? "Đã TT" : t.status === "pending" ? "Chờ TT" : t.status === "failed" ? "Thất bại" : "Đã huỷ"}
                    </Badge>
                  </td>
                  <td className="px-3 sm:px-4 py-2.5 sm:py-3 text-[10px] sm:text-xs text-gray-400 whitespace-nowrap">{fmtDateTime(t.created_at)}</td>
                  <td className="px-3 sm:px-4 py-2.5 sm:py-3 text-[10px] sm:text-xs text-gray-400 whitespace-nowrap">{t.paid_at ? fmtDateTime(t.paid_at) : "—"}</td>
                </tr>
              ))}
              {data.length === 0 && (
                <tr><td colSpan={7} className="py-8 sm:py-12 text-center text-gray-400 text-sm">Chưa có giao dịch</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 border-t border-gray-100">
            <p className="text-xs sm:text-sm text-gray-400">Trang {page}/{totalPages}</p>
            <div className="flex gap-1.5 sm:gap-2">
              {page > 1 && (
                <Link href={pageUrl(page - 1)}
                  className="px-2.5 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm text-gray-600 hover:text-gray-900 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  Trước
                </Link>
              )}
              {page < totalPages && (
                <Link href={pageUrl(page + 1)}
                  className="px-2.5 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm text-gray-600 hover:text-gray-900 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  Sau
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
