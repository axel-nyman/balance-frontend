import { useMemo } from 'react'
import { TrendingUp, CalendarClock } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { GoalHistoryChart } from './GoalHistoryChart'
import { useGoalHistory } from '@/hooks'
import { cn, formatCurrencyCompact } from '@/lib/utils'
import {
  buildAllocationSeries,
  projectCompletion,
  assessEndDate,
  type AllocationPoint,
} from '@/lib/goal-projection'
import type { SavingsGoal } from '@/api/types'

function formatMonthYear(date: Date | string): string {
  return new Intl.DateTimeFormat('sv-SE', { month: 'long', year: 'numeric' }).format(new Date(date))
}

/**
 * History chart, completion projection and (for goals with an end date) the
 * required-monthly-contribution assessment for a single savings goal (item
 * 070e). Velocity is derived from the goal's allocation-change ledger; the
 * forward-looking text is only shown for active goals.
 */
export function GoalInsights({ goal }: { goal: SavingsGoal }) {
  const { data, isLoading } = useGoalHistory(goal.id)

  const series = useMemo(
    () => buildAllocationSeries(data?.changes ?? []),
    [data]
  )

  // The series begins at the first allocation; anchor the chart at the goal's
  // creation (0 kr) so the rise reads from the start. Velocity ignores this
  // synthetic point — it's purely visual.
  const chartPoints = useMemo<AllocationPoint[]>(() => {
    if (series.length === 0) return []
    const createdAt = goal.createdAt
    if (new Date(createdAt).getTime() < new Date(series[0].date).getTime()) {
      return [{ date: createdAt, total: 0 }, ...series]
    }
    return series
  }, [series, goal.createdAt])

  const now = new Date()
  const projection = projectCompletion(goal, series, now)
  const endDate = assessEndDate(goal, series, now)
  const isActive = goal.status === 'ACTIVE'

  return (
    <Card>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-muted-foreground" />
          <h2 className="text-sm font-medium text-foreground">Progress over time</h2>
        </div>

        {isLoading ? (
          <Skeleton className="h-40 w-full" />
        ) : chartPoints.length >= 2 ? (
          <GoalHistoryChart points={chartPoints} targetAmount={goal.targetAmount} />
        ) : (
          <p className="text-sm text-muted-foreground">
            {chartPoints.length === 1
              ? 'Just one allocation so far — the chart will grow as you keep saving.'
              : 'No allocation history yet. Assign money or lock a budget with a saving linked to this goal to start tracking progress.'}
          </p>
        )}

        {isActive && !isLoading && (
          <ProjectionText projection={projection} targetAmount={goal.targetAmount} />
        )}
        {isActive && !isLoading && <EndDateText endDate={endDate} />}
      </CardContent>
    </Card>
  )
}

function ProjectionText({
  projection,
  targetAmount,
}: {
  projection: ReturnType<typeof projectCompletion>
  targetAmount: number | null
}) {
  if (projection.status === 'no-target' || projection.status === 'reached') return null

  if (projection.status === 'insufficient') {
    return (
      <p className="text-sm text-muted-foreground border-t border-border pt-3">
        Not enough history yet to project a completion date.
      </p>
    )
  }

  return (
    <p className="text-sm text-foreground border-t border-border pt-3">
      On track to reach{' '}
      <span className="font-medium tabular-nums">{formatCurrencyCompact(targetAmount ?? 0)}</span>{' '}
      around{' '}
      <span className="font-medium capitalize">{formatMonthYear(projection.date)}</span> at about{' '}
      <span className="tabular-nums">{formatCurrencyCompact(projection.perMonth)}</span>/mo.
    </p>
  )
}

function EndDateText({ endDate }: { endDate: ReturnType<typeof assessEndDate> }) {
  if (endDate.status === 'no-end-date' || endDate.status === 'reached') return null

  if (endDate.status === 'past') {
    return (
      <p className="flex items-start gap-2 text-sm text-expense border-t border-border pt-3">
        <CalendarClock className="w-4 h-4 mt-0.5 shrink-0" />
        <span>The target date has passed and the goal isn't fully funded yet.</span>
      </p>
    )
  }

  return (
    <p className="flex items-start gap-2 text-sm text-foreground border-t border-border pt-3">
      <CalendarClock className="w-4 h-4 mt-0.5 shrink-0 text-muted-foreground" />
      <span>
        Save{' '}
        <span className="font-medium tabular-nums">
          {formatCurrencyCompact(endDate.requiredPerMonth)}
        </span>
        /mo to reach this by your target date.
        {endDate.currentPerMonth !== null && (
          <>
            {' '}You're currently saving about{' '}
            <span className="tabular-nums">{formatCurrencyCompact(endDate.currentPerMonth)}</span>/mo —{' '}
            <span
              className={cn('font-medium', endDate.onTrack ? 'text-income' : 'text-expense')}
            >
              {endDate.onTrack ? 'ahead of pace' : 'behind pace'}
            </span>
            .
          </>
        )}
      </span>
    </p>
  )
}
