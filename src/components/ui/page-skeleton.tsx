import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface PageSkeletonProps {
  variant?: 'auth' | 'hub' | 'dashboard';
  className?: string;
}

export function PageSkeleton({ variant = 'dashboard', className }: PageSkeletonProps) {
  if (variant === 'auth') {
    return (
      <div className={cn("min-h-screen flex items-center justify-center bg-background p-4", className)}>
        <div className="w-full max-w-md space-y-6">
          <div className="flex flex-col items-center gap-3">
            <Skeleton className="h-24 w-24 rounded-full" />
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-10 w-full rounded-md" />
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'hub') {
    return (
      <div className={cn("min-h-screen flex items-center justify-center bg-background p-4", className)}>
        <div className="w-full max-w-lg space-y-6">
          <div className="flex flex-col items-center gap-3">
            <Skeleton className="h-20 w-20 rounded-full" />
            <Skeleton className="h-7 w-40" />
            <Skeleton className="h-4 w-56" />
          </div>
          <Skeleton className="h-10 w-full rounded-md" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-4 p-4 rounded-lg border border-border">
              <Skeleton className="h-10 w-10 rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-4 w-48" />
              </div>
              <Skeleton className="h-4 w-4 shrink-0" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // dashboard default
  return (
    <div className={cn("space-y-6 p-6", className)}>
      <Skeleton className="h-8 w-64" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Skeleton className="h-32 rounded-lg" />
        <Skeleton className="h-32 rounded-lg" />
      </div>
      <Skeleton className="h-48 rounded-lg" />
    </div>
  );
}
