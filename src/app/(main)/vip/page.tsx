"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { fmtVnd } from "@/lib/utils";

const PLANS = [
  { key:"threedays", label:"3 ngày",   price:14000,  pricePerMonth:14000, days:3,   discount:null,   badge:null,             badgeColor:"" },
  { key:"weekly",    label:"1 tuần",   price:20000,  pricePerMonth:20000,  days:7,   discount:null,   badge:null,             badgeColor:"" },
  { key:"monthly",   label:"1 tháng",  price:37000,  pricePerMonth:37000,  days:30,  discount:null,   badge:null,             badgeColor:"" },
  { key:"quarterly", label:"3 tháng",  price:99000,  pricePerMonth:33000,  days:90,  discount:"-11%", badge:"Phổ biến",       badgeColor:"bg-orange-500" },
  { key:"biannual",  label:"6 tháng",  price:169000, pricePerMonth:28167,  days:180, discount:"-24%", badge:null,             badgeColor:"" },
  { key:"yearly",    label:"12 tháng", price:289000, pricePerMonth:24083,  days:365, discount:"-35%", badge:"Tiết kiệm nhất", badgeColor:"bg-teal-500" },
];
type PlanKey = "threedays"|"weekly"|"monthly"|"quarterly"|"biannual"|"yearly";

const PERKS = [
  "Truy cập toàn bộ thư viện VIP",
  "Nghe không quảng cáo",
  "Chất lượng âm thanh cao",
  "Truy cập sớm tập mới",
  "Hỗ trợ ưu tiên",
];

interface PaymentData {
  checkoutUrl: string;
  amount: number;
  planLabel: string;
  orderCode?: string;
  qrCode?: string;        // EMVCo string từ PayOS
  accountName?: string;
  accountNumber?: string;
  bankName?: string;
}

// ── QR Canvas Component ───────────────────────────────────────────────────────
function QRCanvas({ value }: { value: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);
  const [err, setErr]     = useState(false);

  useEffect(() => {
    if (!value || !canvasRef.current) return;
    import("qrcode").then(mod => {
      const QRCode = mod.default ?? mod;
      (QRCode as any).toCanvas(
        canvasRef.current,
        value,
        { width: 176, margin: 1, color: { dark: "#000000", light: "#ffffff" } },
        (e: any) => { if (e) { console.error(e); setErr(true); } else setReady(true); }
      );
    }).catch(() => setErr(true));
  }, [value]);

  if (err) return (
    <div className="w-44 h-44 flex flex-col items-center justify-center gap-2 text-gray-400">
      <i className="ti ti-qrcode-off" style={{ fontSize: 40 }} />
      <p className="text-xs text-center">Lỗi QR. Dùng nút bên dưới</p>
    </div>
  );

  return (
    <div className="relative w-44 h-44">
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center">
          <i className="ti ti-loader-2 animate-spin text-gray-400" style={{ fontSize: 28 }} />
        </div>
      )}
      <canvas ref={canvasRef} className={`rounded-lg transition-opacity ${ready ? "opacity-100" : "opacity-0"}`} />
    </div>
  );
}

