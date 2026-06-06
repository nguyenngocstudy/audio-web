import Link from "next/link";
export default function VipSuccessPage() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <i className="ti ti-check text-teal-600" style={{ fontSize: 32 }} />
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Thanh toán thành công!</h1>
        <p className="text-gray-500 text-sm mb-6">Tài khoản đã được kích hoạt. Hãy tận hưởng nghe truyện không giới hạn.</p>
        <Link href="/" className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors">
          <i className="ti ti-headphones" style={{ fontSize: 16 }} />Nghe truyện ngay
        </Link>
      </div>
    </div>
  );
}
