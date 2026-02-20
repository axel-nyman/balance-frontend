import { CalendarDays } from 'lucide-react'
import { LoadingState, EmptyState, ErrorState } from '@/components/shared'
import { Button } from '@/components/ui/button'
import { BudgetCard } from './BudgetCard'
import type { BudgetSummary } from '@/api/types'

interface BudgetGridProps {
  budgets: BudgetSummary[]
  isLoading: boolean
  isError: boolean
  onRetry: () => void
  onCreateNew: () => void
}

// Sort budgets by year and month descending (newest first)
function sortBudgets(budgets: BudgetSummary[]): BudgetSummary[] {
  return [...budgets].sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year
    return b.month - a.month
  })
}

export function BudgetGrid({
  budgets,
  isLoading,
  isError,
  onRetry,
  onCreateNew,
}: BudgetGridProps) {
  if (isLoading) {
    return <LoadingState variant="cards" rows={6} />
  }

  if (isError) {
    return (
      <ErrorState
        title="Failed to load budgets"
        message="We couldn't load your budgets. Please try again."
        onRetry={onRetry}
      />
    )
  }

  if (budgets.length === 0) {
    return (
      <EmptyState
        icon={<CalendarDays className="w-12 h-12" />}
        title="No budgets yet"
        description="Create your first monthly budget to start tracking your income, expenses, and savings."
        action={
          <Button onClick={onCreateNew}>Create Your First Budget</Button>
        }
      />
    )
  }

  const sortedBudgets = sortBudgets(budgets)

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl">
      {sortedBudgets.map((budget) => (
        <BudgetCard key={budget.id} budget={budget} />
      ))}
    </div>
  )
}
