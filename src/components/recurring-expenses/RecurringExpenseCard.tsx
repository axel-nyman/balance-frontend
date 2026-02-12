import { Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import { DueStatusIndicator } from './DueStatusIndicator'
import type { RecurringExpense } from '@/api/types'

interface RecurringExpenseCardProps {
  expense: RecurringExpense
  onEdit: (expense: RecurringExpense) => void
  onDelete: (expense: RecurringExpense) => void
}

const INTERVAL_LABELS: Record<string, string> = {
  MONTHLY: 'Monthly',
  QUARTERLY: 'Quarterly',
  BIANNUALLY: 'Biannually',
  YEARLY: 'Yearly',
}

export function RecurringExpenseCard({ expense, onEdit, onDelete }: RecurringExpenseCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex justify-between items-center">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <DueStatusIndicator
                dueMonth={expense.dueMonth}
                dueYear={expense.dueYear}
                dueDisplay={expense.dueDisplay}
              />
            </div>
            <h3 className="font-medium text-foreground truncate">{expense.name}</h3>
            <p className="text-sm tabular-nums text-muted-foreground">
              {formatCurrency(expense.amount)} • {INTERVAL_LABELS[expense.recurrenceInterval]}
              {expense.bankAccount && ` • ${expense.bankAccount.name}`}
            </p>
          </div>
          <div className="flex flex-col gap-1 ml-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(expense)}
              aria-label={`Edit ${expense.name}`}
            >
              <Pencil className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(expense)}
              aria-label={`Delete ${expense.name}`}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
