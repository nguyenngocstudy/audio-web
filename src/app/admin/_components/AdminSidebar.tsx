"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

const NAV = [
  { href: "/admin",               icon: "ti-layout-dashboard", label: "Tổng quan"     },
  { href: "/admin/stories",       icon: "ti-book",             label: "Truyện"         },
  { href: "/admin/chapters",      icon: "ti-file-text",        label: "Chương"         },
  { href: "/admin/users",         icon: "ti-users",            label: "Người dùng"     },
  { href: "/admin/transactions",  icon: "ti-credit-card",      label: "Giao dịch"      },
  { href: "/admin/settings",      icon: "ti-settings",         label: "Cài đặt"        },
];

export default function AdminSidebar() {
  const path = usePathname();
  return (
    <aside className="fixed left-0 top-0 h-full w-60 bg-white border-r border-gray-100 flex flex-col z-40">
      <div className="px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
            <i className="ti ti-headphones text-white" style={{ fontSize: 16 }} />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">Truyện Audio</p>
            <p className="text-xs text-gray-400">Admin Panel</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        {NAV.map(item => {
          const active = item.href === "/admin" ? path === "/admin" : path.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${active ? "bg-brand-50 text-brand-700 font-medium" : "text-gray-600 hover:bg-gray-50"}`}>
              <i className={`ti ${item.icon}`} style={{ fontSize: 17 }} aria-hidden />{item.label}
            </Link>
          );
        })}
      </nav>
      <div className="px-3 py-3 border-t border-gray-100">
        <button onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-500 hover:bg-rose-50 hover:text-rose-600 w-full transition-colors">
          <i className="ti ti-logout" style={{ fontSize: 17 }} />Đăng xuất
        </button>
      </div>
    </aside>
  );
}
