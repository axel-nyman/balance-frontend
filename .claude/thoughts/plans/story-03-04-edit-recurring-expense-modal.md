# Story 3.4: Edit Recurring Expense Modal

**As a** user  
**I want to** edit an existing recurring expense template  
**So that** I can update amounts or change settings

### Acceptance Criteria

- [ ] Modal opens when edit button or row is clicked
- [ ] Form pre-filled with current values
- [ ] Can update name, amount, interval, and manual flag
- [ ] Shows last used date and next due date (read-only)
- [ ] Success: Close modal, show toast, refresh list
- [ ] Error: Show error message inline

### Implementation

**Create `src/components/recurring-expenses/EditRecurringExpenseModal.tsx`:**

```typescript
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
    } catch (error) {
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
              <p className="text-sm text-red-600">{errors.name.message}</p>
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
              <p className="text-sm text-red-600">{errors.amount.message}</p>
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
          <div className="p-3 bg-gray-50 rounded-lg space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Last used:</span>
              <span className="text-gray-900">
                {expense?.lastUsedDate ? formatDate(expense.lastUsedDate) : 'Never'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Next due:</span>
              <span className="text-gray-900">{getNextDueDisplay()}</span>
            </div>
          </div>

          {updateExpense.error && (
            <p className="text-sm text-red-600">
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
```

### Test File: `src/components/recurring-expenses/EditRecurringExpenseModal.test.tsx`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import { EditRecurringExpenseModal } from './EditRecurringExpenseModal'
import { server } from '@/test/mocks/server'
import { http, HttpResponse } from 'msw'
import type { RecurringExpense } from '@/api/types'

const mockExpense: RecurringExpense = {
  id: '123',
  name: 'Rent',
  amount: 8000,
  recurrenceInterval: 'MONTHLY',
  isManual: true,
  lastUsedDate: '2025-01-15',
  nextDueDate: '2025-02-15',
  isDue: false,
  createdAt: '2025-01-01',
}

describe('EditRecurringExpenseModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders when expense is provided', () => {
    render(<EditRecurringExpenseModal expense={mockExpense} onClose={vi.fn()} />)
    
    expect(screen.getByText('Edit Recurring Expense')).toBeInTheDocument()
  })

  it('does not render when expense is null', () => {
    render(<EditRecurringExpenseModal expense={null} onClose={vi.fn()} />)
    
    expect(screen.queryByText('Edit Recurring Expense')).not.toBeInTheDocument()
  })

  it('pre-fills form with expense values', () => {
    render(<EditRecurringExpenseModal expense={mockExpense} onClose={vi.fn()} />)
    
    expect(screen.getByDisplayValue('Rent')).toBeInTheDocument()
    expect(screen.getByDisplayValue('8000')).toBeInTheDocument()
    expect(screen.getByText('Monthly')).toBeInTheDocument()
  })

  it('shows manual checkbox as checked when isManual is true', () => {
    render(<EditRecurringExpenseModal expense={mockExpense} onClose={vi.fn()} />)
    
    const checkbox = screen.getByRole('checkbox')
    expect(checkbox).toBeChecked()
  })

  it('shows last used and next due dates', () => {
    render(<EditRecurringExpenseModal expense={mockExpense} onClose={vi.fn()} />)
    
    expect(screen.getByText(/last used/i)).toBeInTheDocument()
    expect(screen.getByText(/next due/i)).toBeInTheDocument()
  })

  it('shows "Never" for last used when null', () => {
    const neverUsedExpense = { ...mockExpense, lastUsedDate: null, nextDueDate: null }
    render(<EditRecurringExpenseModal expense={neverUsedExpense} onClose={vi.fn()} />)
    
    expect(screen.getByText('Never')).toBeInTheDocument()
  })

  it('submits updated data', async () => {
    let requestBody: unknown
    server.use(
      http.put('/api/recurring-expenses/123', async ({ request }) => {
        requestBody = await request.json()
        return HttpResponse.json({ ...mockExpense, name: 'Updated' })
      })
    )

    const onClose = vi.fn()
    render(<EditRecurringExpenseModal expense={mockExpense} onClose={onClose} />)
    
    await userEvent.clear(screen.getByLabelText(/name/i))
    await userEvent.type(screen.getByLabelText(/name/i), 'Updated Rent')
    await userEvent.click(screen.getByRole('button', { name: /save/i }))
    
    await waitFor(() => {
      expect(onClose).toHaveBeenCalled()
    })
    
    expect(requestBody).toMatchObject({
      name: 'Updated Rent',
    })
  })

  it('calls onClose when cancel is clicked', async () => {
    const onClose = vi.fn()
    render(<EditRecurringExpenseModal expense={mockExpense} onClose={onClose} />)
    
    await userEvent.click(screen.getByRole('button', { name: /cancel/i }))
    
    expect(onClose).toHaveBeenCalled()
  })

  it('shows validation error when name is cleared', async () => {
    render(<EditRecurringExpenseModal expense={mockExpense} onClose={vi.fn()} />)
    
    await userEvent.clear(screen.getByLabelText(/name/i))
    await userEvent.click(screen.getByRole('button', { name: /save/i }))
    
    expect(await screen.findByText(/name is required/i)).toBeInTheDocument()
  })
})
```

### Definition of Done

- [ ] All tests pass
- [ ] Modal shows when expense provided
- [ ] Form pre-fills with current values
- [ ] Read-only info (last used, next due) displays
- [ ] Updates save correctly

---