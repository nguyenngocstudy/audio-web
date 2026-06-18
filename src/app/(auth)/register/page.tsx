"use client";
import { useState, useEffect, useRef } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";

export default function RegisterPage() {
  const [name, setName]           = useState("");
  const [email, setEmail]         = useState("");
  const [emailError, setEmailError] = useState("");
  const [emailChecking, setEmailChecking] = useState(false);
  const [pw, setPw]               = useState("");
  const [confirm, setConfirm]     = useState("");
  const [showPw, setShowPw]       = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError]         = useState("");
  const [loading, setLoading]     = useState(false);
  const debounceRef               = useRef<NodeJS.Timeout>();

  // Real-time email duplicate check
  useEffect(() => {
    if (!email || !email.includes("@")) { setEmailError(""); return; }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setEmailChecking(true);
      try {
        const res = await fetch(`/api/auth/check-email?email=${encodeURIComponent(email)}`);
        const data = await res.json();
        setEmailError(data.exists ? "Email nay da duoc dang ky" : "");
      } catch {
        setEmailError("");
      }
      setEmailChecking(false);
    }, 600);
  }, [email]);

  const pwMatch = confirm.length > 0 && pw !== confirm;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (emailError) { setError("Vui long kiem tra lai email"); return; }
    if (pw.length < 6) { setError("Mat khau toi thieu 6 ky tu"); return; }
    if (pw !== confirm) { setError("Mat khau xac nhan khong khop"); return; }
    setLoading(true);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password: pw }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error ?? "Loi dang ky"); setLoading(false); return; }
    await signIn("credentials", { email, password: pw, callbackUrl: "/" });
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8"
      style={{ background: "linear-gradient(135deg, #0f0f1a 0%, #1a0a2e 60%, #0f0f1a 100%)" }}>
      <div className="absolute w-96 h-96 rounded-full blur-3xl opacity-20 pointer-events-none"
        style={{ backgroundColor: "var(--accent)", top: "10%", left: "50%", transform: "translateX(-50%)" }} />

      <div className="w-full max-w-sm relative">
        <div className="text-center mb-7">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg"
            style={{ backgroundColor: "var(--accent)" }}>
            <i className="ti ti-headphones text-white" style={{ fontSize: 26 }} />
          </div>
          <h1 className="text-2xl font-bold text-white">Tao tai khoan</h1>
          <p className="text-gray-400 text-sm mt-1">
            Da co tai khoan?{" "}
            <Link href="/login" className="font-medium hover:underline" style={{ color: "var(--accent)" }}>
              Dang nhap
            </Link>
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 p-6 backdrop-blur-sm"
          style={{ backgroundColor: "rgba(17,17,34,0.85)" }}>

          {/* Google */}
          <button onClick={() => signIn("google", { callbackUrl: "/" })}
            className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl border border-white/20 text-white text-sm font-medium hover:bg-white/5 transition-colors mb-4">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
              <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
            </svg>
            Dang ky voi Google
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-xs text-gray-500">hoac</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          <form onSubmit={submit} className="space-y-3">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Ten hien thi</label>
              <div className="relative">
                <i className="ti ti-user absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" style={{ fontSize: 16 }} />
                <input type="text" value={name} onChange={e => setName(e.target.value)}
                  placeholder="Nguyen Van A"
                  className="w-full pl-9 pr-3 py-2.5 text-sm text-white placeholder-gray-500 rounded-xl border border-white/10 bg-white/5 focus:outline-none focus:ring-2 focus:border-transparent"
                  style={{ "--tw-ring-color": "var(--accent)" } as any} />
              </div>
            </div>

            {/* Email with live check */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
              <div className="relative">
                <i className="ti ti-mail absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" style={{ fontSize: 16 }} />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  placeholder="ban@example.com"
                  className={`w-full pl-9 pr-9 py-2.5 text-sm text-white placeholder-gray-500 rounded-xl border bg-white/5 focus:outline-none focus:ring-2 focus:border-transparent transition-colors ${
                    emailError ? "border-rose-500/60" : email && !emailError && !emailChecking ? "border-teal-500/60" : "border-white/10"
                  }`}
                  style={{ "--tw-ring-color": "var(--accent)" } as any} />
                {/* Status icon */}
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {emailChecking && <i className="ti ti-loader-2 animate-spin text-gray-400" style={{ fontSize: 15 }} />}
                  {!emailChecking && email && !emailError && email.includes("@") && (
                    <i className="ti ti-circle-check text-teal-400" style={{ fontSize: 15 }} />
                  )}
                  {!emailChecking && emailError && (
                    <i className="ti ti-circle-x text-rose-400" style={{ fontSize: 15 }} />
                  )}
                </div>
              </div>
              {emailError && (
                <p className="text-xs text-rose-400 mt-1 flex items-center gap-1">
                  <i className="ti ti-alert-circle" style={{ fontSize: 12 }} />
                  {emailError}
                </p>
              )}
            </div>

            {/* Password with toggle */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Mat khau</label>
              <div className="relative">
                <i className="ti ti-lock absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" style={{ fontSize: 16 }} />
                <input
                  type={showPw ? "text" : "password"}
                  value={pw} onChange={e => setPw(e.target.value)} required
                  placeholder="It nhat 6 ky tu"
                  className="w-full pl-9 pr-10 py-2.5 text-sm text-white placeholder-gray-500 rounded-xl border border-white/10 bg-white/5 focus:outline-none focus:ring-2 focus:border-transparent"
                  style={{ "--tw-ring-color": "var(--accent)" } as any} />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 transition-colors" tabIndex={-1}>
                  <i className={`ti ${showPw ? "ti-eye-off" : "ti-eye"}`} style={{ fontSize: 17 }} />
                </button>
              </div>
              {/* Password strength indicator */}
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

            {/* Confirm password with toggle */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Xac nhan mat khau</label>
              <div className="relative">
                <i className="ti ti-lock-check absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" style={{ fontSize: 16 }} />
                <input
                  type={showConfirm ? "text" : "password"}
                  value={confirm} onChange={e => setConfirm(e.target.value)} required
                  placeholder="Nhap lai mat khau"
                  className={`w-full pl-9 pr-10 py-2.5 text-sm text-white placeholder-gray-500 rounded-xl border bg-white/5 focus:outline-none focus:ring-2 focus:border-transparent transition-colors ${
                    pwMatch ? "border-rose-500/60" : confirm && !pwMatch ? "border-teal-500/60" : "border-white/10"
                  }`}
                  style={{ "--tw-ring-color": "var(--accent)" } as any} />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 transition-colors" tabIndex={-1}>
                  <i className={`ti ${showConfirm ? "ti-eye-off" : "ti-eye"}`} style={{ fontSize: 17 }} />
                </button>
              </div>
              {pwMatch && (
                <p className="text-xs text-rose-400 mt-1 flex items-center gap-1">
                  <i className="ti ti-alert-circle" style={{ fontSize: 12 }} />
                  Mat khau khong khop
                </p>
              )}
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl px-3 py-2">
                <i className="ti ti-alert-circle flex-shrink-0" style={{ fontSize: 15 }} />
                {error}
              </div>
            )}

            <button type="submit" disabled={loading || !!emailError || pwMatch}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-white text-sm transition-all hover:opacity-90 disabled:opacity-60 mt-1"
              style={{ backgroundColor: "var(--accent)" }}>
              {loading
                ? <><i className="ti ti-loader-2 animate-spin" style={{ fontSize: 16 }} />Dang tao tai khoan...</>
                : <><i className="ti ti-user-plus" style={{ fontSize: 16 }} />Tao tai khoan</>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
