import Navbar from "@/components/layout/Navbar";
import SocialFloating from "@/components/layout/SocialFloating";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "rgb(10 10 15)" }}>
      <Navbar />
      <SocialFloating />
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6">
        {children}
      </main>
      <footer className="border-t border-white/5 py-6 mt-8">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ backgroundColor: "var(--accent)" }}>
              <i className="ti ti-headphones text-white" style={{ fontSize: 12 }} />
            </div>
            <span className="text-sm font-semibold text-gray-400">Truyện Audio</span>
          </div>
          <div className="flex items-center gap-5 text-xs text-gray-600">
            <span>© 2024 Truyện Audio</span>
            <a href="#" className="hover:text-gray-400 transition-colors">Điều khoản</a>
            <a href="#" className="hover:text-gray-400 transition-colors">Bảo mật</a>
            <a href="#" className="hover:text-gray-400 transition-colors">Liên hệ</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
