"use client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
const fmt = (v: number) => v >= 1e6 ? `${(v / 1e6).toFixed(1)}M` : v >= 1e3 ? `${(v / 1e3).toFixed(0)}K` : String(v);
export default function RevenueChart({ data }: { data: { month: string; revenue: number }[] }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <p className="text-sm font-medium text-gray-900 mb-1">Doanh thu theo tháng</p>
      <p className="text-xs text-gray-400 mb-4">7 tháng gần nhất (VNĐ)</p>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} barSize={26}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
          <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
          <YAxis tickFormatter={fmt} tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} width={40} />
          <Tooltip formatter={(v: number) => [v.toLocaleString("vi-VN") + "đ", "Doanh thu"]}
            contentStyle={{ border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 12 }} />
          <Bar dataKey="revenue" fill="#7c3aed" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
