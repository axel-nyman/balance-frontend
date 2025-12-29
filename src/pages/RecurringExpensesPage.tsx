import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageHeader, ConfirmDialog } from '@/components/shared'
import { RecurringExpensesList } from '@/components/recurring-expenses'
import { useRecurringExpenses, useDeleteRecurringExpense } from '@/hooks/use-recurring-expenses'
import { toast } from 'sonner'
import type { RecurringExpense } from '@/api/types'

export function RecurringExpensesPage() {
  const { data, isLoading, isError, refetch } = useRecurringExpenses()
  const deleteExpense = useDeleteRecurringExpense()

  const [expenseToDelete, setExpenseToDelete] = useState<RecurringExpense | null>(null)

  // TODO: Implement create modal (Story 3.3)
  const handleCreateNew = () => {
    // Will open create modal when implemented
  }

  // TODO: Implement edit modal (Story 3.4)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleEdit = (_expense: RecurringExpense) => {
    // Will open edit modal when implemented
  }

  const handleDelete = (expense: RecurringExpense) => {
    setExpenseToDelete(expense)
  }

  const handleConfirmDelete = () => {
    if (!expenseToDelete) return

    deleteExpense.mutate(expenseToDelete.id, {
      onSuccess: () => {
        toast.success(`${expenseToDelete.name} deleted`)
        setExpenseToDelete(null)
      },
      onError: () => {
        toast.error('Failed to delete recurring expense')
      },
    })
  }

  return (
    <div>
      <PageHeader
        title="Recurring Expenses"
        description="Manage templates for regular expenses"
        action={
          <Button onClick={handleCreateNew}>
            <Plus className="w-4 h-4 mr-2" />
            New Recurring Expense
          </Button>
        }
      />

      <RecurringExpensesList
        expenses={data?.expenses ?? []}
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onCreateNew={handleCreateNew}
      />

      <ConfirmDialog
        open={expenseToDelete !== null}
        onOpenChange={(open) => !open && setExpenseToDelete(null)}
        title="Delete recurring expense?"
        description={`Are you sure you want to delete "${expenseToDelete?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleConfirmDelete}
        loading={deleteExpense.isPending}
      />
    </div>
  )
}