// ── Payment Popup ─────────────────────────────────────────────────────────────
function PaymentPopup({ data, onSuccess, onClose }: {
  data: PaymentData;
  onSuccess: () => void;
  onClose: () => void;
}) {
  const [status, setStatus]     = useState<"pending"|"paid">("pending");
  const [dots, setDots]         = useState(".");
  const [checking, setChecking] = useState(false);
  const pollRef  = useRef<NodeJS.Timeout>();
  const dotsRef  = useRef<NodeJS.Timeout>();
  const countRef = useRef(0);

  useEffect(() => {
    dotsRef.current = setInterval(() =>
      setDots(d => d.length >= 3 ? "." : d + "."), 700);

    pollRef.current = setInterval(async () => {
      countRef.current++;
      if (countRef.current >= 60) { clearInterval(pollRef.current); return; }
      try {
        const res  = await fetch("/api/payos/check", { method: "POST" });
        const json = await res.json();
        if (json.status === "paid" || json.activated || json.alreadyPaid) {
          clearInterval(pollRef.current);
          clearInterval(dotsRef.current);
          setStatus("paid");
          setTimeout(onSuccess, 1800);
        }
      } catch {}
    }, 2000);

    return () => { clearInterval(pollRef.current); clearInterval(dotsRef.current); };
  }, []);

  async function manualCheck() {
    setChecking(true);
    try {
      const res  = await fetch("/api/payos/check", { method: "POST" });
      const json = await res.json();
      if (json.status === "paid" || json.activated || json.alreadyPaid) {
        clearInterval(pollRef.current);
        setStatus("paid");
        setTimeout(onSuccess, 1800);
      }
    } catch {}
    setChecking(false);
  }

  const bankRows = [
    { label:"Ngân hàng",   value: data.bankName,      bold: false },
    { label:"Số TK",       value: data.accountNumber, bold: false },
    { label:"Chủ TK",      value: data.accountName,   bold: true  },
    { label:"Nội dung CK", value: data.orderCode,     bold: true  },
  ].filter(r => r.value);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor:"rgba(0,0,0,0.82)", backdropFilter:"blur(6px)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>

      <div className="w-full max-w-xs rounded-2xl overflow-hidden border border-amber-600/40 shadow-2xl"
        style={{ background:"linear-gradient(160deg,#1c1206 0%,#2a1a08 50%,#1c1206 100%)" }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-amber-600/30">
          <div className="flex items-center gap-2">
            <i className="ti ti-qrcode text-amber-400" style={{ fontSize:17 }} />
            <p className="text-sm font-bold text-white">Quét mã QR để thanh toán</p>
          </div>
          <button onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-500 hover:text-amber-400 hover:bg-amber-500/10 transition-colors">
            <i className="ti ti-x" style={{ fontSize:16 }} />
          </button>
        </div>

        {status === "paid" ? (
          /* Success */
          <div className="flex flex-col items-center py-10 px-6">
            <div className="w-20 h-20 rounded-full bg-teal-500/20 border border-teal-500/30 flex items-center justify-center mb-4">
              <i className="ti ti-check text-teal-400" style={{ fontSize:38 }} />
            </div>
            <p className="text-lg font-bold text-white mb-1">Thanh toán thành công!</p>
            <p className="text-sm text-gray-400 text-center">VIP đã kích hoạt. Đang chuyển hướng...</p>
            <div className="flex gap-1.5 mt-5">
              {[0,1,2].map(i => (
                <div key={i} className="w-2 h-2 rounded-full bg-teal-400 animate-bounce"
                  style={{ animationDelay:`${i*150}ms` }} />
              ))}
            </div>
          </div>
        ) : (
          <>
            <p className="text-xs text-gray-500 text-center px-5 pt-3">
              Sử dụng app ngân hàng hoặc ví điện tử để quét mã bên dưới
            </p>

            {/* QR */}
            <div className="flex justify-center px-8 py-4">
              <div className="bg-white rounded-2xl p-3 shadow-lg flex items-center justify-center min-h-[176px]">
                {data.qrCode
                  ? <QRCanvas value={data.qrCode} />
                  : (
                    <div className="w-44 h-44 flex flex-col items-center justify-center gap-3 text-gray-400">
                      <i className="ti ti-qrcode text-gray-300" style={{ fontSize:52 }} />
                      <a href={data.checkoutUrl} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-center text-amber-500 underline">Mở trang thanh toán</a>
                    </div>
                  )
                }
              </div>
            </div>

            {/* Plan + Amount */}
            <div className="text-center px-5 pb-3">
              <p className="text-sm text-gray-400">Gói VIP {data.planLabel}</p>
              <p className="text-2xl font-bold text-amber-400 mt-0.5">{fmtVnd(data.amount)}</p>
            </div>

            {/* Bank info */}
            {bankRows.length > 0 && (
              <div className="mx-5 mb-4 rounded-xl border border-amber-600/20 overflow-hidden"
                style={{ backgroundColor:"rgba(0,0,0,0.25)" }}>
                {bankRows.map((row, i) => (
                  <div key={row.label}
                    className={`flex items-center justify-between px-4 py-2.5 ${i < bankRows.length-1 ? "border-b border-amber-600/10" : ""}`}>
                    <span className="text-xs text-gray-500">{row.label}</span>
                    <span className={`text-xs ml-4 text-right ${row.bold ? "font-bold text-white" : "text-gray-300"}`}>
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Polling */}
            <div className="mx-5 mb-3 flex items-start gap-2.5 px-4 py-3 rounded-xl border border-amber-600/20"
              style={{ backgroundColor:"rgba(0,0,0,0.2)" }}>
              <i className="ti ti-loader-2 animate-spin text-amber-400 flex-shrink-0 mt-0.5" style={{ fontSize:15 }} />
              <p className="text-xs text-gray-400 leading-relaxed">
                Đang chờ xác nhận thanh toán{dots} Trang sẽ tự cập nhật khi thanh toán thành công.
              </p>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-center gap-4 pb-4">
              <button onClick={manualCheck} disabled={checking}
                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-amber-400 transition-colors disabled:opacity-50">
                <i className={`ti ti-refresh ${checking ? "animate-spin":""}`} style={{ fontSize:13 }} />
                Kiểm tra ngay
              </button>
              <span className="text-gray-700 text-xs">·</span>
              <a href={data.checkoutUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-amber-400 transition-colors">
                <i className="ti ti-external-link" style={{ fontSize:13 }} />
                Mở tab mới
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Main VIP Page ─────────────────────────────────────────────────────────────
export default function VipPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [selected, setSelected] = useState<PlanKey>("monthly");
  const [loading, setLoading]   = useState(false);
  const [popup, setPopup]       = useState<PaymentData | null>(null);

  const plan = PLANS.find(p => p.key === selected)!;

  async function checkout() {
    if (!session) { router.push("/login?next=/vip"); return; }
    setLoading(true);
    try {
      const res  = await fetch("/api/payos/create", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ planKey: selected }),
      });
      const d = await res.json();
      if (d.checkoutUrl) {
        setPopup({
          checkoutUrl:   d.checkoutUrl,
          amount:        plan.price,
          planLabel:     plan.label,
          orderCode:     d.orderCode,
          qrCode:        d.qrCode,
          accountName:   d.accountName,
          accountNumber: d.accountNumber,
          bankName:      d.bankName,
        });
      } else {
        alert("Lỗi: " + (d.error ?? "Thử lại sau"));
      }
    } catch { alert("Lỗi kết nối, thử lại sau."); }
    setLoading(false);
  }

  return (
    <>
      {popup && (
        <PaymentPopup
          data={popup}
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
