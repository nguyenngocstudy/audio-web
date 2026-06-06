"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

export default function LoginPage() {
  const router = useRouter();
  const next = useSearchParams().get("next") ?? "/";
  const [email, setEmail]     = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    debugger
    e.preventDefault(); setError(""); setLoading(true);
    const res = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (res?.error) setError("Email hoặc mật khẩu không đúng");
    else { router.push(next); router.refresh(); }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-brand-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <i className="ti ti-headphones text-white" style={{ fontSize: 22 }} />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Đăng nhập</h1>
          <p className="text-sm text-gray-500 mt-1">
            Chưa có tài khoản?{" "}
            <Link href="/register" className="text-brand-600 hover:underline">Đăng ký</Link>
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <form onSubmit={submit} className="space-y-4">
            <Input label="Email" type="email" icon="ti-mail" value={email}
              onChange={e => setEmail(e.target.value)} placeholder="ban@example.com" required />
            <Input label="Mật khẩu" type="password" icon="ti-lock" value={password}
              onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
            {error && <p className="text-sm text-rose-500 bg-rose-50 rounded-lg px-3 py-2">{error}</p>}
            <Button type="submit" className="w-full" loading={loading}>Đăng nhập</Button>
          </form>
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100" /></div>
            <div className="relative flex justify-center"><span className="bg-white px-3 text-xs text-gray-400">hoặc</span></div>
          </div>
          <Button variant="secondary" className="w-full" onClick={() => signIn("google", { callbackUrl: next })}>
            <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
              <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
            </svg>
            Tiếp tục với Google
          </Button>
        </div>
      </div>
    </div>
  );
}
