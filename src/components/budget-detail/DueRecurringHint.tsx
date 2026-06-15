import { useState } from 'react'
import { AlertTriangle, Plus, Repeat } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { ExpenseItemModal, type ExpenseModalPrefill } from './ExpenseItemModal'
import { useRecurringExpenses, useAddExpense } from '@/hooks'
import { formatCurrency, monthYearToNumber } from '@/lib/utils'
import type { BudgetExpense, RecurringExpense } from '@/api/types'

interface DueRecurringHintProps {
  budgetId: string
  month: number
  year: number
  expenses: BudgetExpense[]
  isLocked: boolean
}

/**
 * Banner shown on an UNLOCKED budget detail page listing recurring templates
 * that are due for the budget's month (or earlier/overdue) but not yet linked
 * from any expense row. Each entry offers a one-click "Add" that creates the
 * expense the same way the wizard's recurring quick-add does.
 *
 * "Due" is compared in budget-month terms (never against the wall clock): a
 * template counts when its dueMonth/dueYear is at or before the budget's
 * month/year.
 */
export function DueRecurringHint({
  budgetId,
  month,
  year,
  expenses,
  isLocked,
}: DueRecurringHintProps) {
  const { data: recurringData } = useRecurringExpenses()
  const addExpense = useAddExpense(budgetId)
  const [addingId, setAddingId] = useState<string | null>(null)
  const [prefill, setPrefill] = useState<ExpenseModalPrefill | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  // Never show on locked budgets — the budget is read-only.
  if (isLocked) return null

  const linkedIds = new Set(
    expenses
      .map((expense) => expense.recurringExpenseId)
      .filter((id): id is string => id !== null)
  )
  const budgetMonthNumber = monthYearToNumber(month, year)

  const dueMissing = (recurringData?.expenses ?? [])
    .filter(
      (template) =>
        template.dueMonth !== null &&
        template.dueYear !== null &&
        monthYearToNumber(template.dueMonth, template.dueYear) <=
          budgetMonthNumber &&
        !linkedIds.has(template.id)
    )
    .sort((a, b) => {
      const byDue =
        monthYearToNumber(a.dueMonth!, a.dueYear!) -
        monthYearToNumber(b.dueMonth!, b.dueYear!)
      return byDue !== 0 ? byDue : a.name.localeCompare(b.name)
    })

  if (dueMissing.length === 0) return null

  const handleAdd = (template: RecurringExpense) => {
    // Without a default account we can't post directly (the backend requires a
    // bank account), so open the expense modal prefilled for the user to pick
    // one — the recurringExpenseId link is preserved through the modal.
    if (!template.bankAccount) {
      setPrefill({
        name: template.name,
        amount: template.amount,
        isManual: template.isManual,
        recurringExpenseId: template.id,
      })
      setModalOpen(true)
      return
    }

    setAddingId(template.id)
    addExpense.mutate(
      {
        name: template.name,
        amount: template.amount,
        bankAccountId: template.bankAccount.id,
        isManual: template.isManual,
        recurringExpenseId: template.id,
      },
      {
        onSuccess: () => toast.success('Expense added'),
        onError: () => toast.error('Failed to add expense'),
        onSettled: () => setAddingId(null),
      }
    )
  }

  return (
    <>
      <div className="rounded-2xl border border-warning/30 bg-warning-muted p-4 sm:p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0 text-warning mt-0.5" />
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-foreground">
              Due recurring expenses not added
            </h3>
            <p className="text-sm text-muted-foreground">
              {dueMissing.length === 1
                ? '1 recurring expense is due for this budget but not added yet.'
                : `${dueMissing.length} recurring expenses are due for this budget but not added yet.`}
            </p>
            <ul className="mt-3 divide-y divide-warning/20">
              {dueMissing.map((template) => (
                <li
                  key={template.id}
                  className="flex items-center justify-between gap-3 py-2 first:pt-1"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <Repeat className="w-3.5 h-3.5 shrink-0 text-savings" />
                      <p className="font-medium text-foreground truncate">
                        {template.name}
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {formatCurrency(template.amount)}
                      {template.bankAccount
                        ? ` · ${template.bankAccount.name}`
                        : ' · No default account'}
                      {template.dueDisplay ? ` · Due ${template.dueDisplay}` : ''}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAdd(template)}
                    disabled={addingId === template.id}
                    aria-label={`Add ${template.name}`}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <ExpenseItemModal
        budgetId={budgetId}
        item={null}
        prefill={prefill}
        open={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open)
          if (!open) setPrefill(null)
        }}
      />
    </>
  )
}
