import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Lock, Unlock, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/shared'
import { useLockBudget, useUnlockBudget, useDeleteBudget } from '@/hooks'
import type { BudgetStatus } from '@/api/types'

interface BudgetActionsProps {
  budgetId: string
  status: BudgetStatus
}

export function BudgetActions({ budgetId, status }: BudgetActionsProps) {
  const navigate = useNavigate()
  const lockBudget = useLockBudget()
  const unlockBudget = useUnlockBudget()
  const deleteBudget = useDeleteBudget()

  const [showLockDialog, setShowLockDialog] = useState(false)
  const [showUnlockDialog, setShowUnlockDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const isLocked = status === 'LOCKED'

  const handleLock = async () => {
    try {
      await lockBudget.mutateAsync(budgetId)
      toast.success('Budget locked')
      setShowLockDialog(false)
    } catch {
      toast.error(lockBudget.error?.message || 'Failed to lock budget')
    }
  }

  const handleUnlock = async () => {
    try {
      await unlockBudget.mutateAsync(budgetId)
      toast.success('Budget unlocked')
      setShowUnlockDialog(false)
    } catch {
      toast.error(unlockBudget.error?.message || 'Failed to unlock budget')
    }
  }

  const handleDelete = async () => {
    try {
      await deleteBudget.mutateAsync(budgetId)
      toast.success('Budget deleted')
      navigate('/budgets')
    } catch {
      toast.error(deleteBudget.error?.message || 'Failed to delete budget')
    }
  }

  return (
    <>
      {isLocked ? (
        <Button
          variant="outline"
          onClick={() => setShowUnlockDialog(true)}
        >
          <Unlock className="w-4 h-4 mr-2" />
          Unlock Budget
        </Button>
      ) : (
        <>
          <Button
            onClick={() => setShowLockDialog(true)}
          >
            <Lock className="w-4 h-4 mr-2" />
            Lock Budget
          </Button>

          <Button
            variant="outline"
            onClick={() => setShowDeleteDialog(true)}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Budget
          </Button>
        </>
      )}

      {/* Lock Dialog */}
      <ConfirmDialog
        open={showLockDialog}
        onOpenChange={setShowLockDialog}
        title="Lock Budget"
        description="Locking this budget will:
• Apply planned savings to your account balances
• Create a todo list for manual payment expenses
• Prevent further changes until unlocked

Are you sure you want to lock this budget?"
        confirmLabel="Lock Budget"
        onConfirm={handleLock}
        loading={lockBudget.isPending}
      />

      {/* Unlock Dialog */}
      <ConfirmDialog
        open={showUnlockDialog}
        onOpenChange={setShowUnlockDialog}
        title="Unlock Budget"
        description="Unlocking this budget will:
• Revert savings from your account balances
• Remove the todo list

Are you sure you want to unlock this budget?"
        confirmLabel="Unlock Budget"
        onConfirm={handleUnlock}
        loading={unlockBudget.isPending}
      />

      {/* Delete Dialog */}
      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Delete Budget"
        description="Are you sure you want to delete this budget? This action cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDelete}
        loading={deleteBudget.isPending}
      />
    </>
  )
}
