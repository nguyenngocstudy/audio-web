import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
// Import Tabler Icons từ npm package thay vì CDN
import "@tabler/icons-webfont/dist/tabler-icons.min.css";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "@/components/theme/ThemeProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "Truyen Audio", template: "%s | Truyen Audio" },
  description: "Nghe truyen tinh cam, ngon tinh, co dai hay nhat",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Truyen Audio" },
};

export const viewport: Viewport = {
  themeColor: "#7c3aed",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        {/* Anti-flash theme script */}
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            try {
              var mode = localStorage.getItem('theme-mode') || 'dark';
              var accent = localStorage.getItem('theme-accent') || '#7c3aed';
              var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
              var isDark = mode === 'dark' || (mode === 'system' && prefersDark);
              if (isDark) document.documentElement.classList.add('dark');
              function hexToRgb(h) {
                return parseInt(h.slice(1,3),16)+' '+parseInt(h.slice(3,5),16)+' '+parseInt(h.slice(5,7),16);
              }
              function shade(h, f) {
                var r=Math.min(255,Math.max(0,Math.round(parseInt(h.slice(1,3),16)*f)));
                var g=Math.min(255,Math.max(0,Math.round(parseInt(h.slice(3,5),16)*f)));
                var b=Math.min(255,Math.max(0,Math.round(parseInt(h.slice(5,7),16)*f)));
                return '#'+(r<16?'0':'')+r.toString(16)+(g<16?'0':'')+g.toString(16)+(b<16?'0':'')+b.toString(16);
              }
              var root = document.documentElement;
              root.style.setProperty('--accent', accent);
              root.style.setProperty('--accent-rgb', hexToRgb(accent));
              root.style.setProperty('--accent-hover', shade(accent, 0.85));
              root.style.setProperty('--accent-light', shade(accent, 1.6) + '33');
              root.style.setProperty('--accent-text', shade(accent, 0.7));
            } catch(e) {}
          })();
        `}} />
      </head>
      <body className={inter.className}>
        <SessionProvider>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
