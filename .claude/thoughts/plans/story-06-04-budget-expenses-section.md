# Story 6.4: Add/Edit Income Modal

**As a** user  
**I want to** add or edit income items in my budget  
**So that** I can keep my budget up to date

### Acceptance Criteria

- [ ] Modal for adding new income
- [ ] Modal for editing existing income (pre-filled)
- [ ] Fields: Source (required), Amount (required, positive)
- [ ] Save button creates/updates via API
- [ ] Success: Close modal, refresh budget
- [ ] Error: Show inline error

### Implementation

**Create `src/components/budget-detail/schemas.ts`:**

```typescript
import { z } from 'zod'

export const incomeItemSchema = z.object({
  source: z.string().min(1, 'Source is required'),
  amount: z
    .number({ invalid_type_error: 'Must be a number' })
    .positive('Amount must be greater than 0'),
})

export const expenseItemSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  amount: z
    .number({ invalid_type_error: 'Must be a number' })
    .positive('Amount must be greater than 0'),
})

export const savingsItemSchema = z.object({
  targetAccountId: z.string().min(1, 'Account is required'),
  amount: z
    .number({ invalid_type_error: 'Must be a number' })
    .positive('Amount must be greater than 0'),
})

export type IncomeItemFormData = z.infer<typeof incomeItemSchema>
export type ExpenseItemFormData = z.infer<typeof expenseItemSchema>
export type SavingsItemFormData = z.infer<typeof savingsItemSchema>
```

**Create `src/components/budget-detail/IncomeItemModal.tsx`:**

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
import { useAddBudgetIncome, useUpdateBudgetIncome } from '@/hooks'
import { incomeItemSchema, type IncomeItemFormData } from './schemas'
import type { BudgetIncomeItem } from '@/api/types'

interface IncomeItemModalProps {
  budgetId: string
  item: BudgetIncomeItem | null // null = create mode
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function IncomeItemModal({ budgetId, item, open, onOpenChange }: IncomeItemModalProps) {
  const addIncome = useAddBudgetIncome()
  const updateIncome = useUpdateBudgetIncome()
  const isEditing = item !== null

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<IncomeItemFormData>({
    resolver: zodResolver(incomeItemSchema),
    defaultValues: {
      source: '',
      amount: undefined,
    },
  })

  // Reset form when item changes
  useEffect(() => {
    if (item) {
      reset({
        source: item.source,
        amount: item.amount,
      })
    } else {
      reset({
        source: '',
        amount: undefined,
      })
    }
  }, [item, reset])

  const onSubmit = async (data: IncomeItemFormData) => {
    try {
      if (isEditing && item) {
        await updateIncome.mutateAsync({
          budgetId,
          itemId: item.id,
          data,
        })
        toast.success('Income updated')
      } else {
        await addIncome.mutateAsync({
          budgetId,
          data,
        })
        toast.success('Income added')
      }
      onOpenChange(false)
    } catch (error) {
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
            <Label htmlFor="source">Source *</Label>
            <Input
              id="source"
              {...register('source')}
              placeholder="e.g., Salary, Freelance"
              autoFocus
            />
            {errors.source && (
              <p className="text-sm text-red-600">{errors.source.message}</p>
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
```

### Test File: `src/components/budget-detail/IncomeItemModal.test.tsx`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import { IncomeItemModal } from './IncomeItemModal'
import { server } from '@/test/mocks/server'
import { http, HttpResponse } from 'msw'

describe('IncomeItemModal', () => {
  const defaultProps = {
    budgetId: 'budget-123',
    item: null,
    open: true,
    onOpenChange: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders Add Income title when creating', () => {
    render(<IncomeItemModal {...defaultProps} />)
    
    expect(screen.getByText('Add Income')).toBeInTheDocument()
  })

  it('renders Edit Income title when editing', () => {
    render(
      <IncomeItemModal
        {...defaultProps}
        item={{ id: '1', source: 'Salary', amount: 50000 }}
      />
    )
    
    expect(screen.getByText('Edit Income')).toBeInTheDocument()
  })

  it('pre-fills form when editing', () => {
    render(
      <IncomeItemModal
        {...defaultProps}
        item={{ id: '1', source: 'Salary', amount: 50000 }}
      />
    )
    
    expect(screen.getByDisplayValue('Salary')).toBeInTheDocument()
    expect(screen.getByDisplayValue('50000')).toBeInTheDocument()
  })

  it('shows validation error for empty source', async () => {
    render(<IncomeItemModal {...defaultProps} />)
    
    await userEvent.click(screen.getByRole('button', { name: /save/i }))
    
    expect(await screen.findByText(/source is required/i)).toBeInTheDocument()
  })

  it('shows validation error for invalid amount', async () => {
    render(<IncomeItemModal {...defaultProps} />)
    
    await userEvent.type(screen.getByLabelText(/source/i), 'Test')
    await userEvent.type(screen.getByLabelText(/amount/i), '-100')
    await userEvent.click(screen.getByRole('button', { name: /save/i }))
    
    expect(await screen.findByText(/must be greater than 0/i)).toBeInTheDocument()
  })

  it('calls API to create income', async () => {
    let requestBody: unknown
    server.use(
      http.post('/api/budgets/budget-123/income', async ({ request }) => {
        requestBody = await request.json()
        return HttpResponse.json({ id: 'new-1' }, { status: 201 })
      })
    )

    const onOpenChange = vi.fn()
    render(<IncomeItemModal {...defaultProps} onOpenChange={onOpenChange} />)
    
    await userEvent.type(screen.getByLabelText(/source/i), 'Salary')
    await userEvent.type(screen.getByLabelText(/amount/i), '50000')
    await userEvent.click(screen.getByRole('button', { name: /save/i }))
    
    await waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledWith(false)
    })
    
    expect(requestBody).toEqual({
      source: 'Salary',
      amount: 50000,
    })
  })

  it('calls API to update income', async () => {
    let requestBody: unknown
    server.use(
      http.put('/api/budgets/budget-123/income/1', async ({ request }) => {
        requestBody = await request.json()
        return HttpResponse.json({ id: '1' })
      })
    )

    const onOpenChange = vi.fn()
    render(
      <IncomeItemModal
        {...defaultProps}
        item={{ id: '1', source: 'Salary', amount: 50000 }}
        onOpenChange={onOpenChange}
      />
    )
    
    await userEvent.clear(screen.getByLabelText(/amount/i))
    await userEvent.type(screen.getByLabelText(/amount/i), '55000')
    await userEvent.click(screen.getByRole('button', { name: /save/i }))
    
    await waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledWith(false)
    })
    
    expect(requestBody).toEqual({
      source: 'Salary',
      amount: 55000,
    })
  })

  it('closes on cancel', async () => {
    const onOpenChange = vi.fn()
    render(<IncomeItemModal {...defaultProps} onOpenChange={onOpenChange} />)
    
    await userEvent.click(screen.getByRole('button', { name: /cancel/i }))
    
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })
})
```

### Definition of Done

- [ ] Tests pass
- [ ] Create mode works
- [ ] Edit mode pre-fills and updates
- [ ] Validation works
- [ ] API calls succeed

---