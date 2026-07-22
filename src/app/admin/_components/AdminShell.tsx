"use client";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import AdminSidebar from "./AdminSidebar";

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => { setOpen(false); }, [pathname]);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Desktop sidebar — always visible */}
      <div className="hidden md:block">
        <AdminSidebar />
      </div>

      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-40 bg-black/40 md:hidden" onClick={() => setOpen(false)} />
      )}

      {/* Mobile sidebar — slide in */}
      <div className={`fixed inset-y-0 left-0 z-50 w-60 transform transition-transform duration-200 ease-in-out md:hidden ${open ? "translate-x-0" : "-translate-x-full"}`}>
        <AdminSidebar />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 md:ml-60">
        {/* Mobile top bar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-white md:hidden">
          <button onClick={() => setOpen(true)}
            className="flex items-center justify-center w-9 h-9 rounded-lg hover:bg-gray-100 transition-colors">
            <i className="ti ti-menu-2 text-gray-600" style={{ fontSize: 20 }} />
          </button>
          <p className="text-sm font-semibold text-gray-800">Admin Panel</p>
        </div>

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
