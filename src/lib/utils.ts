import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

export const fmtVnd = (n: number) => n.toLocaleString("vi-VN") + "đ";

export const fmtDuration = (sec: number) => {
  const m = Math.floor(sec / 60), s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
};

export const GENRE_LABEL: Record<string, string> = {
  ngon_tinh: "Ngôn tình", tra_xanh: "Trà xanh", trong_sinh: "Trọng sinh",  trinh_tham: "Trinh thám", co_dai: "Cổ đại",
  hoc_duong: "Học đường", hai_huoc: "Hài hước", hanh_dong: "Hành động",
};

export const TX_TYPE_LABEL: Record<string, string> = {
  subscription: "Gói VIP", coin_topup: "Nạp coin", chapter_unlock: "Mở chương",
};

// ── Timezone fix ──────────────────────────────────────────────────────────────
// Neon trả về timestamp KHÔNG có timezone suffix: "2026-06-09 01:38:02.9"
// JS parse string không có Z → hiểu là LOCAL time → cộng thêm 7h → SAI
// Fix: append Z để force parse as UTC

function toUTCDate(d: string | Date | null | undefined): Date | null {
  if (!d) return null;
  if (d instanceof Date) return isNaN(d.getTime()) ? null : d;
  const s = d.toString().trim();
  // Check if already has timezone info (Z, +07:00, -05:00, etc.)
  const hasTimezone = s.endsWith("Z") ||
    /[+-]\d{2}:\d{2}$/.test(s) ||
    /[+-]\d{4}$/.test(s);
  // Replace space with T for ISO format, append Z if no tz info
  const iso = (hasTimezone ? s : s.replace(" ", "T") + "Z");
  const date = new Date(iso);
  return isNaN(date.getTime()) ? null : date;
}

// Format date in Vietnam timezone (GMT+7)
export const fmtDate = (d: string | Date | null | undefined): string => {
  const date = toUTCDate(d);
  if (!date) return "—";
  return date.toLocaleDateString("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    day: "2-digit", month: "2-digit", year: "numeric",
  });
};

export const fmtDateTime = (d: string | Date | null | undefined): string => {
  const date = toUTCDate(d);
  if (!date) return "—";
  return date.toLocaleString("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    day: "2-digit", month: "2-digit",
    hour: "2-digit", minute: "2-digit",
  });
};

export const fmtDateFull = (d: string | Date | null | undefined): string => {
  const date = toUTCDate(d);
  if (!date) return "—";
  return date.toLocaleString("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
};

// timeAgo — tính khoảng cách thời gian, tự động đúng timezone
// vì Date.now() và date.getTime() đều là UTC ms → diff luôn đúng
export function timeAgoVN(d: string | Date | null | undefined): string {
  const date = toUTCDate(d);
  if (!date) return "";
  const diff = (Date.now() - date.getTime()) / 1000;
  if (diff < 0)        return "Vừa xong";
  if (diff < 5)        return "Vừa xong";
  if (diff < 60)       return `${Math.floor(diff)} giây trước`;
  if (diff < 3600)     return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400)    return `${Math.floor(diff / 3600)} giờ trước`;
  if (diff < 2592000)  return `${Math.floor(diff / 86400)} ngày trước`;
  if (diff < 31536000) return `${Math.floor(diff / 2592000)} tháng trước`;
  return `${Math.floor(diff / 31536000)} năm trước`;
}

// Alias for backward compat
export const fmtDateVN     = fmtDate;
export const fmtDateTimeVN = fmtDateTime;
export const fmtTimeVN     = (d: string | Date | null | undefined): string => {
  const date = toUTCDate(d);
  if (!date) return "—";
  return date.toLocaleTimeString("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh", hour: "2-digit", minute: "2-digit",
  });
};
