import { cn } from '@/lib/utils'

interface ProgressHeaderProps {
  percentage: number
  currentStepTitle: string
}

export function ProgressHeader({ percentage, currentStepTitle }: ProgressHeaderProps) {
  return (
    <div className="mb-8">
      {/* Progress bar container */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">
          {currentStepTitle}
        </span>
        <span className="text-sm text-gray-500">
          {percentage}% complete
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500 ease-out',
            'bg-gradient-to-r from-blue-500 to-blue-600'
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}
