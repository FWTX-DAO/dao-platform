import { cn } from "../../utils/cn";

interface StatCardProps {
  label: string;
  value: string | number;
  className?: string;
}

export function StatCard({ label, value, className }: StatCardProps) {
  return (
    <dl
      className={cn(
        "bg-white rounded-lg border border-gray-200 p-4 text-center",
        className,
      )}
    >
      <dt className="text-xs text-gray-500 order-2 mt-1">{label}</dt>
      <dd className="text-2xl font-semibold text-gray-900 tabular-nums order-1">
        {value}
      </dd>
    </dl>
  );
}
