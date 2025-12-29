import { formatMonthYear } from '@/lib/utils'

interface DueStatusIndicatorProps {
  isDue: boolean
  nextDueDate: string | null
  lastUsedDate: string | null
}

export function DueStatusIndicator({ isDue, nextDueDate, lastUsedDate }: DueStatusIndicatorProps) {
  // Never used
  if (lastUsedDate === null) {
    return (
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-yellow-500" aria-hidden="true" />
        <span className="text-sm text-gray-600">Never used</span>
      </div>
    )
  }

  // Due now
  if (isDue) {
    return (
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-red-500" aria-hidden="true" />
        <span className="text-sm font-medium text-red-600">Due now</span>
      </div>
    )
  }

  // Not due - show next due date
  if (nextDueDate) {
    const date = new Date(nextDueDate)
    const month = date.getMonth() + 1
    const year = date.getFullYear()

    return (
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-green-500" aria-hidden="true" />
        <span className="text-sm text-gray-600">{formatMonthYear(month, year)}</span>
      </div>
    )
  }

  return null
}
