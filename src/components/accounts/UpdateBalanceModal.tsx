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
import { useUpdateBalance } from '@/hooks'
import { formatCurrency } from '@/lib/utils'
import { updateBalanceSchema, type UpdateBalanceFormData } from './schemas'
import type { BankAccount } from '@/api/types'

interface UpdateBalanceModalProps {
  account: BankAccount
  open: boolean
  onOpenChange: (open: boolean) => void
}

function getTodayString(): string {
  return new Date().toISOString().split('T')[0]
}

export function UpdateBalanceModal({ account, open, onOpenChange }: UpdateBalanceModalProps) {
  const updateBalance = useUpdateBalance()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UpdateBalanceFormData>({
    resolver: zodResolver(updateBalanceSchema),
    defaultValues: {
      newBalance: account.currentBalance,
      date: getTodayString(),
      comment: '',
    },
  })

  const onSubmit = async (data: UpdateBalanceFormData) => {
    try {
      await updateBalance.mutateAsync({
        id: account.id,
        data: {
          newBalance: data.newBalance,
          date: data.date, // Send date directly (YYYY-MM-DD format)
          comment: data.comment || undefined,
        },
      })
      toast.success('Balance updated')
      reset({
        newBalance: data.newBalance,
        date: getTodayString(),
        comment: '',
      })
      onOpenChange(false)
    } catch {
      // Error displayed inline via mutation.error
    }
  }

  const handleClose = () => {
    reset()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Balance</DialogTitle>
        </DialogHeader>

        <div className="mb-4 p-3 bg-muted rounded-xl">
          <p className="text-sm text-muted-foreground">{account.name}</p>
          <p className="text-lg font-medium">
            Current: {formatCurrency(account.currentBalance)}
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="newBalance">New Balance *</Label>
            <Input
              id="newBalance"
              type="number"
              step="0.01"
              {...register('newBalance', { valueAsNumber: true })}
              autoFocus
            />
            {errors.newBalance && (
              <p className="text-sm text-destructive">{errors.newBalance.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Date *</Label>
            <Input
              id="date"
              type="date"
              max={getTodayString()}
              {...register('date')}
            />
            {errors.date && (
              <p className="text-sm text-destructive">{errors.date.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="comment">Comment</Label>
            <Input
              id="comment"
              {...register('comment')}
              placeholder="e.g., Reconciled with bank statement"
            />
          </div>

          {updateBalance.error && (
            <p className="text-sm text-destructive">
              {updateBalance.error.message}
            </p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateBalance.isPending}>
              {updateBalance.isPending ? 'Updating...' : 'Update'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
