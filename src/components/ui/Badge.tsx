import { cn } from "@/lib/utils";

type V = "success" | "warning" | "danger" | "info" | "neutral" | "vip";
const S: Record<V, string> = {
  success: "bg-teal-50 text-teal-700",
  warning: "bg-amber-50 text-amber-700",
  danger:  "bg-rose-50 text-rose-700",
  info:    "bg-blue-50 text-blue-700",
  neutral: "bg-gray-100 text-gray-600",
  vip:     "bg-gradient-to-r from-amber-400 to-orange-400 text-white",
};

export default function Badge({
  children, variant = "neutral", className,
}: { children: React.ReactNode; variant?: V; className?: string }) {
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium", S[variant], className)}>
      {children}
    </span>
  );
}
