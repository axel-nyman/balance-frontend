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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useUpdateRecurringExpense } from '@/hooks'
import { formatDate, formatMonthYear } from '@/lib/utils'
import { updateRecurringExpenseSchema, type UpdateRecurringExpenseFormData } from './schemas'
import type { RecurringExpense } from '@/api/types'

interface EditRecurringExpenseModalProps {
  expense: RecurringExpense | null
  onClose: () => void
}

const INTERVAL_OPTIONS = [
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'QUARTERLY', label: 'Quarterly' },
  { value: 'BIANNUALLY', label: 'Biannually' },
  { value: 'YEARLY', label: 'Yearly' },
]

export function EditRecurringExpenseModal({ expense, onClose }: EditRecurringExpenseModalProps) {
  const updateExpense = useUpdateRecurringExpense()
  const isOpen = expense !== null

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<UpdateRecurringExpenseFormData>({
    resolver: zodResolver(updateRecurringExpenseSchema),
  })

  const isManual = watch('isManual')
  const recurrenceInterval = watch('recurrenceInterval')

  // Reset form when expense changes
  useEffect(() => {
    if (expense) {
      reset({
        name: expense.name,
        amount: expense.amount,
        recurrenceInterval: expense.recurrenceInterval,
        isManual: expense.isManual,
      })
    }
  }, [expense, reset])

  const onSubmit = async (data: UpdateRecurringExpenseFormData) => {
    if (!expense) return

    try {
      await updateExpense.mutateAsync({
        id: expense.id,
        data: {
          name: data.name,
          amount: data.amount,
          recurrenceInterval: data.recurrenceInterval,
          isManual: data.isManual,
        },
      })
      toast.success('Recurring expense updated')
      onClose()
    } catch {
      // Error displayed inline
    }
  }

  const getNextDueDisplay = () => {
    if (!expense) return null
    if (expense.lastUsedDate === null) return 'Never used'
    if (expense.isDue) return 'Due now'
    if (expense.nextDueDate) {
      const date = new Date(expense.nextDueDate)
      return formatMonthYear(date.getMonth() + 1, date.getFullYear())
    }
    return 'Unknown'
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Recurring Expense</DialogTitle>
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
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-amount">Amount *</Label>
            <Input
              id="edit-amount"
              type="number"
              step="0.01"
              {...register('amount', { valueAsNumber: true })}
            />
            {errors.amount && (
              <p className="text-sm text-destructive">{errors.amount.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-interval">Interval *</Label>
            <Select
              value={recurrenceInterval}
              onValueChange={(value) => setValue('recurrenceInterval', value as UpdateRecurringExpenseFormData['recurrenceInterval'])}
            >
              <SelectTrigger id="edit-interval">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {INTERVAL_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="edit-isManual"
              checked={isManual}
              onCheckedChange={(checked) => setValue('isManual', checked === true)}
            />
            <Label htmlFor="edit-isManual" className="text-sm font-normal cursor-pointer">
              Requires manual payment
            </Label>
          </div>

          {/* Read-only info */}
          <div className="p-3 bg-muted rounded-xl space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Last used:</span>
              <span className="text-foreground">
                {expense?.lastUsedDate ? formatDate(expense.lastUsedDate) : 'Never'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Next due:</span>
              <span className="text-foreground">{getNextDueDisplay()}</span>
            </div>
          </div>

          {updateExpense.error && (
            <p className="text-sm text-destructive">
              {updateExpense.error.message}
            </p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateExpense.isPending}>
              {updateExpense.isPending ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
