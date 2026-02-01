import { useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AccountSelect } from '@/components/accounts'
import { wizardSavingsItemSchema, type WizardSavingsItemFormData } from './schemas'
import type { WizardSavingsItem } from './types'

interface WizardSavingsEditModalProps {
  item: WizardSavingsItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (id: string, updates: Partial<WizardSavingsItem>) => void
  onDelete: (id: string) => void
}

export function WizardSavingsEditModal({
  item,
  open,
  onOpenChange,
  onSave,
  onDelete,
}: WizardSavingsEditModalProps) {
  const accountNameRef = useRef<string>('')

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<WizardSavingsItemFormData>({
    resolver: zodResolver(wizardSavingsItemSchema),
    defaultValues: {
      name: '',
      amount: undefined,
      bankAccountId: '',
    },
  })

  const selectedAccountId = watch('bankAccountId')

  useEffect(() => {
    if (item) {
      reset({
        name: item.name,
        amount: item.amount || undefined,
        bankAccountId: item.bankAccountId,
      })
      accountNameRef.current = item.bankAccountName
    }
  }, [item, reset])

  const onSubmit = (data: WizardSavingsItemFormData) => {
    if (!item) return
    onSave(item.id, {
      name: data.name,
      amount: data.amount,
      bankAccountId: data.bankAccountId,
      bankAccountName: accountNameRef.current,
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

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent side="bottom" className="rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>Edit Savings</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 px-4">
          <div className="space-y-2">
            <Label htmlFor="savings-name">Name</Label>
            <Input
              id="savings-name"
              {...register('name')}
              placeholder="e.g., Emergency Fund"
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="savings-account">Account</Label>
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
            <Label htmlFor="savings-amount">Amount</Label>
            <Input
              id="savings-amount"
              type="number"
              step="0.01"
              {...register('amount', { valueAsNumber: true })}
              placeholder="0.00"
            />
            {errors.amount && (
              <p className="text-sm text-destructive">{errors.amount.message}</p>
            )}
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
