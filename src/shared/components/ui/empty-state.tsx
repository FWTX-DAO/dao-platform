import { cn } from "../../utils/cn";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn("text-center py-12", className)}>
      {icon && (
        <div className="text-gray-300 mx-auto mb-3 [&>svg]:h-12 [&>svg]:w-12 [&>svg]:mx-auto">
          {icon}
        </div>
      )}
      <p className="text-gray-900 font-medium">{title}</p>
      {description && (
        <p className="text-gray-500 text-sm mt-1 max-w-sm mx-auto">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
