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
      className="cursor-pointer hover:border-gray-300 hover:shadow-sm transition-all"
      onClick={handleClick}
    >
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <h3 className="font-semibold text-lg text-gray-900">
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

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Income</span>
            <span className="font-medium text-green-600">
              {formatCurrency(budget.totals.income)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Expenses</span>
            <span className="font-medium text-red-600">
              {formatCurrency(budget.totals.expenses)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Savings</span>
            <span className="font-medium text-blue-600">
              {formatCurrency(budget.totals.savings)}
            </span>
          </div>
          <hr className="my-2" />
          <div className="flex justify-between">
            <span className="text-gray-700 font-medium">Balance</span>
            <span className={`font-semibold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(balance)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
