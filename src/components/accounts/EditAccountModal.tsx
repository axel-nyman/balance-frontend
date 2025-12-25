import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useUpdateAccount } from '@/hooks'
import { updateAccountSchema, type UpdateAccountFormData } from './schemas'
import type { BankAccount } from '@/api/types'

interface EditAccountModalProps {
  account: BankAccount | null
  onClose: () => void
}

export function EditAccountModal({ account, onClose }: EditAccountModalProps) {
  const updateAccount = useUpdateAccount()
  const isOpen = account !== null

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UpdateAccountFormData>({
    resolver: zodResolver(updateAccountSchema),
  })

  // Reset form when account changes
  useEffect(() => {
    if (account) {
      reset({
        name: account.name,
        description: account.description || '',
      })
    }
  }, [account, reset])

  const onSubmit = async (data: UpdateAccountFormData) => {
    if (!account) return

    try {
      await updateAccount.mutateAsync({
        id: account.id,
        data: {
          name: data.name,
          description: data.description || undefined,
        },
      })
      toast.success('Account updated')
      onClose()
    } catch {
      // Error displayed inline
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Account</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Name *</Label>
            <Input
              id="edit-name"
              {...register('name')}
              autoFocus
            />
            {errors.name && (
              <p className="text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-description">Description</Label>
            <Input
              id="edit-description"
              {...register('description')}
            />
          </div>

          {updateAccount.error && (
            <p className="text-sm text-red-600">
              {updateAccount.error.message}
            </p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateAccount.isPending}>
              {updateAccount.isPending ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
