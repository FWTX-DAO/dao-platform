import * as React from 'react';
import { cn } from '../../utils/cn';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'bg-white shadow-xs rounded-lg border border-gray-100 transition-shadow',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  ),
);
Card.displayName = 'Card';

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

function CardHeader({ title, icon, action, className, ...props }: CardHeaderProps) {
  return (
    <div className={cn('flex items-center justify-between p-6 pb-0', className)} {...props}>
      <h2 className="text-lg font-semibold flex items-center text-gray-900">
        {icon && <span className="mr-2 text-violet-600">{icon}</span>}
        {title}
      </h2>
      {action}
    </div>
  );
}

function CardContent({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('p-6', className)} {...props}>
      {children}
    </div>
  );
}

export { Card, CardHeader, CardContent };
