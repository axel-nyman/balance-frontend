import { useParams, useNavigate } from 'react-router'
import { Lock, ListTodo } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PageHeader, LoadingState, ErrorState } from '@/components/shared'
import { BudgetSummary } from '@/components/budget-detail/BudgetSummary'
import { useBudget } from '@/hooks'
import { formatMonthYear } from '@/lib/utils'

export function BudgetDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: budget, isLoading, isError, refetch } = useBudget(id!)

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Loading..." />
        <LoadingState variant="detail" />
      </div>
    )
  }

  if (isError || !budget) {
    return (
      <div>
        <PageHeader title="Budget Not Found" />
        <ErrorState
          title="Budget not found"
          message="This budget doesn't exist or has been deleted."
          onRetry={refetch}
        />
      </div>
    )
  }

  const isLocked = budget.status === 'LOCKED'
  const title = formatMonthYear(budget.month, budget.year)

  return (
    <div>
      <PageHeader
        title={title}
        description={
          <Badge variant={isLocked ? 'default' : 'secondary'} className="mt-1">
            {isLocked ? (
              <>
                <Lock className="w-3 h-3 mr-1" />
                Locked
              </>
            ) : (
              'Draft'
            )}
          </Badge>
        }
        action={
          <div className="flex gap-2">
            {isLocked && (
              <Button
                variant="outline"
                onClick={() => navigate(`/budgets/${id}/todo`)}
              >
                <ListTodo className="w-4 h-4 mr-2" />
                Todo List
              </Button>
            )}
          </div>
        }
      />

      {/* Budget sections will go here */}
      <div className="space-y-6">
        <BudgetSummary
          totalIncome={budget.totals.income}
          totalExpenses={budget.totals.expenses}
          totalSavings={budget.totals.savings}
        />
        {/* IncomeSection */}
        {/* ExpensesSection */}
        {/* SavingsSection */}
        {/* BudgetActions */}
      </div>
    </div>
  )
}
