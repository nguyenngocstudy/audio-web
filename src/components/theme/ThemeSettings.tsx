"use client";
import { useTheme, ACCENT_COLORS, type ThemeMode } from "./ThemeProvider";

const MODES: { value: ThemeMode; icon: string; label: string }[] = [
  { value: "dark",   icon: "ti-moon",            label: "Tối"       },
  { value: "light",  icon: "ti-sun",            label: "Sáng"      },
  { value: "system", icon: "ti-device-laptop",   label: "Hệ thống"  },
];

export default function ThemeSettings() {
  const { mode, accentColor, setMode, setAccentColor } = useTheme();

  return (
    <div className="space-y-6">
      {/* Light / Dark / System */}
      <div>
        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">
          Giao diện
        </p>
        <div className="grid grid-cols-3 gap-2">
          {MODES.map(m => (
            <button key={m.value} onClick={() => setMode(m.value)}
              className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                mode === m.value
                  ? "border-[var(--accent)] bg-[var(--accent-light)]"
                  : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
              }`}>
              {/* Preview card */}
              <div className={`w-full h-12 rounded-lg overflow-hidden flex ${
                m.value === "dark" ? "bg-gray-900" :
                m.value === "light" ? "bg-white border border-gray-200" :
                "bg-gradient-to-r from-white to-gray-900"
              }`}>
                <div className="flex-1 flex items-end p-1.5 gap-1">
                  <div className={`h-1.5 flex-1 rounded-full ${m.value === "dark" ? "bg-gray-700" : "bg-gray-200"}`} />
                  <div className={`h-2 w-2 rounded-full ${m.value === "dark" ? "bg-gray-600" : "bg-gray-300"}`} />
                </div>
              </div>
              <i className={`ti ${m.icon} text-sm ${mode === m.value ? "text-[var(--accent)]" : "text-gray-500 dark:text-gray-400"}`}
                 style={{ fontSize: 14 }} />
              <span className={`text-xs font-medium ${mode === m.value ? "text-[var(--accent)]" : "text-gray-600 dark:text-gray-400"}`}>
                {m.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Accent color */}
      <div>
        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1">
          Màu chủ đạo
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">
          Ảnh hưởng đến nút, link, và các điểm nhấn trên toàn app
        </p>
        <div className="grid grid-cols-5 gap-2">
          {ACCENT_COLORS.map(c => (
            <button key={c.value} onClick={() => setAccentColor(c.value)}
              title={c.name}
              className={`relative flex flex-col items-center gap-1.5 p-2 rounded-xl border-2 transition-all ${
                accentColor === c.value
                  ? "border-gray-800 dark:border-white scale-105 shadow-md"
                  : "border-transparent hover:border-gray-200 dark:hover:border-gray-700"
              }`}>
              <div className="w-8 h-8 rounded-full shadow-sm flex items-center justify-center"
                style={{ backgroundColor: c.value }}>
                {accentColor === c.value && (
                  <i className="ti ti-check text-white" style={{ fontSize: 14 }} />
                )}
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400 text-center leading-tight hidden sm:block">
                {c.name.split(" ")[0]}
              </span>
            </button>
          ))}
        </div>

        {/* Custom color picker */}
        <div className="mt-3 flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
          <div className="w-8 h-8 rounded-full border-2 border-gray-200 dark:border-gray-600 overflow-hidden flex-shrink-0">
            <input type="color" value={accentColor}
              onChange={e => setAccentColor(e.target.value)}
              className="w-10 h-10 -m-1 cursor-pointer border-none outline-none"
              title="Chọn màu tùy chỉnh" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Màu tùy chỉnh</p>
            <p className="text-xs text-gray-400 font-mono">{accentColor.toUpperCase()}</p>
          </div>
          <button onClick={() => setAccentColor("#7c3aed")}
            className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 px-2 py-1 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
            Reset
          </button>
        </div>
      </div>

      {/* Preview */}
      <div>
        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">Xem trước</p>
        <div className="p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 space-y-3">
          <div className="flex items-center gap-3">
            <button className="px-4 py-1.5 rounded-lg text-sm font-medium text-white"
              style={{ backgroundColor: "var(--accent)" }}>
              Nút chính
            </button>
            <button className="px-4 py-1.5 rounded-lg text-sm font-medium border-2"
              style={{ borderColor: "var(--accent)", color: "var(--accent)" }}>
              Nút phụ
            </button>
          </div>
          <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full w-2/3 rounded-full" style={{ backgroundColor: "var(--accent)" }} />
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Văn bản thường · <span className="font-medium" style={{ color: "var(--accent)" }}>Link màu accent</span>
          </p>
        </div>
      </div>
    </div>
  );
}