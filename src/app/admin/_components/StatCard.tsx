type Color = "violet" | "teal" | "amber" | "rose";
const C: Record<Color, string> = {
  violet: "bg-violet-50 text-violet-600", teal: "bg-teal-50 text-teal-600",
  amber:  "bg-amber-50 text-amber-600",   rose: "bg-rose-50 text-rose-600",
};
export default function StatCard({ label, value, sub, growth, icon, color = "violet" }: {
  label: string; value: string | number; sub?: string; growth?: number; icon: string; color?: Color;
}) {
  const up = growth !== undefined && growth >= 0;
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-start justify-between mb-3">
        <p className="text-sm text-gray-500">{label}</p>
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${C[color]}`}>
          <i className={`ti ${icon}`} style={{ fontSize: 18 }} aria-hidden />
        </div>
      </div>
      <p className="text-2xl font-semibold text-gray-900 mb-1">{value}</p>
      <div className="flex items-center gap-2">
        {growth !== undefined && (
          <span className={`flex items-center gap-0.5 text-xs font-medium ${up ? "text-teal-600" : "text-rose-500"}`}>
            <i className={`ti ${up ? "ti-trending-up" : "ti-trending-down"}`} style={{ fontSize: 12 }} />{Math.abs(growth)}%
          </span>
        )}
        {sub && <span className="text-xs text-gray-400">{sub}</span>}
      </div>
    </div>
  );
}
