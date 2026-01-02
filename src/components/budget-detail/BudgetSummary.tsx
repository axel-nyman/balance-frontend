import { Card, CardContent } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface BudgetSummaryProps {
  totalIncome: number
  totalExpenses: number
  totalSavings: number
}

export function BudgetSummary({ totalIncome, totalExpenses, totalSavings }: BudgetSummaryProps) {
  const balance = totalIncome - totalExpenses - totalSavings

  return (
    <Card>
      <CardContent className="p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Income</p>
            <p className="text-lg font-semibold text-green-600">
              {formatCurrency(totalIncome)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Expenses</p>
            <p className="text-lg font-semibold text-red-600">
              {formatCurrency(totalExpenses)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Savings</p>
            <p className="text-lg font-semibold text-blue-600">
              {formatCurrency(totalSavings)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Balance</p>
            <p className={cn(
              'text-lg font-semibold',
              balance >= 0 ? 'text-green-600' : 'text-red-600'
            )}>
              {formatCurrency(balance)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
