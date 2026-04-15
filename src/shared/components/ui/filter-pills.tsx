"use client";

import { cn } from "../../utils/cn";

interface FilterPillsProps<T extends string> {
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
  labelFn?: (value: T) => string;
  className?: string;
  ariaLabel?: string;
}

export function FilterPills<T extends string>({
  options,
  value,
  onChange,
  labelFn,
  className,
  ariaLabel = "Filter options",
}: FilterPillsProps<T>) {
  const getLabel = (opt: T) => {
    if (labelFn) return labelFn(opt);
    if (opt === "all") return "All";
    return opt.charAt(0).toUpperCase() + opt.slice(1).replace(/-/g, " ");
  };

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={cn("flex flex-wrap gap-2", className)}
    >
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          aria-pressed={value === opt}
          className={cn(
            "px-4 py-2.5 rounded-full text-sm font-medium transition-colors",
            "focus-visible:ring-2 focus-visible:ring-dao-gold focus-visible:outline-hidden",
            "min-h-[44px]",
            value === opt
              ? "bg-violet-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200",
          )}
        >
          {getLabel(opt)}
        </button>
      ))}
    </div>
  );
}
