"use client";
import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail]   = useState("");
  const [sent, setSent]     = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    // TODO: Tích hợp email service (Resend, SendGrid...)
    await new Promise(r => setTimeout(r, 1200));
    setSent(true);
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "linear-gradient(135deg, #0f0f1a 0%, #1a0a2e 60%, #0f0f1a 100%)" }}>
      <div className="absolute w-96 h-96 rounded-full blur-3xl opacity-20 pointer-events-none"
        style={{ backgroundColor: "var(--accent)", top: "20%", left: "50%", transform: "translateX(-50%)" }} />

      <div className="w-full max-w-sm relative">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg"
            style={{ backgroundColor: "var(--accent)" }}>
            <i className={`ti ${sent ? "ti-mail-check" : "ti-lock-question"} text-white`} style={{ fontSize: 26 }} />
          </div>
          <h1 className="text-2xl font-bold text-white">
            {sent ? "Kiểm tra email" : "Quên mật khẩu"}
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            {sent
              ? `Chúng tôi đã gửi link đặt lại mật khẩu đến ${email}`
              : "Nhập email để nhận link đặt lại mật khẩu"}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 p-6 backdrop-blur-sm"
          style={{ backgroundColor: "rgba(17,17,34,0.8)" }}>

          {sent ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-teal-500/20 flex items-center justify-center mx-auto">
                <i className="ti ti-check text-teal-400" style={{ fontSize: 32 }} />
              </div>
              <p className="text-sm text-gray-400">
                Không thấy email? Kiểm tra thư mục spam hoặc{" "}
                <button onClick={() => setSent(false)} className="hover:underline" style={{ color: "var(--accent)" }}>
                  thử lại
                </button>
              </p>
              <Link href="/login"
                className="block w-full text-center py-2.5 rounded-xl font-medium text-white text-sm transition-all hover:opacity-90"
                style={{ backgroundColor: "var(--accent)" }}>
                Quay về đăng nhập
              </Link>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Email đăng ký</label>
                <div className="relative">
                  <i className="ti ti-mail absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" style={{ fontSize: 16 }} />
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                    placeholder="ban@example.com"
                    className="w-full pl-9 pr-3 py-2.5 text-sm text-white placeholder-gray-500 rounded-xl border border-white/10 bg-white/5 focus:outline-none focus:ring-2 focus:border-transparent"
                    style={{ "--tw-ring-color": "var(--accent)" } as any} />
                </div>
              </div>
              <button type="submit" disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-white text-sm transition-all hover:opacity-90 disabled:opacity-60"
                style={{ backgroundColor: "var(--accent)" }}>
                {loading
                  ? <><i className="ti ti-loader-2 animate-spin" style={{ fontSize: 16 }} />Đang gửi...</>
                  : <><i className="ti ti-send" style={{ fontSize: 16 }} />Gửi link đặt lại</>}
              </button>
              <Link href="/login" className="block text-center text-sm text-gray-400 hover:text-white transition-colors">
                ← Quay về đăng nhập
              </Link>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
