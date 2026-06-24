import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { formatCurrencyCompact } from '@/lib/utils'
import type { SavingsGoal } from '@/api/types'

interface GoalProgressProps {
  goal: SavingsGoal
  /** Show the "x kr of y kr" caption above the bar (used on the detail page). */
  showCaption?: boolean
}

/**
 * Allocated-vs-target progress for a savings goal. When no target is set there
 * is nothing to progress towards, so we show the allocated total instead of a
 * bar.
 */
export function GoalProgress({ goal, showCaption = false }: GoalProgressProps) {
  if (goal.targetAmount === null) {
    return (
      <div className="flex items-baseline justify-between text-sm">
        <span className="text-muted-foreground">Allocated</span>
        <span className="tabular-nums text-foreground">
          {formatCurrencyCompact(goal.totalAllocated)}
        </span>
      </div>
    )
  }

  const percentage = goal.progressPercentage ?? 0
  const clamped = Math.min(100, Math.max(0, percentage))

  return (
    <div className="space-y-1.5">
      {showCaption && (
        <div className="flex items-baseline justify-between text-sm">
          <span className="text-muted-foreground">
            {formatCurrencyCompact(goal.totalAllocated)} of{' '}
            {formatCurrencyCompact(goal.targetAmount)}
          </span>
          <span
            className={cn(
              'font-medium tabular-nums',
              goal.completed ? 'text-income' : 'text-muted-foreground'
            )}
          >
            {Math.round(percentage)}%
          </span>
        </div>
      )}
      <Progress
        value={clamped}
        className={cn(goal.completed && '[&>[data-slot=progress-indicator]]:bg-income')}
      />
      {!showCaption && (
        <div className="flex items-baseline justify-between text-sm">
          <span className="tabular-nums text-foreground">
            {formatCurrencyCompact(goal.totalAllocated)} / {formatCurrencyCompact(goal.targetAmount)}
          </span>
          <span
            className={cn(
              'font-medium tabular-nums',
              goal.completed ? 'text-income' : 'text-muted-foreground'
            )}
          >
            {Math.round(percentage)}%
          </span>
        </div>
      )}
    </div>
  )
}
