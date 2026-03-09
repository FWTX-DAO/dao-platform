'use client';

import { AlertTriangle } from 'lucide-react';
import { cn } from '../../utils/cn';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = 'Something went wrong',
  message = 'We couldn\u2019t load this content. Please try again.',
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div role="alert" className={cn('py-12 text-center', className)}>
      <AlertTriangle className="h-10 w-10 text-gray-400 mx-auto mb-3" />
      <p className="text-gray-900 font-medium">{title}</p>
      <p className="text-gray-500 text-sm mt-1">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 inline-flex items-center px-4 py-2.5 bg-violet-600 text-white rounded-md hover:bg-violet-700 font-medium text-sm transition-colors focus-visible:ring-2 focus-visible:ring-dao-gold focus-visible:outline-hidden"
        >
          Try again
        </button>
      )}
    </div>
  );
}
