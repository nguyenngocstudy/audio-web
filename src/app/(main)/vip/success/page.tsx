"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function VipSuccessPage() {
  const router = useRouter();
  const [status, setStatus]   = useState<"checking" | "paid" | "pending" | "error">("checking");
  const [retries, setRetries] = useState(0);
  const MAX_RETRIES = 10;

  useEffect(() => {
    checkPayment();
  }, []);

  async function checkPayment() {
    try {
      const res = await fetch("/api/payos/check", { method: "POST" });
      const data = await res.json();
      console.log("[VIP Success] Check result:", data);

      if (data.status === "paid" || data.alreadyPaid || data.activated) {
        setStatus("paid");
        return;
      }

      // Retry up to MAX_RETRIES times with 2s delay
      if (retries < MAX_RETRIES) {
        setTimeout(() => {
          setRetries(r => r + 1);
          checkPayment();
        }, 2000);
      } else {
        setStatus("pending");
      }
    } catch {
      setStatus("error");
    }
  }

  // Paid state
  if (status === "paid") {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 rounded-full bg-teal-500/20 flex items-center justify-center mx-auto mb-5">
            <i className="ti ti-check text-teal-400" style={{ fontSize: 40 }} />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Thanh toán thành công! 🎉</h1>
          <p className="text-gray-400 text-sm mb-2">Tài khoản VIP của bạn đã được kích hoạt.</p>
          <p className="text-gray-500 text-xs mb-8">Tận hưởng nghe truyện không giới hạn nhé!</p>
          <div className="flex flex-col gap-3">
            <Link href="/"
              className="flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-white text-sm transition-all hover:opacity-90"
              style={{ backgroundColor: "var(--accent)" }}>
              <i className="ti ti-headphones" style={{ fontSize: 16 }} />
              Nghe truyện ngay
            </Link>
            <Link href="/profile"
              className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm text-gray-300 border border-white/15 hover:border-white/30 transition-colors">
              <i className="ti ti-user" style={{ fontSize: 16 }} />
              Xem tài khoản
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Checking state
  if (status === "checking") {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto mb-5">
            <i className="ti ti-loader-2 animate-spin text-amber-400" style={{ fontSize: 40 }} />
          </div>
          <h1 className="text-xl font-bold text-white mb-2">Đang xác nhận thanh toán...</h1>
          <p className="text-gray-500 text-sm mb-2">Vui lòng chờ trong giây lát</p>
          <div className="flex justify-center gap-1 mt-4">
            {Array.from({ length: MAX_RETRIES }).map((_, i) => (
              <div key={i} className={`w-1.5 h-1.5 rounded-full transition-colors ${i < retries ? "bg-amber-400" : "bg-white/10"}`} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Pending / Error fallback (webhook có thể chậm)
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="w-20 h-20 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto mb-5">
          <i className="ti ti-clock text-amber-400" style={{ fontSize: 40 }} />
        </div>
        <h1 className="text-xl font-bold text-white mb-2">Đang xử lý thanh toán</h1>
        <p className="text-gray-400 text-sm mb-6">
          Thanh toán của bạn đã được ghi nhận. VIP sẽ được kích hoạt trong vài phút.
          <br /><br />
          Nếu sau 5 phút chưa nhận được, vui lòng liên hệ Admin.
        </p>
        <div className="flex flex-col gap-3">
          <button onClick={() => { setStatus("checking"); setRetries(0); checkPayment(); }}
            className="flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-white text-sm transition-all hover:opacity-90"
            style={{ backgroundColor: "var(--accent)" }}>
            <i className="ti ti-refresh" style={{ fontSize: 16 }} />
            Kiểm tra lại
          </button>
          <Link href="/profile"
            className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm text-gray-300 border border-white/15 hover:border-white/30 transition-colors">
            <i className="ti ti-user" style={{ fontSize: 16 }} />
            Xem lịch sử giao dịch
          </Link>
          <Link href="/"
            className="text-sm text-gray-500 hover:text-gray-300 transition-colors py-2">
            Về trang chủ
          </Link>
        </div>
      </div>
    </div>
  );
}
