import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/shared'
import {
  RecurringExpensesList,
  CreateRecurringExpenseModal,
  EditRecurringExpenseModal,
  DeleteRecurringExpenseDialog,
} from '@/components/recurring-expenses'
import { useRecurringExpenses } from '@/hooks'
import type { RecurringExpense } from '@/api/types'

export function RecurringExpensesPage() {
  const { data, isLoading, isError, refetch } = useRecurringExpenses()

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState<RecurringExpense | null>(null)
  const [deletingExpense, setDeletingExpense] = useState<RecurringExpense | null>(null)

  return (
    <div>
      <PageHeader
        title="Recurring Expenses"
        description="Manage templates for regular expenses"
        action={
          <Button onClick={() => setIsCreateModalOpen(true)}>
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
        onEdit={setEditingExpense}
        onDelete={setDeletingExpense}
        onCreateNew={() => setIsCreateModalOpen(true)}
      />

      <CreateRecurringExpenseModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
      />

      <EditRecurringExpenseModal
        expense={editingExpense}
        onClose={() => setEditingExpense(null)}
      />

      <DeleteRecurringExpenseDialog
        expense={deletingExpense}
        onClose={() => setDeletingExpense(null)}
      />
    </div>
  )
}
