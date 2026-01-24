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
import { Checkbox } from '@/components/ui/checkbox'
import { AccountSelect } from '@/components/accounts'
import { useAddExpense, useUpdateExpense } from '@/hooks'
import { expenseItemSchema, type ExpenseItemFormData } from './schemas'
import type { BudgetExpense } from '@/api/types'

interface ExpenseItemModalProps {
  budgetId: string
  item: BudgetExpense | null // null = create mode
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ExpenseItemModal({ budgetId, item, open, onOpenChange }: ExpenseItemModalProps) {
  const addExpense = useAddExpense(budgetId)
  const updateExpense = useUpdateExpense(budgetId)
  const isEditing = item !== null

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ExpenseItemFormData>({
    resolver: zodResolver(expenseItemSchema),
    defaultValues: {
      name: '',
      amount: undefined,
      bankAccountId: '',
      isManual: false,
    },
  })

  const selectedAccountId = watch('bankAccountId')
  const isManual = watch('isManual')

  // Reset form when item changes
  useEffect(() => {
    if (item) {
      reset({
        name: item.name,
        amount: item.amount,
        bankAccountId: item.bankAccount.id,
        isManual: item.isManual,
      })
    } else {
      reset({
        name: '',
        amount: undefined,
        bankAccountId: '',
        isManual: false,
      })
    }
  }, [item, reset])

  const onSubmit = async (data: ExpenseItemFormData) => {
    try {
      if (isEditing && item) {
        await updateExpense.mutateAsync({
          expenseId: item.id,
          data,
        })
        toast.success('Expense updated')
      } else {
        await addExpense.mutateAsync(data)
        toast.success('Expense added')
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

  const mutation = isEditing ? updateExpense : addExpense

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Expense' : 'Add Expense'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              {...register('name')}
              placeholder="e.g., Rent, Groceries"
              autoFocus
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="expense-amount">Amount *</Label>
            <Input
              id="expense-amount"
              type="number"
              step="0.01"
              {...register('amount', { valueAsNumber: true })}
              placeholder="0.00"
            />
            {errors.amount && (
              <p className="text-sm text-destructive">{errors.amount.message}</p>
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
              <p className="text-sm text-destructive">{errors.bankAccountId.message}</p>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="isManual"
              checked={isManual}
              onCheckedChange={(checked) => setValue('isManual', checked === true)}
            />
            <Label htmlFor="isManual" className="font-normal">
              Manual payment (requires manual action each month)
            </Label>
          </div>

          {mutation.error && (
            <p className="text-sm text-destructive">
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
