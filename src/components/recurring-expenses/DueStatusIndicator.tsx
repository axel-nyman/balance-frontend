import { getCurrentMonthYear } from '@/lib/utils'

interface DueStatusIndicatorProps {
  dueMonth: number | null
  dueYear: number | null
  dueDisplay: string | null
}

export function DueStatusIndicator({ dueMonth, dueYear, dueDisplay }: DueStatusIndicatorProps) {
  // Never used
  if (dueMonth === null) {
    return (
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-warning" aria-hidden="true" />
        <span className="text-sm text-muted-foreground">Never used</span>
      </div>
    )
  }

  // Due now — matches current calendar month
  const { month: currentMonth, year: currentYear } = getCurrentMonthYear()
  if (dueMonth === currentMonth && dueYear === currentYear) {
    return (
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-expense" aria-hidden="true" />
        <span className="text-sm font-medium text-expense">Due now</span>
      </div>
    )
  }

  // Future due date
  if (dueDisplay) {
    return (
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-income" aria-hidden="true" />
        <span className="text-sm text-muted-foreground">{dueDisplay}</span>
      </div>
    )
  }

  return null
}
