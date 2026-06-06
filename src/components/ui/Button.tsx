import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size    = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant; size?: Size; loading?: boolean;
}

const V: Record<Variant, string> = {
  primary:   "bg-brand-600 hover:bg-brand-700 text-white",
  secondary: "border border-gray-200 hover:bg-gray-50 text-gray-700",
  ghost:     "hover:bg-gray-100 text-gray-600",
  danger:    "bg-rose-500 hover:bg-rose-600 text-white",
};
const S: Record<Size, string> = {
  sm: "px-3 py-1.5 text-xs rounded-lg",
  md: "px-4 py-2.5 text-sm rounded-lg",
  lg: "px-6 py-3 text-base rounded-xl",
};

export default function Button({
  variant = "primary", size = "md", loading, className, children, disabled, ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center gap-2 font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed",
        V[variant], S[size], className
      )}
    >
      {loading && <i className="ti ti-loader-2 animate-spin" style={{ fontSize: 14 }} />}
      {children}
    </button>
  );
}
