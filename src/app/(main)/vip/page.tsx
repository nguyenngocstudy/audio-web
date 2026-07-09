"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { fmtVnd } from "@/lib/utils";

const PLANS = [
  
  {
    key: "monthly",
    label: "1 tháng",
    price: 37000,
    pricePerMonth: 37000,
    days: 30,
    discount: null,
    badge: null,
    badgeColor: "",
  },
  {
    key: "quarterly",
    label: "3 tháng",
    price: 99000,
    pricePerMonth: 33000,
    days: 90,
    discount: "-11%",
    badge: "Phổ biến",
    badgeColor: "bg-orange-500",
  },
  {
    key: "biannual",
    label: "6 tháng",
    price: 169000,
    pricePerMonth: 28167,
    days: 180,
    discount: "-24%",
    badge: null,
    badgeColor: "",
  },
  {
    key: "yearly",
    label: "12 tháng",
    price: 289000,
    pricePerMonth: 24083,
    days: 365,
    discount: "-35%",
    badge: "Tiết kiệm nhất",
    badgeColor: "bg-teal-500",
  }

];

type PlanKey = "monthly" | "quarterly" | "biannual" | "yearly";

const PERKS = [
  "Truy cập toàn bộ thư viện VIP",
  "Nghe không quảng cáo",
  "Chất lượng âm thanh cao",
  "Truy cập sớm tập mới",
  "Hỗ trợ ưu tiên",
];

export default function VipPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [selected, setSelected] = useState<PlanKey>("monthly");
  const [loading, setLoading]   = useState(false);

  const plan = PLANS.find(p => p.key === selected)!;

  async function checkout() {
    if (!session) { router.push("/login?next=/vip"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/payos/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planKey: selected }),
      });
      const data = await res.json();
      if (data.checkoutUrl) window.location.href = data.checkoutUrl;
      else alert("Lỗi tạo thanh toán, thử lại sau.");
    } catch {
      alert("Lỗi kết nối, thử lại sau.");
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen py-8" style={{ backgroundColor: "rgb(10 10 15)" }}>
      <div className="max-w-xl mx-auto px-4">

        <div className="rounded-2xl border border-amber-600/40 p-6 mb-6"
          style={{ background: "linear-gradient(160deg, #1c1206 0%, #2a1a08 50%, #1c1206 100%)" }}>

          <div className="flex items-center justify-center gap-2 mb-6">
            <i className="ti ti-crown-filled text-amber-400" style={{ fontSize: 22 }} />
            <h1 className="text-xl font-bold text-white">Chọn gói VIP</h1>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-5">
            {PLANS.map(p => (
              <button key={p.key} onClick={() => setSelected(p.key as PlanKey)}
                className={`relative rounded-xl p-4 text-left transition-all border-2 ${
                  selected === p.key
                    ? "border-amber-500 bg-amber-500/10"
                    : "border-white/10 bg-white/5 hover:border-white/20"
                }`}>
                {p.badge && (
                  <span className={`absolute -top-2.5 left-1/2 -translate-x-1/2 text-white text-xs font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap ${p.badgeColor}`}>
                    {p.badge}
                  </span>
                )}
                <p className="text-gray-400 text-sm mb-1">{p.label}</p>
                <p className={`text-xl font-bold ${selected === p.key ? "text-amber-400" : "text-white"}`}>
                  {fmtVnd(p.price)}
                </p>
                {p.pricePerMonth !== p.price && (
                  <p className="text-gray-500 text-xs mt-0.5">
                    ~{Math.round(p.pricePerMonth).toLocaleString("vi-VN")}₫/tháng
                  </p>
                )}
                {p.discount && (
                  <span className="inline-block mt-1.5 bg-teal-500/20 text-teal-400 text-xs font-semibold px-2 py-0.5 rounded-full">
                    {p.discount}
                  </span>
                )}
                {selected === p.key && (
                  <div className="absolute top-2.5 right-2.5 w-4 h-4 rounded-full bg-amber-500 flex items-center justify-center">
                    <i className="ti ti-check text-white" style={{ fontSize: 10 }} />
                  </div>
                )}
              </button>
            ))}
          </div>

          <div className="rounded-xl p-4 mb-5 text-center"
            style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <p className="text-gray-400 text-sm">Tổng thanh toán:</p>
            <p className="text-amber-400 text-2xl font-bold mt-0.5">{fmtVnd(plan.price)}</p>
            <p className="text-gray-500 text-xs mt-0.5">({plan.days} ngày sử dụng)</p>
          </div>

          <ul className="space-y-2.5 mb-6">
            {PERKS.map(perk => (
              <li key={perk} className="flex items-center gap-2.5 text-sm text-gray-300">
                <div className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                  <i className="ti ti-check text-amber-400" style={{ fontSize: 11 }} />
                </div>
                {perk}
              </li>
            ))}
          </ul>

          <button onClick={checkout} disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-base text-white transition-all hover:opacity-90 disabled:opacity-60"
            style={{ background: "linear-gradient(90deg, #f59e0b, #d97706)" }}>
            {loading
              ? <><i className="ti ti-loader-2 animate-spin" style={{ fontSize: 18 }} />Đang xử lý...</>
              : <><i className="ti ti-credit-card" style={{ fontSize: 18 }} />Thanh toán {fmtVnd(plan.price)}</>}
          </button>

          <p className="text-center text-xs text-gray-500 mt-3">
            VIP được kích hoạt tự động sau khi thanh toán.
          </p>
          <p className="text-center text-xs text-gray-600 mt-1.5">
            Cần hỗ trợ? Liên hệ Admin.
          </p>
        </div>

        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-white mb-5">Tại sao nên đăng ký VIP?</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: "ti-books",        title: "Kho truyện khổng lồ",  desc: "Hàng nghìn truyện VIP chất lượng cao" },
              { icon: "ti-ban",          title: "Không quảng cáo",      desc: "Trải nghiệm nghe hoàn toàn thuần túy" },
              { icon: "ti-device-mobile",title: "Mọi thiết bị",         desc: "Nghe trên web, Android, iOS" },
              { icon: "ti-refresh",      title: "Cập nhật liên tục",    desc: "Tập mới mỗi ngày, truy cập sớm" },
            ].map(item => (
              <div key={item.title} className="rounded-xl p-4 text-left border border-white/5"
                style={{ backgroundColor: "rgba(255,255,255,0.03)" }}>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-3"
                  style={{ backgroundColor: "rgba(245,158,11,0.15)" }}>
                  <i className={`ti ${item.icon} text-amber-400`} style={{ fontSize: 18 }} />
                </div>
                <p className="text-sm font-semibold text-white mb-1">{item.title}</p>
                <p className="text-xs text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3 p-4 rounded-xl border border-white/5"
          style={{ backgroundColor: "rgba(255,255,255,0.02)" }}>
          <i className="ti ti-shield-check text-teal-400 flex-shrink-0" style={{ fontSize: 24 }} />
          <div>
            <p className="text-sm font-medium text-white">Thanh toán an toàn qua PayOS</p>
            <p className="text-xs text-gray-500 mt-0.5">
              Hỗ trợ tất cả app ngân hàng Việt Nam. Kích hoạt tự động sau khi thanh toán thành công.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
