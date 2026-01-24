import { Skeleton } from '@/components/ui/skeleton'

interface LoadingStateProps {
  /** Number of skeleton rows to show */
  rows?: number
  /** Type of loading state */
  variant?: 'table' | 'cards' | 'detail'
}

export function LoadingState({ rows = 3, variant = 'table' }: LoadingStateProps) {
  if (variant === 'cards') {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="p-4 bg-card rounded-2xl shadow-sm">
            <Skeleton className="h-5 w-24 mb-2" />
            <Skeleton className="h-4 w-16 mb-4" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-28 mt-1" />
            <Skeleton className="h-4 w-24 mt-1" />
          </div>
        ))}
      </div>
    )
  }

  if (variant === 'detail') {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="space-y-4">
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="p-4 bg-card rounded-2xl shadow-sm">
              <Skeleton className="h-5 w-32 mb-3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4 mt-2" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Default: table variant
  return (
    <div className="bg-card rounded-2xl shadow-sm">
      <div className="p-4 border-b border-border">
        <Skeleton className="h-5 w-32" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 border-b border-border last:border-b-0">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-20 ml-auto" />
        </div>
      ))}
    </div>
  )
}
