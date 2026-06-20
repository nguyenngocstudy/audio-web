"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type ThemeMode = "dark" | "light" |  "system";

export const ACCENT_COLORS = [
  { name: "Tím (mặc định)", value: "#7c3aed", tw: "violet"  },
  { name: "Xanh dương",     value: "#2563eb", tw: "blue"    },
  { name: "Hồng",           value: "#db2777", tw: "pink"    },
  { name: "Đỏ",             value: "#dc2626", tw: "red"     },
  { name: "Cam",            value: "#ea580c", tw: "orange"  },
  { name: "Vàng",           value: "#ca8a04", tw: "yellow"  },
  { name: "Xanh lá",        value: "#16a34a", tw: "green"   },
  { name: "Teal",           value: "#0d9488", tw: "teal"    },
  { name: "Hồng đậm",       value: "#9d174d", tw: "rose"    },
  { name: "Chàm",           value: "#4338ca", tw: "indigo"  },
] as const;

interface ThemeCtx {
  mode:        ThemeMode;
  accentColor: string;
  setMode:        (m: ThemeMode)  => void;
  setAccentColor: (c: string)     => void;
}

const Ctx = createContext<ThemeCtx>({
  mode: "dark", accentColor: "#7c3aed",
  setMode: () => {}, setAccentColor: () => {},
});

export function useTheme() { return useContext(Ctx); }

// Chuyển hex → RGB components "r g b"
function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r} ${g} ${b}`;
}

// Tạo shade tối hơn/sáng hơn từ hex
function shadeHex(hex: string, factor: number) {
  const r = Math.min(255, Math.max(0, Math.round(parseInt(hex.slice(1,3),16) * factor)));
  const g = Math.min(255, Math.max(0, Math.round(parseInt(hex.slice(3,5),16) * factor)));
  const b = Math.min(255, Math.max(0, Math.round(parseInt(hex.slice(5,7),16) * factor)));
  return `#${r.toString(16).padStart(2,"0")}${g.toString(16).padStart(2,"0")}${b.toString(16).padStart(2,"0")}`;
}

function applyAccent(hex: string) {
  const root = document.documentElement;
  root.style.setProperty("--accent",        hex);
  root.style.setProperty("--accent-rgb",    hexToRgb(hex));
  root.style.setProperty("--accent-hover",  shadeHex(hex, 0.85));
  root.style.setProperty("--accent-light",  shadeHex(hex, 1.6) + "33"); // ~20% opacity
  root.style.setProperty("--accent-text",   shadeHex(hex, 0.7));
}

function applyMode(mode: ThemeMode) {
  const root = document.documentElement;
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const isDark = mode === "dark" || (mode === "system" && prefersDark);
  root.classList.toggle("dark", isDark);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode,        setModeState]  = useState<ThemeMode>("dark");
  const [accentColor, setAccentState] = useState("#7c3aed");

  // Khởi tạo từ localStorage
  useEffect(() => {
    const savedMode   = (localStorage.getItem("theme-mode") as ThemeMode) || "dark";
    const savedAccent = localStorage.getItem("theme-accent") || "#7c3aed";
    setModeState(savedMode);
    setAccentState(savedAccent);
    applyMode(savedMode);
    applyAccent(savedAccent);
  }, []);

  function setMode(m: ThemeMode) {
    setModeState(m);
    localStorage.setItem("theme-mode", m);
    applyMode(m);
  }

  function setAccentColor(c: string) {
    setAccentState(c);
    localStorage.setItem("theme-accent", c);
    applyAccent(c);
  }

  return (
    <Ctx.Provider value={{ mode, accentColor, setMode, setAccentColor }}>
      {children}
    </Ctx.Provider>
  );
}