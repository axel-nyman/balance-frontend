import { RefreshCw } from 'lucide-react'
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { LoadingState, EmptyState, ErrorState } from '@/components/shared'
import { getCurrentMonthYear, monthYearToNumber } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { RecurringExpenseRow } from './RecurringExpenseRow'
import { RecurringExpenseCard } from './RecurringExpenseCard'
import type { RecurringExpense } from '@/api/types'

interface RecurringExpensesListProps {
  expenses: RecurringExpense[]
  isLoading: boolean
  isError: boolean
  onRetry: () => void
  onEdit: (expense: RecurringExpense) => void
  onDelete: (expense: RecurringExpense) => void
  onCreateNew: () => void
}

// Sort: due items first, then never-used, then by due month/year ascending
function sortExpenses(expenses: RecurringExpense[]): RecurringExpense[] {
  const { month: currentMonth, year: currentYear } = getCurrentMonthYear()

  return [...expenses].sort((a, b) => {
    const aIsDue = a.dueMonth === currentMonth && a.dueYear === currentYear
    const bIsDue = b.dueMonth === currentMonth && b.dueYear === currentYear

    // Never used items (yellow) come after due items but before not-due items
    const aScore = aIsDue ? 0 : a.dueMonth === null ? 1 : 2
    const bScore = bIsDue ? 0 : b.dueMonth === null ? 1 : 2

    if (aScore !== bScore) return aScore - bScore

    // Within same category, sort by due month/year
    if (a.dueMonth != null && a.dueYear != null && b.dueMonth != null && b.dueYear != null) {
      return monthYearToNumber(a.dueMonth, a.dueYear) - monthYearToNumber(b.dueMonth, b.dueYear)
    }

    // Items without due month come last
    if (a.dueMonth == null) return 1
    if (b.dueMonth == null) return -1

    return 0
  })
}

export function RecurringExpensesList({
  expenses,
  isLoading,
  isError,
  onRetry,
  onEdit,
  onDelete,
  onCreateNew,
}: RecurringExpensesListProps) {
  if (isLoading) {
    return <LoadingState variant="table" rows={3} />
  }

  if (isError) {
    return (
      <ErrorState
        title="Failed to load recurring expenses"
        message="We couldn't load your recurring expenses. Please try again."
        onRetry={onRetry}
      />
    )
  }

  if (expenses.length === 0) {
    return (
      <EmptyState
        icon={<RefreshCw className="w-12 h-12" />}
        title="No recurring expenses yet"
        description="Create templates for regular expenses like rent, subscriptions, and bills to quickly add them to your monthly budgets."
        action={
          <Button onClick={onCreateNew}>Create Recurring Expense</Button>
        }
      />
    )
  }

  const sortedExpenses = sortExpenses(expenses)

  return (
    <>
      {/* Desktop Table */}
      <div className="hidden md:block bg-card rounded-2xl shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[300px]">Name</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Account</TableHead>
              <TableHead>Interval</TableHead>
              <TableHead className="w-[100px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedExpenses.map((expense) => (
              <RecurringExpenseRow
                key={expense.id}
                expense={expense}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {sortedExpenses.map((expense) => (
          <RecurringExpenseCard
            key={expense.id}
            expense={expense}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
    </>
  )
}
