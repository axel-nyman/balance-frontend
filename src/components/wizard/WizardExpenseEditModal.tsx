import { useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Repeat } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { AccountSelect } from '@/components/accounts'
import { wizardExpenseItemSchema, type WizardExpenseItemFormData } from './schemas'
import type { WizardExpenseItem } from './types'

interface WizardExpenseEditModalProps {
  item: WizardExpenseItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (id: string, updates: Partial<WizardExpenseItem>) => void
  onDelete: (id: string) => void
}

export function WizardExpenseEditModal({
  item,
  open,
  onOpenChange,
  onSave,
  onDelete,
}: WizardExpenseEditModalProps) {
  const accountNameRef = useRef<string>('')

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<WizardExpenseItemFormData>({
    resolver: zodResolver(wizardExpenseItemSchema),
    defaultValues: {
      name: '',
      amount: undefined,
      bankAccountId: '',
      isManual: false,
    },
  })

  const selectedAccountId = watch('bankAccountId')
  const isManual = watch('isManual')

  useEffect(() => {
    if (item) {
      reset({
        name: item.name,
        amount: item.amount || undefined,
        bankAccountId: item.bankAccountId,
        isManual: item.isManual,
      })
      accountNameRef.current = item.bankAccountName
    }
  }, [item, reset])

  const onSubmit = (data: WizardExpenseItemFormData) => {
    if (!item) return
    onSave(item.id, {
      name: data.name,
      amount: data.amount,
      bankAccountId: data.bankAccountId,
      bankAccountName: accountNameRef.current,
      isManual: data.isManual,
    })
    onOpenChange(false)
  }

  const handleDelete = () => {
    if (!item) return
    onDelete(item.id)
    onOpenChange(false)
  }

  const handleClose = () => {
    reset()
    onOpenChange(false)
  }

  const isRecurring = item?.recurringExpenseId != null

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent side="bottom" className="rounded-t-2xl">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            Edit Expense
            {isRecurring && <Repeat className="w-4 h-4 text-savings" />}
          </SheetTitle>
          {isRecurring && (
            <SheetDescription>Linked to recurring expense</SheetDescription>
          )}
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 px-4">
          <div className="space-y-2">
            <Label htmlFor="expense-name">Name</Label>
            <Input
              id="expense-name"
              {...register('name')}
              placeholder="e.g., Rent, Groceries"
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="expense-account">Account</Label>
            <AccountSelect
              value={selectedAccountId}
              onValueChange={(accountId, accountName) => {
                setValue('bankAccountId', accountId)
                accountNameRef.current = accountName
              }}
              placeholder="Select account"
            />
            {errors.bankAccountId && (
              <p className="text-sm text-destructive">{errors.bankAccountId.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="expense-amount">Amount</Label>
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

          <div className="flex items-center space-x-2">
            <Checkbox
              id="expense-isManual"
              checked={isManual}
              onCheckedChange={(checked) => setValue('isManual', checked === true)}
            />
            <Label htmlFor="expense-isManual" className="font-normal">
              Manual payment (requires todo reminder)
            </Label>
          </div>

          <SheetFooter className="flex-col gap-2 px-0 pb-2">
            <Button type="submit" className="w-full">
              Done
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              className="w-full"
            >
              Delete
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
