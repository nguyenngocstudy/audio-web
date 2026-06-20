"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import NotificationBell from "./NotificationBell";
import ThemeToggle from "@/components/theme/ThemeToggle";

interface Me { isAdmin: boolean; email: string; name?: string | null; coinBalance: number; }

export default function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [me, setMe]     = useState<Me | null>(null);

  useEffect(() => {
    if (session?.user?.id) fetch("/api/me").then(r => r.json()).then(setMe);
    else setMe(null);
  }, [session?.user?.id]);

  const navLinks = [
    { href: "/",          label: "Trang chủ", icon: "ti-home"   },
    { href: "/community", label: "Cộng đồng", icon: "ti-users"  },
    { href: "/vip",       label: "VIP",        icon: "ti-crown"  },
  ];

  return (
    <nav className="sticky top-0 z-30 border-b border-white/8"
      style={{ backgroundColor: "rgba(10,10,15,0.92)", backdropFilter: "blur(12px)" }}>
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 flex-shrink-0">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: "var(--accent)" }}>
            <i className="ti ti-headphones text-white" style={{ fontSize: 16 }} />
          </div>
          <span className="font-semibold text-white hidden sm:block">Truyện Audio</span>
        </Link>

        {/* Nav links - desktop */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map(link => (
            <Link key={link.href} href={link.href}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                pathname === link.href
                  ? "text-white font-medium"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
              style={pathname === link.href ? { color: "var(--accent)" } : {}}>
              <i className={`ti ${link.icon}`} style={{ fontSize: 15 }} />
              {link.label}
              {link.href === "/vip" && (
                <span className="text-xs bg-amber-500 text-black font-bold px-1 py-0.5 rounded-md leading-none">HOT</span>
              )}
            </Link>
          ))}
        </div>

        {/* Search */}
        <div className="flex-1 max-w-xs hidden sm:block">
          <div className="relative">
            <i className="ti ti-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" style={{ fontSize: 14 }} />
            <input placeholder="Tìm truyện..."
              className="w-full pl-8 pr-3 py-1.5 text-sm bg-white/5 border border-white/10 text-gray-200 placeholder-gray-600 rounded-full focus:outline-none focus:border-white/20 focus:bg-white/8 transition-all" />
          </div>
        </div>

        {/* Right: ThemeToggle + Bell + Avatar */}
        <div className="flex items-center gap-1.5">
          <ThemeToggle />

          {session && <NotificationBell />}

          {session ? (
            <div className="relative">
              <button onClick={() => setOpen(!open)}
                className="flex items-center gap-2 hover:bg-white/5 rounded-lg px-2 py-1 transition-colors">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold text-white"
                  style={{ backgroundColor: "var(--accent)" }}>
                  {(session.user.name ?? session.user.email ?? "U")[0].toUpperCase()}
                </div>
                <span className="text-sm text-gray-300 hidden sm:block max-w-[90px] truncate">
                  {session.user.name ?? session.user.email}
                </span>
                {me?.isAdmin && (
                  <span className="hidden sm:block text-xs font-bold text-black bg-amber-400 px-1.5 py-0.5 rounded">
                    Admin
                  </span>
                )}
                <i className="ti ti-chevron-down text-gray-500" style={{ fontSize: 12 }} />
              </button>

              {open && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
                  <div className="absolute right-0 top-10 w-52 rounded-xl border border-white/10 shadow-2xl py-1 z-50 overflow-hidden"
                    style={{ backgroundColor: "rgba(15,15,26,0.98)", backdropFilter: "blur(12px)" }}>
                    {me?.isAdmin && (
                      <>
                        <Link href="/admin" onClick={() => setOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium"
                          style={{ color: "var(--accent)", backgroundColor: "var(--accent-light)" }}>
                          <i className="ti ti-layout-dashboard" style={{ fontSize: 15 }} />
                          Admin Panel
                        </Link>
                        <div className="h-px bg-white/8 my-1" />
                      </>
                    )}
                    {[
                      { href: "/profile",   icon: "ti-user",    label: "Tài khoản"    },
                      { href: "/history",   icon: "ti-history", label: "Lịch sử nghe" },
                      { href: "/community", icon: "ti-users",   label: "Cộng đồng"    },
                      { href: "/vip",       icon: "ti-crown",   label: "Nâng cấp VIP" },
                      { href: "/settings",  icon: "ti-palette", label: "Giao diện"    },
                    ].map(item => (
                      <Link key={item.href} href={item.href} onClick={() => setOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors">
                        <i className={`ti ${item.icon}`} style={{ fontSize: 15 }} />{item.label}
                      </Link>
                    ))}
                    {/* {me && (
                      <div className="px-4 py-2 border-t border-white/8 mt-1">
                        <p className="text-xs text-gray-500">Số dư</p>
                        <p className="text-sm font-semibold text-amber-400">{} coin</p>
                      </div>
                    )} */}
                    <div className="h-px bg-white/8 my-1" />
                    <button onClick={() => signOut({ callbackUrl: "/login" })}
                      className="flex items-center gap-2.5 px-4 py-2 text-sm text-rose-400 hover:bg-rose-500/10 w-full transition-colors">
                      <i className="ti ti-logout" style={{ fontSize: 15 }} />Đăng xuất
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login" className="text-sm text-gray-400 hover:text-white px-3 py-1.5 transition-colors">
                Đăng nhập
              </Link>
              <Link href="/register"
                className="text-sm text-white px-3 py-1.5 rounded-lg font-medium transition-all hover:opacity-90"
                style={{ backgroundColor: "var(--accent)" }}>
                Đăng ký
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Mobile nav */}
      <div className="md:hidden flex items-center gap-1 px-4 pb-2 overflow-x-auto scrollbar-hide">
        {navLinks.map(link => (
          <Link key={link.href} href={link.href}
            className={`flex-shrink-0 flex items-center gap-1 px-3 py-1 rounded-full text-xs transition-colors ${
              pathname === link.href
                ? "text-white font-medium"
                : "text-gray-500 hover:text-gray-300"
            }`}
            style={pathname === link.href ? { color: "var(--accent)" } : {}}>
            <i className={`ti ${link.icon}`} style={{ fontSize: 13 }} />
            {link.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
