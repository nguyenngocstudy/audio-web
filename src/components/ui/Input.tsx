import { cn } from "@/lib/utils";
import type { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string; error?: string; icon?: string;
}

export default function Input({ label, error, icon, className, ...props }: InputProps) {
  return (
    <div className="space-y-1">
      {label && <label className="block text-sm font-medium text-gray-700">{label}</label>}
      <div className="relative">
        {icon && (
          <i className={`ti ${icon} absolute left-3 top-1/2 -translate-y-1/2 text-gray-400`}
             style={{ fontSize: 16 }} />
        )}
        <input
          {...props}
          className={cn(
            "w-full py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition",
            icon ? "pl-9 pr-3" : "px-3",
            error ? "border-rose-400" : "border-gray-300",
            className
          )}
        />
      </div>
      {error && <p className="text-xs text-rose-500">{error}</p>}
    </div>
  );
}
