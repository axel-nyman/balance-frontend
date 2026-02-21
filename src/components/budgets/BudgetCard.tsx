import { useNavigate } from 'react-router'
import { Lock, FileEdit, ListChecks, TrendingUp } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrencyCompact, formatMonthYear } from '@/lib/utils'
import { deriveCardLifecycleState } from '@/lib/budget-lifecycle'
import { useTodoList } from '@/hooks/use-todo'
import type { BudgetSummary, BudgetStatus } from '@/api/types'

interface BudgetCardProps {
  budget: BudgetSummary
}

export function BudgetCard({ budget }: BudgetCardProps) {
  const navigate = useNavigate()

  const isLocked: boolean = budget.status === ('LOCKED' as BudgetStatus)

  const { data: todoData, isError: todoError } = useTodoList(budget.id, {
    enabled: isLocked,
    staleTime: 5 * 60 * 1000,
  })

  const state = deriveCardLifecycleState(budget.totals, isLocked, todoData?.summary, todoError)

  const handleClick = () => {
    navigate(`/budgets/${budget.id}`)
  }

  function renderHero() {
    if (state === null) {
      // Loading state
      return (
        <div className="flex justify-between items-baseline pt-3 mt-2 border-t border-border">
          <span className="text-sm text-foreground font-medium">Todos</span>
          <div className="h-7 w-24 bg-muted animate-pulse rounded" />
        </div>
      )
    }

    switch (state.type) {
      case 'draft-unbalanced':
        return (
          <div className="flex justify-between items-baseline pt-3 mt-2 border-t border-border">
            <span className="text-sm text-foreground font-medium">Balance</span>
            <span className={`text-xl tabular-nums font-semibold ${state.balance >= 0 ? 'text-income' : 'text-expense'}`}>
              {formatCurrencyCompact(state.balance)}
            </span>
          </div>
        )
      case 'draft-balanced':
        return (
          <div className="flex justify-between items-baseline pt-3 mt-2 border-t border-border">
            <span className="text-sm text-foreground font-medium">Balance</span>
            <span className="text-xl tabular-nums font-semibold text-income">
              {formatCurrencyCompact(state.balance)}
            </span>
          </div>
        )
      case 'locked-in-progress':
        return (
          <div className="flex justify-between items-baseline pt-3 mt-2 border-t border-border">
            <span className="text-sm text-foreground font-medium">Todos</span>
            <span className="text-xl font-semibold text-muted-foreground flex items-center gap-1.5">
              <ListChecks className="w-5 h-5" />
              {state.completed}/{state.total} done
            </span>
          </div>
        )
      case 'locked-complete':
        return (
          <div className="flex justify-between items-baseline pt-3 mt-2 border-t border-border">
            <span className="text-sm text-foreground font-medium">Saved</span>
            <span className="text-xl tabular-nums font-semibold text-income flex items-center gap-1.5">
              <TrendingUp className="w-5 h-5" />
              {state.savingsRate}%
            </span>
          </div>
        )
    }
  }

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={handleClick}
    >
      <CardContent>
        <div className="flex justify-between items-start mb-3">
          <h3 className="font-semibold text-lg tracking-tight text-foreground">
            {formatMonthYear(budget.month, budget.year)}
          </h3>
          <Badge
            variant={isLocked ? 'default' : 'secondary'}
            className="flex items-center gap-1"
          >
            {isLocked ? (
              <>
                <Lock className="w-3 h-3" />
                Locked
              </>
            ) : (
              <>
                <FileEdit className="w-3 h-3" />
                Draft
              </>
            )}
          </Badge>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between items-baseline">
            <span className="text-sm text-muted-foreground">Income</span>
            <span className="text-sm tabular-nums text-foreground">
              {formatCurrencyCompact(budget.totals.income)}
            </span>
          </div>
          <div className="flex justify-between items-baseline">
            <span className="text-sm text-muted-foreground">Expenses</span>
            <span className="text-sm tabular-nums text-foreground">
              {formatCurrencyCompact(budget.totals.expenses)}
            </span>
          </div>
          <div className="flex justify-between items-baseline">
            <span className="text-sm text-muted-foreground">Savings</span>
            <span className="text-sm tabular-nums text-foreground">
              {formatCurrencyCompact(budget.totals.savings)}
            </span>
          </div>
          {renderHero()}
        </div>
      </CardContent>
    </Card>
  )
}
