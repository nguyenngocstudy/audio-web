"use client";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { PLANS, type PlanKey } from "@/lib/payos";
import { fmtVnd } from "@/lib/utils";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

const PLAN_ITEMS: { key: PlanKey; icon: string; highlight?: boolean; perks: string[] }[] = [
  { key: "coin100", icon: "ti-coin",  perks: ["100 coin", "Mua lẻ từng chương", "Không hết hạn"] },
  { key: "monthly", icon: "ti-star",  highlight: true, perks: ["VIP 30 ngày", "Nghe không giới hạn", "Tất cả thể loại", "Không quảng cáo"] },
  { key: "coin500", icon: "ti-coins", perks: ["500 coin", "Tiết kiệm 11%", "Không hết hạn"] },
  { key: "yearly",  icon: "ti-crown", perks: ["VIP 365 ngày", "Tiết kiệm 32%", "Nghe không giới hạn", "Ưu tiên hỗ trợ"] },
];

export default function VipPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState<PlanKey | null>(null);

  async function checkout(planKey: PlanKey) {
    if (!session) { router.push("/login?next=/vip"); return; }
    setLoading(planKey);
    const res = await fetch("/api/payos/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planKey }),
    });
    const data = await res.json();
    setLoading(null);
    if (data.checkoutUrl) window.location.href = data.checkoutUrl;
    else alert("Lỗi tạo thanh toán, thử lại sau.");
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <Badge variant="vip" className="mb-3">✦ VIP</Badge>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Nâng cấp để nghe không giới hạn</h1>
        <p className="text-gray-500">Thanh toán qua QR ngân hàng, kích hoạt ngay lập tức</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {PLAN_ITEMS.map(({ key, icon, highlight, perks }) => {
          const plan = PLANS[key];
          return (
            <div key={key}
              className={`relative rounded-2xl border-2 p-6 ${highlight ? "border-brand-500 bg-brand-50" : "border-gray-200 bg-white"}`}>
              {highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-brand-600 text-white text-xs font-semibold px-3 py-1 rounded-full">Phổ biến nhất</span>
                </div>
              )}
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${highlight ? "bg-brand-600 text-white" : "bg-gray-100 text-gray-600"}`}>
                  <i className={`ti ${icon}`} style={{ fontSize: 20 }} />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{plan.label}</p>
                  <p className="text-xl font-bold text-gray-900">{fmtVnd(plan.price)}</p>
                </div>
              </div>
              <ul className="space-y-2 mb-5">
                {perks.map(p => (
                  <li key={p} className="flex items-center gap-2 text-sm text-gray-600">
                    <i className="ti ti-check text-teal-500" style={{ fontSize: 15 }} />{p}
                  </li>
                ))}
              </ul>
              <Button variant={highlight ? "primary" : "secondary"} className="w-full"
                loading={loading === key} onClick={() => checkout(key)}>
                <i className="ti ti-qrcode" style={{ fontSize: 15 }} />Thanh toán QR
              </Button>
            </div>
          );
        })}
      </div>

      <div className="mt-6 bg-gray-50 rounded-xl p-4 flex items-start gap-3">
        <i className="ti ti-shield-check text-teal-500 mt-0.5" style={{ fontSize: 20 }} />
        <div className="text-sm text-gray-500">
          <p className="font-medium text-gray-700 mb-0.5">Thanh toán an toàn qua PayOS</p>
          Hỗ trợ tất cả app ngân hàng Việt Nam. Kích hoạt tự động sau khi thanh toán thành công.
        </div>
      </div>
    </div>
  );
}
