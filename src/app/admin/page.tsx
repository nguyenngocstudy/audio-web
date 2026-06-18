export const dynamic = "force-dynamic";
import { getOverviewStats, getMonthlyRevenue, getDailyNewUsers, getTopStories, getRecentTransactions, getRevenueByType } from "@/lib/admin-stats";
import StatCard from "./_components/StatCard";
import RevenueChart from "./_components/RevenueChart";
import UserChart from "./_components/UserChart";
import Badge from "@/components/ui/Badge";
import { fmtVnd, fmtDateTime, GENRE_LABEL, TX_TYPE_LABEL } from "@/lib/utils";
import Link from "next/link";

const STATUS: Record<string, "success" | "warning" | "danger" | "neutral"> = {
  paid: "success", pending: "warning", failed: "danger", cancelled: "neutral",
};

export default async function AdminPage() {
  const [stats, monthly, daily, top, txns, byType] = await Promise.all([
    getOverviewStats(), getMonthlyRevenue(), getDailyNewUsers(),
    getTopStories(8), getRecentTransactions(10), getRevenueByType(),
  ]);

  return (
    <div>
      <div className="mb-7">
        <h1 className="text-xl font-semibold text-gray-900">Tổng quan</h1>
        <p className="text-sm text-gray-400 mt-0.5">Dữ liệu cập nhật theo thời gian thực</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Tổng người dùng" value={stats.totalUsers.toLocaleString()} sub={`+${stats.newUsersThisMonth} tháng này`} growth={stats.userGrowth} icon="ti-users" color="violet" />
        <StatCard label="Đang VIP" value={stats.vipUsers.toLocaleString()} sub={`${stats.vipRate}% tổng user`} icon="ti-crown" color="amber" />
        <StatCard label="Doanh thu tháng này" value={fmtVnd(stats.revenueThisMonth)} sub={`Tháng trước: ${fmtVnd(stats.revenueLastMonth)}`} growth={stats.revenueGrowth} icon="ti-cash" color="teal" />
        <StatCard label="Tổng truyện" value={String(stats.totalStories)} sub={`${stats.totalChapters.toLocaleString()} chương`} icon="ti-book" color="rose" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <RevenueChart data={monthly} />
        <UserChart data={daily} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm font-medium text-gray-900 mb-4">Phân bổ doanh thu</p>
          <div className="space-y-4">
            {byType.map(item => {
              const pct = stats.totalRevenue > 0 ? Math.round((item.total / stats.totalRevenue) * 100) : 0;
              return (
                <div key={item.type}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-gray-600">{TX_TYPE_LABEL[item.type] ?? item.type}</span>
                    <span className="font-medium text-gray-900">{fmtVnd(item.total)}</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full">
                    <div className="h-full bg-brand-500 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{item.count} đơn · {pct}%</p>
                </div>
              );
            })}
            {byType.length === 0 && <p className="text-sm text-gray-400 text-center py-6">Chưa có dữ liệu</p>}
          </div>
        </div>

        <div className="col-span-2 bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm font-medium text-gray-900 mb-4">Top truyện được nghe nhiều</p>
          <div className="space-y-1">
            {top.map((s, i) => (
              <div key={s.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                <span className="text-xs text-gray-400 w-4 text-right">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800 truncate">{s.title}</p>
                  <p className="text-xs text-gray-400">{GENRE_LABEL[s.genre] ?? s.genre}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-800">{s.total_plays.toLocaleString()}</p>
                  <p className="text-xs text-gray-400">{s.unique_listeners.toLocaleString()} người</p>
                </div>
              </div>
            ))}
            {top.length === 0 && <p className="text-sm text-gray-400 text-center py-8">Chưa có dữ liệu</p>}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-medium text-gray-900">Giao dịch gần nhất</p>
          <Link href="/admin/transactions" className="text-xs text-brand-600 hover:underline">Xem tất cả</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-gray-50">
              {["Người dùng", "Loại", "Số tiền", "Trạng thái", "Thời gian"].map(h => (
                <th key={h} className="pb-2 text-left text-xs font-medium text-gray-400 pr-4">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {txns.map(t => (
                <tr key={t.id} className="border-b border-gray-50 hover:bg-gray-50 last:border-0">
                  <td className="py-2.5 pr-4"><p className="text-gray-800 truncate max-w-[150px]">{t.name ?? t.email}</p><p className="text-xs text-gray-400 truncate max-w-[150px]">{t.email}</p></td>
                  <td className="py-2.5 pr-4 text-gray-600 whitespace-nowrap">{TX_TYPE_LABEL[t.type] ?? t.type}</td>
                  <td className="py-2.5 pr-4 font-medium text-gray-800 whitespace-nowrap">{fmtVnd(t.amount_vnd)}</td>
                  <td className="py-2.5 pr-4"><Badge variant={STATUS[t.status] ?? "neutral"}>{t.status === "paid" ? "Đã TT" : t.status === "pending" ? "Chờ TT" : t.status === "failed" ? "Thất bại" : "Đã huỷ"}</Badge></td>
                  <td className="py-2.5 text-gray-400 text-xs whitespace-nowrap">{fmtDateTime(t.created_at)}</td>
                </tr>
              ))}
              {txns.length === 0 && <tr><td colSpan={5} className="py-10 text-center text-sm text-gray-400">Chưa có giao dịch</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
