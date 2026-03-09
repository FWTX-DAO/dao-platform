import { cn } from '../../utils/cn';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'animate-pulse rounded-md bg-gray-200 motion-reduce:animate-none',
        className,
      )}
    />
  );
}

export function SkeletonCard({ className }: SkeletonProps) {
  return (
    <div className={cn('bg-white rounded-lg border border-gray-100 p-6 space-y-3', className)}>
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  );
}

export function SkeletonList({ count = 3, className }: SkeletonProps & { count?: number }) {
  return (
    <div role="status" aria-label="Loading content" className={cn('space-y-4', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
      <span className="sr-only">Loading&hellip;</span>
    </div>
  );
}

export function SkeletonGrid({ count = 6, cols = 3 }: { count?: number; cols?: 2 | 3 }) {
  const gridClass = cols === 2
    ? 'grid grid-cols-1 md:grid-cols-2 gap-6'
    : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6';

  return (
    <div role="status" aria-label="Loading content" className={gridClass}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
      <span className="sr-only">Loading&hellip;</span>
    </div>
  );
}

export function SkeletonStats({ count = 3 }: { count?: number }) {
  return (
    <div role="status" aria-label="Loading stats" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-lg border border-gray-100 p-6 flex items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-lg" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-6 w-12" />
          </div>
        </div>
      ))}
      <span className="sr-only">Loading&hellip;</span>
    </div>
  );
}
