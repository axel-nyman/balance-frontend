import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/shared'
import { useDeleteAccount } from '@/hooks'
import type { BankAccount } from '@/api/types'

interface DeleteAccountDialogProps {
  account: BankAccount | null
  onClose: () => void
}

export function DeleteAccountDialog({ account, onClose }: DeleteAccountDialogProps) {
  const deleteAccount = useDeleteAccount()
  const isOpen = account !== null

  const handleConfirm = async () => {
    if (!account) return

    try {
      await deleteAccount.mutateAsync(account.id)
      toast.success('Account deleted')
      onClose()
    } catch {
      toast.error(deleteAccount.error?.message || 'Failed to delete account')
    }
  }

  return (
    <ConfirmDialog
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
      title="Delete Account"
      description={`Are you sure you want to delete "${account?.name}"? This action cannot be undone. Balance history will be preserved.`}
      confirmLabel="Delete"
      variant="destructive"
      onConfirm={handleConfirm}
      loading={deleteAccount.isPending}
    />
  )
}
