"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { fmtVnd } from "@/lib/utils";

const PLANS = [
  { key:"monthly",   label:"1 tháng",  price:37000,  pricePerMonth:37000,  days:30,  discount:null,  badge:null,            badgeColor:"" },
  { key:"quarterly", label:"3 tháng",  price:99000,  pricePerMonth:33000,  days:90,  discount:"-11%",badge:"Phổ biến",      badgeColor:"bg-orange-500" },
  { key:"biannual",  label:"6 tháng",  price:169000, pricePerMonth:28167,  days:180, discount:"-24%",badge:null,            badgeColor:"" },
  { key:"yearly",    label:"12 tháng", price:289000, pricePerMonth:24083,  days:365, discount:"-35%",badge:"Tiết kiệm nhất",badgeColor:"bg-teal-500" },
];
type PlanKey = "monthly"|"quarterly"|"biannual"|"yearly";

const PERKS = ["Truy cập toàn bộ thư viện VIP","Nghe không quảng cáo","Chất lượng âm thanh cao","Truy cập sớm tập mới","Hỗ trợ ưu tiên"];

function PaymentPopup({ checkoutUrl, amount, planLabel, onSuccess, onClose }: {
  checkoutUrl: string; amount: number; planLabel: string;
  onSuccess: () => void; onClose: () => void;
}) {
  const [status, setStatus] = useState<"pending"|"paid">("pending");
  const [dots, setDots]     = useState(".");
  const pollRef = useRef<NodeJS.Timeout>();
  const dotsRef = useRef<NodeJS.Timeout>();
  const MAX_POLL = 60;
  const countRef = useRef(0);

  useEffect(() => {
    dotsRef.current = setInterval(() => setDots(d => d.length >= 3 ? "." : d + "."), 600);
    pollRef.current = setInterval(async () => {
      countRef.current++;
      if (countRef.current >= MAX_POLL) { clearInterval(pollRef.current); return; }
      try {
        const res = await fetch("/api/payos/check", { method: "POST" });
        const data = await res.json();
        if (data.status === "paid" || data.activated || data.alreadyPaid) {
          clearInterval(pollRef.current); clearInterval(dotsRef.current);
          setStatus("paid"); setTimeout(onSuccess, 1500);
        }
      } catch {}
    }, 2000);
    return () => { clearInterval(pollRef.current); clearInterval(dotsRef.current); };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor:"rgba(0,0,0,0.85)", backdropFilter:"blur(8px)" }}>
      <div className="w-full max-w-sm rounded-2xl overflow-hidden border border-white/10"
        style={{ backgroundColor:"#0f0f1a" }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
          <div className="flex items-center gap-2.5">
            <i className="ti ti-credit-card text-amber-400" style={{ fontSize:20 }} />
            <div>
              <p className="text-sm font-bold text-white">VIP {planLabel}</p>
              <p className="text-xs text-amber-400 font-semibold">{fmtVnd(amount)}</p>
            </div>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors">
            <i className="ti ti-x" style={{ fontSize:18 }} />
          </button>
        </div>

        {status === "paid" ? (
          <div className="flex flex-col items-center justify-center py-12 px-6">
            <div className="w-20 h-20 rounded-full bg-teal-500/20 flex items-center justify-center mb-4">
              <i className="ti ti-check text-teal-400" style={{ fontSize:40 }} />
            </div>
            <p className="text-xl font-bold text-white mb-2">Thanh toán thành công!</p>
            <p className="text-sm text-gray-400 text-center">VIP đã kích hoạt. Đang chuyển hướng...</p>
          </div>
        ) : (
          <>
            {/* PayOS iframe - hiển thị trang thanh toán + QR */}
            <div style={{ height:"460px" }}>
              <iframe src={checkoutUrl} className="w-full h-full border-0" title="Thanh toán PayOS" />
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-white/8 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse flex-shrink-0" />
                <p className="text-xs text-gray-400">Chờ xác nhận thanh toán{dots}</p>
              </div>
              <div className="flex gap-3">
                <button onClick={async () => {
                    const res = await fetch("/api/payos/check", { method:"POST" });
                    const d = await res.json();
                    if (d.status === "paid" || d.activated || d.alreadyPaid) {
                      clearInterval(pollRef.current); setStatus("paid"); setTimeout(onSuccess, 1500);
                    }
                  }}
                  className="text-xs text-gray-400 hover:text-white transition-colors flex items-center gap-1">
                  <i className="ti ti-refresh" style={{ fontSize:12 }} />Kiểm tra
                </button>
                <a href={checkoutUrl} target="_blank" rel="noopener noreferrer"
                  className="text-xs text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-1">
                  <i className="ti ti-external-link" style={{ fontSize:12 }} />Mở tab mới
                </a>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function VipPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [selected, setSelected] = useState<PlanKey>("monthly");
  const [loading, setLoading]   = useState(false);
  const [popup, setPopup]       = useState<{ checkoutUrl:string; amount:number; planLabel:string } | null>(null);

  const plan = PLANS.find(p => p.key === selected)!;

  async function checkout() {
    if (!session) { router.push("/login?next=/vip"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/payos/create", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ planKey: selected }),
      });
      const data = await res.json();
      if (data.checkoutUrl) {
        setPopup({ checkoutUrl: data.checkoutUrl, amount: plan.price, planLabel: plan.label });
      } else {
        alert("Lỗi tạo thanh toán: " + (data.error ?? "Thử lại sau"));
      }
    } catch { alert("Lỗi kết nối, thử lại sau."); }
    setLoading(false);
  }

  return (
    <>
      {popup && (
        <PaymentPopup
          checkoutUrl={popup.checkoutUrl}
          amount={popup.amount}
          planLabel={popup.planLabel}
          onSuccess={() => { setPopup(null); router.push("/vip/success"); }}
          onClose={() => setPopup(null)}
        />
      )}

      <div className="min-h-screen py-3 sm:py-8" style={{ backgroundColor:"rgb(10 10 15)" }}>
        <div className="max-w-xl mx-auto px-3 sm:px-4">
          <div className="rounded-2xl border border-amber-600/40 p-4 sm:p-6 mb-4 sm:mb-6"
            style={{ background:"linear-gradient(160deg,#1c1206 0%,#2a1a08 50%,#1c1206 100%)" }}>

          <div className="flex items-center justify-center gap-2 mb-4 sm:mb-6">
            <i className="ti ti-crown-filled text-amber-400" style={{ fontSize: 20 }} />
            <h1 className="text-lg sm:text-xl font-bold text-white">Chọn gói VIP</h1>
            </div>

          <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-3 sm:mb-5">
              {PLANS.map(p => (
                <button key={p.key} onClick={() => setSelected(p.key as PlanKey)}
                className={`relative rounded-xl p-3 sm:p-4 text-left transition-all border-2 ${
                  selected === p.key
                    ? "border-amber-500 bg-amber-500/10"
                    : "border-white/10 bg-white/5 hover:border-white/20"
                  }`}>
                  {p.badge && (
                  <span className={`absolute -top-2.5 left-1/2 -translate-x-1/2 text-white text-[10px] sm:text-xs font-bold px-2 sm:px-2.5 py-0.5 rounded-full whitespace-nowrap ${p.badgeColor}`}>
                      {p.badge}
                    </span>
                  )}
                <p className="text-gray-400 text-xs sm:text-sm mb-0.5 sm:mb-1">{p.label}</p>
                <p className={`text-base sm:text-xl font-bold ${selected === p.key ? "text-amber-400" : "text-white"}`}>
                    {fmtVnd(p.price)}
                  </p>
                  {p.pricePerMonth !== p.price && (
                  <p className="text-gray-500 text-[10px] sm:text-xs mt-0.5">
                    ~{Math.round(p.pricePerMonth).toLocaleString("vi-VN")}₫/tháng
                  </p>
                  )}
                  {p.discount && (
                  <span className="inline-block mt-1 sm:mt-1.5 bg-teal-500/20 text-teal-400 text-[10px] sm:text-xs font-semibold px-1.5 sm:px-2 py-0.5 rounded-full">
                    {p.discount}
                  </span>
                  )}
                  {selected === p.key && (
                  <div className="absolute top-2 sm:top-2.5 right-2 sm:right-2.5 w-4 h-4 rounded-full bg-amber-500 flex items-center justify-center">
                    <i className="ti ti-check text-white" style={{ fontSize: 10 }} />
                    </div>
                  )}
                </button>
              ))}
            </div>

          <div className="rounded-xl p-3 sm:p-4 mb-3 sm:mb-5 text-center"
            style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <p className="text-gray-400 text-xs sm:text-sm">Tổng thanh toán:</p>
            <p className="text-amber-400 text-xl sm:text-2xl font-bold mt-0.5">{fmtVnd(plan.price)}</p>
            <p className="text-gray-500 text-[10px] sm:text-xs mt-0.5">({plan.days} ngày sử dụng)</p>
            </div>

          <ul className="space-y-1.5 sm:space-y-2.5 mb-4 sm:mb-6">
              {PERKS.map(perk => (
              <li key={perk} className="flex items-center gap-2 sm:gap-2.5 text-xs sm:text-sm text-gray-300">
                <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                  <i className="ti ti-check text-amber-400" style={{ fontSize: 9 }} />
                  </div>
                  {perk}
                </li>
              ))}
            </ul>

            <button onClick={checkout} disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 sm:py-3.5 rounded-xl font-bold text-sm sm:text-base text-white transition-all hover:opacity-90 disabled:opacity-60"
            style={{ background: "linear-gradient(90deg, #f59e0b, #d97706)" }}>
              {loading
                ? <><i className="ti ti-loader-2 animate-spin" style={{ fontSize:18 }} />Đang xử lý...</>
                : <><i className="ti ti-credit-card" style={{ fontSize:18 }} />Thanh toán {fmtVnd(plan.price)}</>}
            </button>

          <p className="text-center text-[10px] sm:text-xs text-gray-500 mt-2 sm:mt-3">
            VIP được kích hoạt tự động sau khi thanh toán.
          </p>
          <p className="text-center text-[10px] sm:text-xs text-gray-600 mt-1">
            Cần hỗ trợ? Liên hệ Admin.
          </p>
          </div>

        <div className="text-center mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-5">Tại sao nên đăng ký VIP?</h2>
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
              {[
                {icon:"ti-books",         title:"Kho truyện khổng lồ",desc:"Hàng nghìn truyện VIP chất lượng cao"},
                {icon:"ti-ban",           title:"Không quảng cáo",    desc:"Trải nghiệm nghe hoàn toàn thuần túy"},
                {icon:"ti-device-mobile", title:"Mọi thiết bị",       desc:"Nghe trên web, Android, iOS"},
                {icon:"ti-refresh",       title:"Cập nhật liên tục",  desc:"Tập mới mỗi ngày, truy cập sớm"},
              ].map(item => (
              <div key={item.title} className="rounded-xl p-3 sm:p-4 text-left border border-white/5"
                style={{ backgroundColor: "rgba(255,255,255,0.03)" }}>
                <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center mb-2 sm:mb-3"
                  style={{ backgroundColor: "rgba(245,158,11,0.15)" }}>
                  <i className={`ti ${item.icon} text-amber-400`} style={{ fontSize: 16 }} />
                  </div>
                <p className="text-xs sm:text-sm font-semibold text-white mb-0.5 sm:mb-1">{item.title}</p>
                <p className="text-[10px] sm:text-xs text-gray-500">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 sm:p-4 rounded-xl border border-white/5"
            style={{ backgroundColor:"rgba(255,255,255,0.02)" }}>
            <i className="ti ti-shield-check text-teal-400 flex-shrink-0" style={{ fontSize:20 }} />
            <div>
              <p className="text-xs sm:text-sm font-medium text-white">Thanh toán an toàn qua PayOS</p>
              <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5">Hỗ trợ tất cả app ngân hàng Việt Nam. Kích hoạt tự động sau khi thanh toán thành công.</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
