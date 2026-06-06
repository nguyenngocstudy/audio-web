"use client";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
export default function UserChart({ data }: { data: { day: string; new_users: number }[] }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <p className="text-sm font-medium text-gray-900 mb-1">User mới mỗi ngày</p>
      <p className="text-xs text-gray-400 mb-4">14 ngày gần nhất</p>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
          <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
          <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} width={28} />
          <Tooltip formatter={(v: number) => [v + " users", "Đăng ký mới"]}
            contentStyle={{ border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 12 }} />
          <Line type="monotone" dataKey="new_users" stroke="#0d9488" strokeWidth={2}
            dot={{ r: 3, fill: "#0d9488" }} activeDot={{ r: 5 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
