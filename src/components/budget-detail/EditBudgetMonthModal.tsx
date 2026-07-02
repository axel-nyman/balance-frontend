import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { AlertCircle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useUpdateBudget, useBudgets } from '@/hooks'
import { editBudgetMonthSchema, type EditBudgetMonthFormData } from './schemas'

const MONTHS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
]

function getMonthLabel(month: number): string {
  return MONTHS.find((m) => m.value === month)?.label ?? ''
}

// Offer the same three-year window as the wizard, plus the budget's own year so
// an older budget's current year stays selectable.
function getYearOptions(currentYear: number): number[] {
  const now = new Date().getFullYear()
  const years = new Set([now - 1, now, now + 1, currentYear])
  return [...years].sort((a, b) => a - b)
}

interface EditBudgetMonthModalProps {
  budgetId: string
  month: number
  year: number
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditBudgetMonthModal({
  budgetId,
  month,
  year,
  open,
  onOpenChange,
}: EditBudgetMonthModalProps) {
  const updateBudget = useUpdateBudget(budgetId)
  const { data: budgetsData } = useBudgets()

  const {
    control,
    handleSubmit,
    reset,
    watch,
  } = useForm<EditBudgetMonthFormData>({
    resolver: zodResolver(editBudgetMonthSchema),
    defaultValues: { month, year },
  })

  // Reset to the budget's current month/year whenever the modal is (re)opened.
  useEffect(() => {
    if (open) {
      reset({ month, year })
    }
  }, [open, month, year, reset])

  const selectedMonth = watch('month')
  const selectedYear = watch('year')

  // Mirror the wizard's duplicate guard, excluding the budget being edited so a
  // no-op (same month/year) save stays allowed.
  const isDuplicate = (budgetsData?.budgets ?? []).some(
    (b) => b.id !== budgetId && b.month === selectedMonth && b.year === selectedYear
  )

  const yearOptions = getYearOptions(year)

  const onSubmit = async (data: EditBudgetMonthFormData) => {
    try {
      await updateBudget.mutateAsync(data)
      toast.success('Budget month updated')
      onOpenChange(false)
    } catch {
      // Error displayed inline
    }
  }

  const handleClose = () => {
    reset({ month, year })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Month</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Choose a different month and year for this budget. All income,
            expenses, and savings stay unchanged.
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="month">Month</Label>
              <Controller
                control={control}
                name="month"
                render={({ field }) => (
                  <Select
                    value={field.value?.toString() ?? ''}
                    onValueChange={(value) => field.onChange(parseInt(value, 10))}
                  >
                    <SelectTrigger id="month">
                      <SelectValue placeholder="Select month" />
                    </SelectTrigger>
                    <SelectContent>
                      {MONTHS.map((m) => (
                        <SelectItem key={m.value} value={m.value.toString()}>
                          {m.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="year">Year</Label>
              <Controller
                control={control}
                name="year"
                render={({ field }) => (
                  <Select
                    value={field.value?.toString() ?? ''}
                    onValueChange={(value) => field.onChange(parseInt(value, 10))}
                  >
                    <SelectTrigger id="year">
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent>
                      {yearOptions.map((y) => (
                        <SelectItem key={y} value={y.toString()}>
                          {y}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          {isDuplicate && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                A budget already exists for {getMonthLabel(selectedMonth)} {selectedYear}.
                Please select a different month or year.
              </AlertDescription>
            </Alert>
          )}

          {updateBudget.error && (
            <p className="text-sm text-destructive">{updateBudget.error.message}</p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateBudget.isPending || isDuplicate}>
              {updateBudget.isPending ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
