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
import { AccountSelect } from '@/components/accounts'
import { useAddSavings, useUpdateSavings } from '@/hooks'
import { savingsItemSchema, type SavingsItemFormData } from './schemas'
import type { BudgetSavings } from '@/api/types'

interface SavingsItemModalProps {
  budgetId: string
  item: BudgetSavings | null // null = create mode
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SavingsItemModal({ budgetId, item, open, onOpenChange }: SavingsItemModalProps) {
  const addSavings = useAddSavings(budgetId)
  const updateSavings = useUpdateSavings(budgetId)
  const isEditing = item !== null

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SavingsItemFormData>({
    resolver: zodResolver(savingsItemSchema),
    defaultValues: {
      name: '',
      amount: undefined,
      bankAccountId: '',
    },
  })

  const selectedAccountId = watch('bankAccountId')

  // Reset form when item changes
  useEffect(() => {
    if (item) {
      reset({
        name: item.name,
        amount: item.amount,
        bankAccountId: item.bankAccount.id,
      })
    } else {
      reset({
        name: '',
        amount: undefined,
        bankAccountId: '',
      })
    }
  }, [item, reset])

  const onSubmit = async (data: SavingsItemFormData) => {
    try {
      if (isEditing && item) {
        await updateSavings.mutateAsync({
          savingsId: item.id,
          data,
        })
        toast.success('Savings updated')
      } else {
        await addSavings.mutateAsync(data)
        toast.success('Savings added')
      }
      onOpenChange(false)
    } catch {
      // Error displayed inline
    }
  }

  const handleClose = () => {
    reset()
    onOpenChange(false)
  }

  const mutation = isEditing ? updateSavings : addSavings

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Savings' : 'Add Savings'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              {...register('name')}
              placeholder="e.g., Emergency Fund, Vacation"
              autoFocus
            />
            {errors.name && (
              <p className="text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="savings-amount">Amount *</Label>
            <Input
              id="savings-amount"
              type="number"
              step="0.01"
              {...register('amount', { valueAsNumber: true })}
              placeholder="0.00"
            />
            {errors.amount && (
              <p className="text-sm text-red-600">{errors.amount.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="bankAccountId">Account *</Label>
            <AccountSelect
              value={selectedAccountId}
              onValueChange={(accountId) => setValue('bankAccountId', accountId)}
              placeholder="Select account"
            />
            {errors.bankAccountId && (
              <p className="text-sm text-red-600">{errors.bankAccountId.message}</p>
            )}
          </div>

          {mutation.error && (
            <p className="text-sm text-red-600">
              {mutation.error.message}
            </p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
