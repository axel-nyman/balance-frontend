import { Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import { DueStatusIndicator } from './DueStatusIndicator'
import type { RecurringExpense } from '@/api/types'

interface RecurringExpenseRowProps {
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

export function RecurringExpenseRow({ expense, onEdit, onDelete }: RecurringExpenseRowProps) {
  return (
    <tr className="hover:bg-accent">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <DueStatusIndicator
            isDue={expense.isDue}
            nextDueDate={expense.nextDueDate}
            lastUsedDate={expense.lastUsedDate}
          />
          <span className="font-medium text-foreground">{expense.name}</span>
        </div>
      </td>
      <td className="px-4 py-3 text-right font-medium text-foreground">
        {formatCurrency(expense.amount)}
      </td>
      <td className="px-4 py-3 text-muted-foreground">
        {INTERVAL_LABELS[expense.recurrenceInterval]}
      </td>
      <td className="px-4 py-3 text-right">
        <div className="flex justify-end gap-1">
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
      </td>
    </tr>
  )
}
