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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAddIncome, useUpdateIncome, useAccounts } from '@/hooks'
import { incomeItemSchema, type IncomeItemFormData } from './schemas'
import type { BudgetIncome } from '@/api/types'

interface IncomeItemModalProps {
  budgetId: string
  item: BudgetIncome | null // null = create mode
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function IncomeItemModal({ budgetId, item, open, onOpenChange }: IncomeItemModalProps) {
  const addIncome = useAddIncome(budgetId)
  const updateIncome = useUpdateIncome(budgetId)
  const { data: accountsData } = useAccounts()
  const isEditing = item !== null

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<IncomeItemFormData>({
    resolver: zodResolver(incomeItemSchema),
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

  const onSubmit = async (data: IncomeItemFormData) => {
    try {
      if (isEditing && item) {
        await updateIncome.mutateAsync({
          incomeId: item.id,
          data,
        })
        toast.success('Income updated')
      } else {
        await addIncome.mutateAsync(data)
        toast.success('Income added')
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

  const mutation = isEditing ? updateIncome : addIncome

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Income' : 'Add Income'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              {...register('name')}
              placeholder="e.g., Salary, Freelance"
              autoFocus
            />
            {errors.name && (
              <p className="text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount *</Label>
            <Input
              id="amount"
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
            <Select
              value={selectedAccountId}
              onValueChange={(value) => setValue('bankAccountId', value)}
            >
              <SelectTrigger id="bankAccountId">
                <SelectValue placeholder="Select account" />
              </SelectTrigger>
              <SelectContent>
                {accountsData?.accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
