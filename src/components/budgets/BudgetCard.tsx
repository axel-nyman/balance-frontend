import { useNavigate } from 'react-router'
import { Lock, FileEdit } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatMonthYear } from '@/lib/utils'
import type { BudgetSummary, BudgetStatus } from '@/api/types'

interface BudgetCardProps {
  budget: BudgetSummary
}

export function BudgetCard({ budget }: BudgetCardProps) {
  const navigate = useNavigate()

  const isLocked: boolean = budget.status === ('LOCKED' as BudgetStatus)
  const balance = budget.totals.balance

  const handleClick = () => {
    navigate(`/budgets/${budget.id}`)
  }

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={handleClick}
    >
      <CardContent className="p-4">
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

        <div className="space-y-2">
          <div className="flex justify-between items-baseline">
            <span className="text-sm text-muted-foreground">Income</span>
            <span className="text-lg tabular-nums font-normal text-income">
              {formatCurrency(budget.totals.income)}
            </span>
          </div>
          <div className="flex justify-between items-baseline">
            <span className="text-sm text-muted-foreground">Expenses</span>
            <span className="text-lg tabular-nums font-normal text-expense">
              {formatCurrency(budget.totals.expenses)}
            </span>
          </div>
          <div className="flex justify-between items-baseline">
            <span className="text-sm text-muted-foreground">Savings</span>
            <span className="text-lg tabular-nums font-normal text-savings">
              {formatCurrency(budget.totals.savings)}
            </span>
          </div>
          <div className="flex justify-between items-baseline mt-3 pt-3 border-t border-border">
            <span className="text-sm text-foreground font-medium">Balance</span>
            <span className={`text-2xl tabular-nums font-light ${balance >= 0 ? 'text-income' : 'text-expense'}`}>
              {formatCurrency(balance)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
