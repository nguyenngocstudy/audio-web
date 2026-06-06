import Navbar from "@/components/layout/Navbar";
export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-6">{children}</main>
      <footer className="border-t border-gray-100 py-4 text-center text-xs text-gray-400">
        © 2024 Truyện Audio ·{" "}
        <a href="#" className="hover:underline">Điều khoản</a> ·{" "}
        <a href="#" className="hover:underline">Liên hệ</a>
      </footer>
    </div>
  );
}
