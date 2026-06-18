"use client";
import ThemeSettings from "@/components/theme/ThemeSettings";

interface Props {
  user: { name: string | null; email: string } | null | undefined;
}

export default function ThemeSettingsClient({ user }: Props) {
  return (
    <div className="space-y-5">
      {/* Appearance */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center gap-2 mb-5">
          <i className="ti ti-palette text-gray-500 dark:text-gray-400" style={{ fontSize: 20 }} />
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Giao diện & Màu sắc</h2>
        </div>
        <ThemeSettings />
      </div>

      {/* Account info */}
      {user && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-2 mb-4">
            <i className="ti ti-user text-gray-500 dark:text-gray-400" style={{ fontSize: 20 }} />
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">Tài khoản</h2>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Tên hiển thị</span>
              <span className="font-medium text-gray-800 dark:text-gray-200">{user.name ?? "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Email</span>
              <span className="font-medium text-gray-800 dark:text-gray-200">{user.email}</span>
            </div>
          </div>
        </div>
      )}

      <p className="text-xs text-center text-gray-400 dark:text-gray-600 pb-4">
        Cài đặt được lưu tự động trên trình duyệt này
      </p>
    </div>
  );
}