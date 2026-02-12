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
          <div className="bg-income-muted rounded-xl p-3">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Income</p>
            <p className="text-lg tabular-nums font-normal text-income">
              {formatCurrency(totalIncome)}
            </p>
          </div>
          <div className="bg-expense-muted rounded-xl p-3">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Expenses</p>
            <p className="text-lg tabular-nums font-normal text-expense">
              {formatCurrency(totalExpenses)}
            </p>
          </div>
          <div className="bg-savings-muted rounded-xl p-3">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Savings</p>
            <p className="text-lg tabular-nums font-normal text-savings">
              {formatCurrency(totalSavings)}
            </p>
          </div>
          <div className="p-3">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Balance</p>
            <p className={cn(
              'text-lg tabular-nums font-normal',
              balance >= 0 ? 'text-income' : 'text-expense'
            )}>
              {formatCurrency(balance)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
