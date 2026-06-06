"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";

export default function Navbar() {
  const { data: session } = useSession();
  const [open, setOpen]   = useState(false);

  return (
    <nav className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-gray-100">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
            <i className="ti ti-headphones text-white" style={{ fontSize: 16 }} />
          </div>
          <span className="font-semibold text-gray-900 hidden sm:block">Truyện Audio</span>
        </Link>

        <div className="flex-1 max-w-xs mx-4 hidden sm:block">
          <div className="relative">
            <i className="ti ti-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" style={{ fontSize: 14 }} />
            <input placeholder="Tìm truyện..." className="w-full pl-8 pr-3 py-1.5 text-sm bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-brand-400" />
          </div>
        </div>

        <div className="flex items-center gap-3">
          {session ? (
            <div className="relative">
              <button onClick={() => setOpen(!open)}
                className="flex items-center gap-2 hover:bg-gray-50 rounded-lg px-2 py-1 transition-colors">
                <div className="w-7 h-7 rounded-full bg-brand-100 flex items-center justify-center text-xs font-semibold text-brand-700">
                  {session.user.name?.[0]?.toUpperCase() ?? "U"}
                </div>
                <span className="text-sm text-gray-700 hidden sm:block max-w-[100px] truncate">
                  {session.user.name ?? session.user.email}
                </span>
                <i className="ti ti-chevron-down text-gray-400" style={{ fontSize: 13 }} />
              </button>
              {open && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
                  <div className="absolute right-0 top-10 w-48 bg-white rounded-xl border border-gray-100 shadow-lg py-1 z-50">
                    <Link href="/profile" onClick={() => setOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                      <i className="ti ti-user" style={{ fontSize: 15 }} />Tài khoản
                    </Link>
                    <Link href="/history" onClick={() => setOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                      <i className="ti ti-history" style={{ fontSize: 15 }} />Lịch sử nghe
                    </Link>
                    <Link href="/vip" onClick={() => setOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                      <i className="ti ti-crown" style={{ fontSize: 15 }} />Nâng cấp VIP
                    </Link>
                    <hr className="my-1 border-gray-100" />
                    <button onClick={() => signOut({ callbackUrl: "/login" })}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-rose-500 hover:bg-rose-50 w-full">
                      <i className="ti ti-logout" style={{ fontSize: 15 }} />Đăng xuất
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900 px-3 py-1.5">Đăng nhập</Link>
              <Link href="/register" className="text-sm bg-brand-600 hover:bg-brand-700 text-white px-3 py-1.5 rounded-lg transition-colors">Đăng ký</Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
