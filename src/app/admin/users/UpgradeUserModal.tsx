"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { fmtVnd, fmtDate } from "@/lib/utils";

const PLANS = [
  { key: "threedays", label: "3 ngày",   days: 3,   price: 14000,  pricePerMonth: 14000,  badge: null },
  { key: "weekly",    label: "1 tuần",   days: 7,   price: 20000,  pricePerMonth: 20000,  badge: null },
  { key: "monthly",   label: "1 tháng",  days: 30,  price: 37000,  pricePerMonth: 37000,  badge: null },
  { key: "quarterly", label: "3 tháng",  days: 90,  price: 99000,  pricePerMonth: 33000,  badge: "Phổ biến" },
  { key: "biannual",  label: "6 tháng",  days: 180, price: 169000, pricePerMonth: 28167,  badge: null },
  { key: "yearly",    label: "12 tháng", days: 365, price: 289000, pricePerMonth: 24083,  badge: "Tiết kiệm" },
] as const;

type PlanKey = (typeof PLANS)[number]["key"];

interface UpgradeUserProps {
  user: {
    id: string;
    name: string | null;
    email: string;
    vipUntil: Date | string | null;
  };
}

export default function UpgradeUserModal({ user }: UpgradeUserProps) {
  const router = useRouter();
  const [open, setOpen]     = useState(false);
  const [planKey, setPlanKey] = useState<PlanKey>("monthly");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [done, setDone]       = useState(false);

  const plan = PLANS.find(p => p.key === planKey)!;
  const vipActive = user.vipUntil && new Date(user.vipUntil) > new Date();

  async function confirmUpgrade() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/users/upgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, planKey }),
      });
      const d = await res.json();
      if (!res.ok) {
        setError(d.error ?? "Đã có lỗi xảy ra");
        setLoading(false);
        return;
      }
      setDone(true);
      setTimeout(() => {
        setOpen(false);
        setDone(false);
        router.refresh();
      }, 1400);
    } catch {
      setError("Lỗi kết nối, thử lại sau.");
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={() => { setOpen(true); setError(null); }}
        className="flex items-center gap-1 text-[10px] sm:text-xs px-2 py-1 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors whitespace-nowrap"
      >
        <i className="ti ti-crown" style={{ fontSize: 12 }} />
        <span>Nâng cấp VIP</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          onClick={e => { if (e.target === e.currentTarget && !loading) { setOpen(false); setDone(false); } }}
        >
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div>
                <h2 className="text-base font-semibold text-gray-900">Nâng cấp VIP</h2>
                <p className="text-xs text-gray-400 mt-0.5">Chọn gói cho người dùng</p>
              </div>
              <button
                onClick={() => { if (!loading) { setOpen(false); setDone(false); } }}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <i className="ti ti-x" style={{ fontSize: 16 }} />
              </button>
            </div>

            {done ? (
              <div className="flex flex-col items-center py-12 px-6">
                <div className="w-16 h-16 rounded-full bg-teal-50 flex items-center justify-center mb-3">
                  <i className="ti ti-check text-teal-500" style={{ fontSize: 30 }} />
                </div>
                <p className="text-sm font-semibold text-gray-800">Nâng cấp thành công!</p>
                <p className="text-xs text-gray-400 mt-1">Đã kích hoạt gói {plan.label} cho {user.name ?? user.email}</p>
              </div>
            ) : (
              <div className="px-5 py-4">
                {/* User info */}
                <div className="flex items-center gap-3 mb-4 rounded-xl border border-gray-200 p-3">
                  <div className="w-9 h-9 rounded-full bg-brand-100 flex items-center justify-center text-sm font-semibold text-brand-700 flex-shrink-0">
                    {user.name?.[0]?.toUpperCase() ?? "?"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-800 truncate">{user.name ?? "—"}</p>
                    <p className="text-xs text-gray-400 truncate">{user.email}</p>
                  </div>
                  {vipActive && (
                    <span className="text-[10px] text-amber-600 bg-amber-50 px-2 py-1 rounded-lg whitespace-nowrap">
                      VIP đến {fmtDate(user.vipUntil)}
                    </span>
                  )}
                </div>
                {vipActive && (
                  <p className="text-xs text-gray-500 mb-3 flex items-center gap-1">
                    <i className="ti ti-info-circle text-gray-400" style={{ fontSize: 13 }} />
                    User đang là VIP. Thời hạn mới sẽ được cộng tiếp vào hạn hiện tại.
                  </p>
                )}

                {/* Plan grid */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {PLANS.map(p => (
                    <button
                      key={p.key}
                      onClick={() => setPlanKey(p.key)}
                      className={`relative rounded-xl p-3 text-left border-2 transition-all ${
                        planKey === p.key
                          ? "border-amber-500 bg-amber-50"
                          : "border-gray-200 bg-white hover:border-gray-300"
                      }`}
                    >
                      {p.badge && (
                        <span className="absolute -top-2 left-2 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-orange-500 whitespace-nowrap">
                          {p.badge}
                        </span>
                      )}
                      <p className="text-gray-500 text-xs">{p.label}</p>
                      <p className={`text-sm font-bold mt-0.5 ${planKey === p.key ? "text-amber-600" : "text-gray-800"}`}>
                        {fmtVnd(p.price)}
                      </p>
                      {planKey === p.key && (
                        <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-amber-500 flex items-center justify-center">
                          <i className="ti ti-check text-white" style={{ fontSize: 10 }} />
                        </div>
                      )}
                    </button>
                  ))}
                </div>

                {/* Summary */}
                <div className="flex items-center justify-between rounded-xl bg-gray-50 border border-gray-200 px-4 py-3 mb-4">
                  <span className="text-xs text-gray-500">Gói {plan.label} · {plan.days} ngày</span>
                  <span className="text-sm font-bold text-amber-600">{fmtVnd(plan.price)}</span>
                </div>

                {error && (
                  <p className="text-xs text-rose-500 mb-3 flex items-center gap-1">
                    <i className="ti ti-alert-circle" style={{ fontSize: 13 }} />
                    {error}
                  </p>
                )}

                <button
                  onClick={confirmUpgrade}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white bg-amber-500 hover:bg-amber-600 disabled:opacity-60 transition-colors"
                >
                  {loading
                    ? <><i className="ti ti-loader-2 animate-spin" style={{ fontSize: 15 }} />Đang nâng cấp...</>
                    : <><i className="ti ti-crown" style={{ fontSize: 15 }} />Nâng cấp gói {plan.label}</>}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
