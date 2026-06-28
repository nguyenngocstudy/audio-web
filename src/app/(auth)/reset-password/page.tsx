"use client";
import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center px-4"
        style={{ background: "linear-gradient(135deg,#0f0f1a 0%,#1a0a2e 60%,#0f0f1a 100%)" }}>
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto"
          style={{ backgroundColor: "var(--accent)" }}>
          <i className="ti ti-loader-2 animate-spin text-white" style={{ fontSize: 26 }} />
        </div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") ?? "";
  const [pw, setPw]           = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [done, setDone]       = useState(false);

  if (!token) return (
    <div className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "linear-gradient(135deg,#0f0f1a 0%,#1a0a2e 60%,#0f0f1a 100%)" }}>
      <div className="text-center text-white">
        <i className="ti ti-alert-circle text-rose-400 block mb-3" style={{ fontSize: 48 }} />
        <p className="text-lg font-semibold mb-2">Link không hợp lệ</p>
        <Link href="/forgot-password" className="text-sm hover:underline" style={{ color: "var(--accent)" }}>
          Yêu cầu link mới
        </Link>
      </div>
    </div>
  );

  if (done) return (
    <div className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "linear-gradient(135deg,#0f0f1a 0%,#1a0a2e 60%,#0f0f1a 100%)" }}>
      <div className="text-center max-w-sm w-full">
        <div className="w-16 h-16 rounded-full bg-teal-500/20 flex items-center justify-center mx-auto mb-4">
          <i className="ti ti-check text-teal-400" style={{ fontSize: 32 }} />
        </div>
        <h1 className="text-xl font-bold text-white mb-2">Đổi mật khẩu thành công!</h1>
        <p className="text-gray-400 text-sm mb-6">Bạn có thể đăng nhập bằng mật khẩu mới.</p>
        <Link href="/login"
          className="block w-full text-center py-2.5 rounded-xl font-semibold text-white text-sm"
          style={{ backgroundColor: "var(--accent)" }}>
          Đăng nhập ngay
        </Link>
      </div>
    </div>
  );

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (pw.length < 6) { setError("Mật khẩu tối thiểu 6 ký tự"); return; }
    if (pw !== confirm)  { setError("Mật khẩu xác nhận không khớp"); return; }
    setLoading(true);
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password: pw }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error ?? "Lỗi đặt lại mật khẩu"); return; }
    setDone(true);
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "linear-gradient(135deg,#0f0f1a 0%,#1a0a2e 60%,#0f0f1a 100%)" }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: "var(--accent)" }}>
            <i className="ti ti-lock-open text-white" style={{ fontSize: 26 }} />
          </div>
          <h1 className="text-2xl font-bold text-white">Đặt lại mật khẩu</h1>
          <p className="text-gray-400 text-sm mt-1">Nhập mật khẩu mới cho tài khoản</p>
        </div>

        <div className="rounded-2xl border border-white/10 p-6"
          style={{ backgroundColor: "rgba(17,17,34,0.85)" }}>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Mật khẩu mới</label>
              <div className="relative">
                <i className="ti ti-lock absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" style={{ fontSize: 16 }} />
                <input type={showPw ? "text" : "password"} value={pw} onChange={e => setPw(e.target.value)} required
                  placeholder="Ít nhất 6 ký tự"
                  className="w-full pl-9 pr-10 py-2.5 text-sm text-white placeholder-gray-500 rounded-xl border border-white/10 bg-white/5 focus:outline-none focus:ring-2 focus:border-transparent"
                  style={{ "--tw-ring-color": "var(--accent)" } as any} />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 transition-colors">
                  <i className={`ti ${showPw ? "ti-eye-off" : "ti-eye"}`} style={{ fontSize: 17 }} />
                </button>
              </div>
              {pw.length > 0 && (
                <div className="mt-1.5 flex gap-1">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${
                      i < (pw.length >= 12 ? 4 : pw.length >= 8 ? 3 : pw.length >= 6 ? 2 : 1)
                        ? pw.length >= 12 ? "bg-teal-400" : pw.length >= 8 ? "bg-yellow-400" : "bg-orange-400"
                        : "bg-white/10"
                    }`} />
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Xác nhận mật khẩu</label>
              <div className="relative">
                <i className="ti ti-lock-check absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" style={{ fontSize: 16 }} />
                <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required
                  placeholder="Nhập lại mật khẩu"
                  className={`w-full pl-9 pr-3 py-2.5 text-sm text-white placeholder-gray-500 rounded-xl border bg-white/5 focus:outline-none focus:ring-2 focus:border-transparent transition-colors ${
                    confirm && pw !== confirm ? "border-rose-500/60" : confirm && pw === confirm ? "border-teal-500/60" : "border-white/10"
                  }`}
                  style={{ "--tw-ring-color": "var(--accent)" } as any} />
              </div>
              {confirm && pw !== confirm && (
                <p className="text-xs text-rose-400 mt-1 flex items-center gap-1">
                  <i className="ti ti-alert-circle" style={{ fontSize: 12 }} />Mật khẩu không khớp
                </p>
              )}
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl px-3 py-2">
                <i className="ti ti-alert-circle flex-shrink-0" style={{ fontSize: 15 }} />{error}
              </div>
            )}

            <button type="submit" disabled={loading || !pw || pw !== confirm}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-white text-sm disabled:opacity-60 transition-all hover:opacity-90"
              style={{ backgroundColor: "var(--accent)" }}>
              {loading
                ? <><i className="ti ti-loader-2 animate-spin" style={{ fontSize: 16 }} />Đang lưu...</>
                : <><i className="ti ti-check" style={{ fontSize: 16 }} />Đặt lại mật khẩu</>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
