// app/(auth)/login/LoginClient.tsx
"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

// toàn bộ code hiện tại của bạn
export default function LoginClient() {
  const router = useRouter();
  const next   = useSearchParams().get("next") ?? null;
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setLoading(true);
    const res = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (res?.error) { setError("Email hoac mat khau khong dung"); return; }
    const me = await fetch("/api/me").then(r => r.json());
    router.push(next ?? (me?.isAdmin ? "/admin" : "/"));
    router.refresh();
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
            <i className="ti ti-headphones text-white" style={{ fontSize: 26 }} />
          </div>
          <h1 className="text-2xl font-bold text-white">Đăng nhập</h1>
          <p className="text-gray-400 text-sm mt-1">
            Chưa có tài khoản?{" "}
            <Link href="/register" className="font-medium hover:underline" style={{ color: "var(--accent)" }}>
              Đăng ký miễn phí
            </Link>
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 p-6 backdrop-blur-sm"
          style={{ backgroundColor: "rgba(17,17,34,0.85)" }}>

          {/* Google */}
          <button onClick={() => signIn("google", { callbackUrl: next ?? "/" })}
            className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl border border-white/20 text-white text-sm font-medium hover:bg-white/5 transition-colors mb-4">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
              <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
            </svg>
            Tiếp tục với Google
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-xs text-gray-500">hoặc</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          <form onSubmit={submit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
              <div className="relative">
                <i className="ti ti-mail absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" style={{ fontSize: 16 }} />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  placeholder="ban@example.com"
                  className="w-full pl-9 pr-3 py-2.5 text-sm text-white placeholder-gray-500 rounded-xl border border-white/10 bg-white/5 focus:outline-none focus:ring-2 focus:border-transparent"
                  style={{ "--tw-ring-color": "var(--accent)" } as any} />
              </div>
            </div>

            {/* Password with toggle */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-sm font-medium text-gray-300">Mật khẩu</label>
                <Link href="/forgot-password" className="text-xs text-gray-400 hover:text-white transition-colors">
                  Quên mật khẩu?
                </Link>
              </div>
              <div className="relative">
                <i className="ti ti-lock absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" style={{ fontSize: 16 }} />
                <input
                  type={showPw ? "text" : "password"}
                  value={password} onChange={e => setPassword(e.target.value)} required
                  placeholder="••••••••"
                  className="w-full pl-9 pr-10 py-2.5 text-sm text-white placeholder-gray-500 rounded-xl border border-white/10 bg-white/5 focus:outline-none focus:ring-2 focus:border-transparent"
                  style={{ "--tw-ring-color": "var(--accent)" } as any} />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 transition-colors"
                  tabIndex={-1}>
                  <i className={`ti ${showPw ? "ti-eye-off" : "ti-eye"}`} style={{ fontSize: 17 }} />
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl px-3 py-2">
                <i className="ti ti-alert-circle flex-shrink-0" style={{ fontSize: 15 }} />
                {error}
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-white text-sm transition-all hover:opacity-90 disabled:opacity-60"
              style={{ backgroundColor: "var(--accent)" }}>
              {loading
                ? <><i className="ti ti-loader-2 animate-spin" style={{ fontSize: 16 }} />Đang đăng nhập...</>
                : <><i className="ti ti-login" style={{ fontSize: 16 }} />Đăng nhập</>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}