"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

export default function RegisterPage() {
  const [name, setName]       = useState("");
  const [email, setEmail]     = useState("");
  const [pw, setPw]           = useState("");
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setError(""); setLoading(true);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password: pw }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error ?? "Lỗi đăng ký"); setLoading(false); return; }
    await signIn("credentials", { email, password: pw, callbackUrl: "/" });
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-brand-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <i className="ti ti-headphones text-white" style={{ fontSize: 22 }} />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Tạo tài khoản</h1>
          <p className="text-sm text-gray-500 mt-1">
            Đã có tài khoản?{" "}
            <Link href="/login" className="text-brand-600 hover:underline">Đăng nhập</Link>
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <form onSubmit={submit} className="space-y-4">
            <Input label="Tên hiển thị" icon="ti-user" value={name}
              onChange={e => setName(e.target.value)} placeholder="Nguyễn Văn A" />
            <Input label="Email" type="email" icon="ti-mail" value={email}
              onChange={e => setEmail(e.target.value)} placeholder="ban@example.com" required />
            <Input label="Mật khẩu" type="password" icon="ti-lock" value={pw}
              onChange={e => setPw(e.target.value)} placeholder="Ít nhất 6 ký tự" required />
            {error && <p className="text-sm text-rose-500 bg-rose-50 rounded-lg px-3 py-2">{error}</p>}
            <Button type="submit" className="w-full" loading={loading}>Tạo tài khoản</Button>
          </form>
        </div>
      </div>
    </div>
  );
}
