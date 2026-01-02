import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/shared'
import { useDeleteIncome, useDeleteExpense, useDeleteSavings } from '@/hooks'

type ItemType = 'income' | 'expense' | 'savings'

interface DeleteItemDialogProps {
  budgetId: string
  itemId: string | null
  itemName: string
  itemType: ItemType
  onClose: () => void
}

export function DeleteItemDialog({
  budgetId,
  itemId,
  itemName,
  itemType,
  onClose,
}: DeleteItemDialogProps) {
  const deleteIncome = useDeleteIncome(budgetId)
  const deleteExpense = useDeleteExpense(budgetId)
  const deleteSavings = useDeleteSavings(budgetId)

  const isOpen = itemId !== null

  const getMutation = () => {
    switch (itemType) {
      case 'income':
        return deleteIncome
      case 'expense':
        return deleteExpense
      case 'savings':
        return deleteSavings
    }
  }

  const mutation = getMutation()

  const handleConfirm = async () => {
    if (!itemId) return

    try {
      await mutation.mutateAsync(itemId)
      toast.success(`${itemType.charAt(0).toUpperCase() + itemType.slice(1)} deleted`)
      onClose()
    } catch {
      toast.error(`Failed to delete ${itemType}`)
    }
  }

  const typeLabels: Record<ItemType, string> = {
    income: 'Income',
    expense: 'Expense',
    savings: 'Savings',
  }

  return (
    <ConfirmDialog
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
      title={`Delete ${typeLabels[itemType]}`}
      description={`Are you sure you want to delete "${itemName}"? This action cannot be undone.`}
      confirmLabel="Delete"
      variant="destructive"
      onConfirm={handleConfirm}
      loading={mutation.isPending}
    />
  )
}
