import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?next=/admin");

  const [user] = await db.select({ isAdmin: users.isAdmin }).from(users)
    .where(eq(users.id, session.user.id)).limit(1);
  if (!user?.isAdmin) redirect("/");

  const navItems = [
    { href: "/admin",              icon: "ti-layout-dashboard", label: "Tổng quan"  },
    { href: "/admin/stories",      icon: "ti-book",             label: "Truyện"     },
    { href: "/admin/chapters",     icon: "ti-list",             label: "Chương"     },
    { href: "/admin/comments",     icon: "ti-message-2",        label: "Bình luận"  },
    { href: "/admin/users",        icon: "ti-users",            label: "Người dùng" },
    { href: "/admin/transactions", icon: "ti-credit-card",      label: "Giao dịch"  },
    { href: "/admin/settings",     icon: "ti-settings",         label: "Cài đặt"    },
  ];

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-44 bg-white border-r border-gray-100 flex flex-col flex-shrink-0">
        <div className="p-4 border-b border-gray-100">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: "var(--accent)" }}>
              <i className="ti ti-headphones text-white" style={{ fontSize: 14 }} />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-800">Truyện Audio</p>
              <p className="text-xs text-gray-400">Admin Panel</p>
            </div>
          </Link>
        </div>
        <nav className="flex-1 p-2 space-y-0.5">
          {navItems.map(item => (
            <Link key={item.href} href={item.href}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors">
              <i className={`ti ${item.icon} flex-shrink-0`} style={{ fontSize: 16 }} />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-gray-100">
          <Link href="/" className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-gray-400 hover:text-gray-600 transition-colors">
            <i className="ti ti-arrow-left" style={{ fontSize: 14 }} />
            Về trang chủ
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-6 py-6">{children}</div>
      </main>
    </div>
  );
}
