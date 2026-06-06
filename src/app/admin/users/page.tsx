import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { desc } from "drizzle-orm";
import Badge from "@/components/ui/Badge";
import { fmtDate } from "@/lib/utils";

export default async function AdminUsersPage() {
  const data = await db.select().from(users).orderBy(desc(users.createdAt));
  const now = new Date();
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Người dùng</h1>
        <p className="text-sm text-gray-400 mt-0.5">{data.length} tài khoản</p>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-50 border-b border-gray-100">
              {["Người dùng", "Coin", "VIP đến", "Loại", "Ngày tham gia"].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 whitespace-nowrap">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {data.map(u => {
                const vipActive = u.vipUntil && new Date(u.vipUntil) > now;
                return (
                  <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50 last:border-0">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-brand-100 flex items-center justify-center text-xs font-semibold text-brand-700 flex-shrink-0">
                          {u.name?.[0]?.toUpperCase() ?? "?"}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{u.name ?? "—"}</p>
                          <p className="text-xs text-gray-400">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{u.coinBalance.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      {vipActive
                        ? <span className="text-amber-600 font-medium text-xs">{fmtDate(u.vipUntil)}</span>
                        : <span className="text-gray-400 text-xs">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      {u.isAdmin
                        ? <Badge variant="danger">Admin</Badge>
                        : vipActive
                          ? <Badge variant="vip">VIP</Badge>
                          : <Badge variant="neutral">Free</Badge>}
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">{fmtDate(u.createdAt)}</td>
                  </tr>
                );
              })}
              {data.length === 0 && (
                <tr><td colSpan={5} className="py-12 text-center text-gray-400">Chưa có người dùng</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
