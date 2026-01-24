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
import { useCreateRecurringExpense } from '@/hooks'
import { createRecurringExpenseSchema, type CreateRecurringExpenseFormData } from './schemas'

interface CreateRecurringExpenseModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const INTERVAL_OPTIONS = [
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'QUARTERLY', label: 'Quarterly' },
  { value: 'BIANNUALLY', label: 'Biannually' },
  { value: 'YEARLY', label: 'Yearly' },
]

export function CreateRecurringExpenseModal({ open, onOpenChange }: CreateRecurringExpenseModalProps) {
  const createExpense = useCreateRecurringExpense()

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateRecurringExpenseFormData>({
    resolver: zodResolver(createRecurringExpenseSchema),
    defaultValues: {
      name: '',
      amount: undefined,
      recurrenceInterval: 'MONTHLY',
      isManual: false,
    },
  })

  const isManual = watch('isManual')
  const recurrenceInterval = watch('recurrenceInterval')

  const onSubmit = async (data: CreateRecurringExpenseFormData) => {
    try {
      await createExpense.mutateAsync({
        name: data.name,
        amount: data.amount,
        recurrenceInterval: data.recurrenceInterval,
        isManual: data.isManual,
      })
      toast.success('Recurring expense created')
      reset()
      onOpenChange(false)
    } catch {
      // Error is handled by the mutation and displayed inline
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
          <DialogTitle>New Recurring Expense</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              {...register('name')}
              placeholder="e.g., Rent, Netflix, Insurance"
              autoFocus
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
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
              <p className="text-sm text-destructive">{errors.amount.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="interval">Interval *</Label>
            <Select
              value={recurrenceInterval}
              onValueChange={(value) => setValue('recurrenceInterval', value as CreateRecurringExpenseFormData['recurrenceInterval'])}
            >
              <SelectTrigger id="interval">
                <SelectValue placeholder="Select interval" />
              </SelectTrigger>
              <SelectContent>
                {INTERVAL_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.recurrenceInterval && (
              <p className="text-sm text-destructive">{errors.recurrenceInterval.message}</p>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="isManual"
              checked={isManual}
              onCheckedChange={(checked) => setValue('isManual', checked === true)}
            />
            <Label htmlFor="isManual" className="text-sm font-normal cursor-pointer">
              Requires manual payment
            </Label>
          </div>
          <p className="text-xs text-muted-foreground -mt-2">
            If checked, this will create a payment todo item when the budget is locked.
          </p>

          {createExpense.error && (
            <p className="text-sm text-destructive">
              {createExpense.error.message}
            </p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={createExpense.isPending}>
              {createExpense.isPending ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
