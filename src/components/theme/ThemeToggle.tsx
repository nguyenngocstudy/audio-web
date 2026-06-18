"use client";
import { useTheme } from "./ThemeProvider";

export default function ThemeToggle() {
  const { mode, setMode } = useTheme();

  const cycle = () => {
    const next = mode === "light" ? "dark" : mode === "dark" ? "system" : "light";
    setMode(next);
  };

  const icon  = mode === "light" ? "ti-sun"  : mode === "dark" ? "ti-moon" : "ti-device-laptop";
  const label = mode === "light" ? "Sáng"    : mode === "dark" ? "Tối"     : "Hệ thống";

  return (
    <button onClick={cycle}
      title={`Chế độ: ${label}`}
      className="flex items-center justify-center w-8 h-8 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
      <i className={`ti ${icon}`} style={{ fontSize: 18 }} />
    </button>
  );
}