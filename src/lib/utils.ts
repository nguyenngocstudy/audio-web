import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }
export const fmtVnd = (n: number) => n.toLocaleString("vi-VN") + "đ";
export const fmtDate = (d: string | Date | null | undefined) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("vi-VN", { day:"2-digit", month:"2-digit", year:"numeric" });
};
export const fmtDateTime = (d: string | Date | null | undefined) => {
  if (!d) return "—";
  return new Date(d).toLocaleString("vi-VN", { day:"2-digit", month:"2-digit", hour:"2-digit", minute:"2-digit" });
};
export const fmtDuration = (sec: number) => {
  const m = Math.floor(sec / 60), s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
};
export const GENRE_LABEL: Record<string, string> = {
  tinh_cam: "Tình cảm", ngon_tinh: "Ngôn tình", co_dai: "Cổ đại",
  huyen_huyen: "Huyền huyễn", tram_cam: "Trầm cảm", hanh_dong: "Hành động",
};
export const TX_TYPE_LABEL: Record<string, string> = {
  subscription: "Gói VIP", coin_topup: "Nạp coin", chapter_unlock: "Mở chương",
};
