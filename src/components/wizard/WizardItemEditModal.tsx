import { useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Repeat } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { AccountSelect } from '@/components/accounts'

import { wizardItemSchema, type WizardItemFormData } from './schemas'
import type { WizardIncomeItem, WizardExpenseItem, WizardSavingsItem } from './types'

type ItemType = 'income' | 'expense' | 'savings'
type WizardItem = WizardIncomeItem | WizardExpenseItem | WizardSavingsItem

interface ItemTypeConfig {
  title: string
  namePlaceholder: string
  nameId: string
  accountId: string
  amountId: string
}

const CONFIG: Record<ItemType, ItemTypeConfig> = {
  income: {
    title: 'Edit Income',
    namePlaceholder: 'e.g., Salary, Freelance',
    nameId: 'income-name',
    accountId: 'income-account',
    amountId: 'income-amount',
  },
  expense: {
    title: 'Edit Expense',
    namePlaceholder: 'e.g., Rent, Groceries',
    nameId: 'expense-name',
    accountId: 'expense-account',
    amountId: 'expense-amount',
  },
  savings: {
    title: 'Edit Savings',
    namePlaceholder: 'e.g., Emergency Fund',
    nameId: 'savings-name',
    accountId: 'savings-account',
    amountId: 'savings-amount',
  },
}

interface WizardItemEditModalProps {
  itemType: ItemType
  item: WizardItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (id: string, updates: Partial<WizardItem>) => void
  onDelete: (id: string) => void
}

export function WizardItemEditModal({
  itemType,
  item,
  open,
  onOpenChange,
  onSave,
  onDelete,
}: WizardItemEditModalProps) {
  const config = CONFIG[itemType]
  const accountNameRef = useRef<string>('')

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<WizardItemFormData>({
    resolver: zodResolver(wizardItemSchema),
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
        isManual: itemType === 'expense' ? (item as WizardExpenseItem).isManual : undefined,
      })
      accountNameRef.current = item.bankAccountName
    }
  }, [item, reset, itemType])

  const isRecurring = itemType === 'expense' && item && (item as WizardExpenseItem).recurringExpenseId != null

  const onSubmit = (data: WizardItemFormData) => {
    if (!item) return

    const updates: Partial<WizardItem> = {
      name: data.name,
      amount: data.amount,
      bankAccountId: data.bankAccountId,
      bankAccountName: accountNameRef.current,
    }

    if (itemType === 'expense' && data.isManual !== undefined) {
      ;(updates as Partial<WizardExpenseItem>).isManual = data.isManual
    }

    onSave(item.id, updates)
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

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent side="bottom" className="rounded-t-2xl">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            {config.title}
            {isRecurring && <Repeat className="w-4 h-4 text-savings" />}
          </SheetTitle>
          {isRecurring && (
            <SheetDescription>Linked to recurring expense</SheetDescription>
          )}
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 px-4">
          {/* Name Field */}
          <div className="space-y-2">
            <Label htmlFor={config.nameId}>Name</Label>
            <Input
              id={config.nameId}
              placeholder={config.namePlaceholder}
              {...register('name')}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          {/* Account Field */}
          <div className="space-y-2">
            <Label htmlFor={config.accountId}>Account</Label>
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

          {/* Amount Field */}
          <div className="space-y-2">
            <Label htmlFor={config.amountId}>Amount</Label>
            <Input
              id={config.amountId}
              type="number"
              step="0.01"
              placeholder="0.00"
              {...register('amount', { valueAsNumber: true })}
            />
            {errors.amount && (
              <p className="text-sm text-destructive">{errors.amount.message}</p>
            )}
          </div>

          {/* Manual Checkbox (Expense Only) */}
          {itemType === 'expense' && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="expense-isManual"
                checked={isManual ?? false}
                onCheckedChange={(checked) => setValue('isManual', checked === true)}
              />
              <Label htmlFor="expense-isManual" className="font-normal">
                Manual payment (requires todo reminder)
              </Label>
            </div>
          )}

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
