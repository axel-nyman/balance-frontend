import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/shared'
import { useDeleteRecurringExpense } from '@/hooks'
import type { RecurringExpense } from '@/api/types'

interface DeleteRecurringExpenseDialogProps {
  expense: RecurringExpense | null
  onClose: () => void
}

export function DeleteRecurringExpenseDialog({ expense, onClose }: DeleteRecurringExpenseDialogProps) {
  const deleteExpense = useDeleteRecurringExpense()
  const isOpen = expense !== null

  const handleConfirm = async () => {
    if (!expense) return

    try {
      await deleteExpense.mutateAsync(expense.id)
      toast.success('Recurring expense deleted')
      onClose()
    } catch {
      toast.error(deleteExpense.error?.message || 'Failed to delete recurring expense')
    }
  }

  return (
    <ConfirmDialog
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
      title="Delete Recurring Expense"
      description={`Are you sure you want to delete "${expense?.name}"? This will not affect any existing budget expenses created from this template.`}
      confirmLabel="Delete"
      variant="destructive"
      onConfirm={handleConfirm}
      loading={deleteExpense.isPending}
    />
  )
}
