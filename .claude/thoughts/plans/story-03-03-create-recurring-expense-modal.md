# Story 3.3: Create Recurring Expense Modal

**As a** user  
**I want to** create a new recurring expense template  
**So that** I can quickly add it to future budgets

### Acceptance Criteria

- [x] Modal opens when "New Recurring Expense" button is clicked
- [x] Form has fields: Name (required), Amount (required), Interval (required), Manual Payment checkbox
- [x] Interval dropdown: Monthly, Quarterly, Biannually, Yearly
- [x] Validation: Name required, Amount must be positive
- [x] Submit creates template via API
- [x] Success: Close modal, show toast, refresh list
- [x] Error: Show error message inline
- [x] Cancel closes modal without changes

### Form Schema

**Create `src/components/recurring-expenses/schemas.ts`:**

```typescript
import { z } from 'zod'

export const createRecurringExpenseSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  amount: z
    .number({ invalid_type_error: 'Must be a number' })
    .positive('Amount must be greater than 0'),
  recurrenceInterval: z.enum(['MONTHLY', 'QUARTERLY', 'BIANNUALLY', 'YEARLY'], {
    required_error: 'Please select an interval',
  }),
  isManual: z.boolean().default(false),
})

export const updateRecurringExpenseSchema = createRecurringExpenseSchema

export type CreateRecurringExpenseFormData = z.infer<typeof createRecurringExpenseSchema>
export type UpdateRecurringExpenseFormData = z.infer<typeof updateRecurringExpenseSchema>
```

### Implementation

**Create `src/components/recurring-expenses/CreateRecurringExpenseModal.tsx`:**

```typescript
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
    } catch (error) {
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
              <p className="text-sm text-red-600">{errors.recurrenceInterval.message}</p>
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
          <p className="text-xs text-gray-500 -mt-2">
            If checked, this will create a payment todo item when the budget is locked.
          </p>

          {createExpense.error && (
            <p className="text-sm text-red-600">
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
```

### Test File: `src/components/recurring-expenses/CreateRecurringExpenseModal.test.tsx`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import { CreateRecurringExpenseModal } from './CreateRecurringExpenseModal'
import { server } from '@/test/mocks/server'
import { http, HttpResponse } from 'msw'

describe('CreateRecurringExpenseModal', () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders form fields when open', () => {
    render(<CreateRecurringExpenseModal {...defaultProps} />)
    
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/amount/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/interval/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/manual payment/i)).toBeInTheDocument()
  })

  it('does not render when closed', () => {
    render(<CreateRecurringExpenseModal {...defaultProps} open={false} />)
    
    expect(screen.queryByLabelText(/name/i)).not.toBeInTheDocument()
  })

  it('shows validation error when name is empty', async () => {
    render(<CreateRecurringExpenseModal {...defaultProps} />)
    
    await userEvent.click(screen.getByRole('button', { name: /create/i }))
    
    expect(await screen.findByText(/name is required/i)).toBeInTheDocument()
  })

  it('shows validation error for invalid amount', async () => {
    render(<CreateRecurringExpenseModal {...defaultProps} />)
    
    await userEvent.type(screen.getByLabelText(/name/i), 'Test')
    await userEvent.type(screen.getByLabelText(/amount/i), '-100')
    await userEvent.click(screen.getByRole('button', { name: /create/i }))
    
    expect(await screen.findByText(/must be greater than 0/i)).toBeInTheDocument()
  })

  it('defaults interval to Monthly', () => {
    render(<CreateRecurringExpenseModal {...defaultProps} />)
    
    expect(screen.getByText('Monthly')).toBeInTheDocument()
  })

  it('submits form with valid data', async () => {
    let requestBody: unknown
    server.use(
      http.post('/api/recurring-expenses', async ({ request }) => {
        requestBody = await request.json()
        return HttpResponse.json({ id: '123', name: 'Rent' }, { status: 201 })
      })
    )

    const onOpenChange = vi.fn()
    render(<CreateRecurringExpenseModal open={true} onOpenChange={onOpenChange} />)
    
    await userEvent.type(screen.getByLabelText(/name/i), 'Rent')
    await userEvent.type(screen.getByLabelText(/amount/i), '8000')
    await userEvent.click(screen.getByLabelText(/manual payment/i))
    await userEvent.click(screen.getByRole('button', { name: /create/i }))
    
    await waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledWith(false)
    })
    
    expect(requestBody).toEqual({
      name: 'Rent',
      amount: 8000,
      recurrenceInterval: 'MONTHLY',
      isManual: true,
    })
  })

  it('allows selecting different intervals', async () => {
    render(<CreateRecurringExpenseModal {...defaultProps} />)
    
    await userEvent.click(screen.getByRole('combobox'))
    await userEvent.click(screen.getByText('Yearly'))
    
    expect(screen.getByText('Yearly')).toBeInTheDocument()
  })

  it('shows error message on API failure', async () => {
    server.use(
      http.post('/api/recurring-expenses', () => {
        return HttpResponse.json(
          { error: 'Recurring expense with this name already exists' },
          { status: 400 }
        )
      })
    )

    render(<CreateRecurringExpenseModal {...defaultProps} />)
    
    await userEvent.type(screen.getByLabelText(/name/i), 'Existing')
    await userEvent.type(screen.getByLabelText(/amount/i), '100')
    await userEvent.click(screen.getByRole('button', { name: /create/i }))
    
    expect(await screen.findByText(/already exists/i)).toBeInTheDocument()
  })

  it('closes modal when cancel is clicked', async () => {
    const onOpenChange = vi.fn()
    render(<CreateRecurringExpenseModal open={true} onOpenChange={onOpenChange} />)
    
    await userEvent.click(screen.getByRole('button', { name: /cancel/i }))
    
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('disables submit button while submitting', async () => {
    server.use(
      http.post('/api/recurring-expenses', async () => {
        await new Promise(resolve => setTimeout(resolve, 100))
        return HttpResponse.json({ id: '123' }, { status: 201 })
      })
    )

    render(<CreateRecurringExpenseModal {...defaultProps} />)
    
    await userEvent.type(screen.getByLabelText(/name/i), 'Test')
    await userEvent.type(screen.getByLabelText(/amount/i), '100')
    await userEvent.click(screen.getByRole('button', { name: /create/i }))
    
    expect(screen.getByRole('button', { name: /creating/i })).toBeDisabled()
  })
})
```

### Definition of Done

- [x] All tests pass
- [x] Modal opens/closes correctly
- [x] Form validation works
- [x] Interval dropdown works
- [x] Manual payment checkbox works
- [x] Successful submission creates expense
- [x] Error messages display

---