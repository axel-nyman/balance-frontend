# Story 6.5: Add/Edit Expense Modal

**As a** user  
**I want to** add or edit expense items in my budget  
**So that** I can track my spending

### Implementation

**Create `src/components/budget-detail/ExpenseItemModal.tsx`:**

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
import { useAddBudgetExpense, useUpdateBudgetExpense } from '@/hooks'
import { expenseItemSchema, type ExpenseItemFormData } from './schemas'
import type { BudgetExpenseItem } from '@/api/types'

interface ExpenseItemModalProps {
  budgetId: string
  item: BudgetExpenseItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ExpenseItemModal({ budgetId, item, open, onOpenChange }: ExpenseItemModalProps) {
  const addExpense = useAddBudgetExpense()
  const updateExpense = useUpdateBudgetExpense()
  const isEditing = item !== null

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ExpenseItemFormData>({
    resolver: zodResolver(expenseItemSchema),
    defaultValues: {
      name: '',
      amount: undefined,
    },
  })

  useEffect(() => {
    if (item) {
      reset({
        name: item.name,
        amount: item.amount,
      })
    } else {
      reset({
        name: '',
        amount: undefined,
      })
    }
  }, [item, reset])

  const onSubmit = async (data: ExpenseItemFormData) => {
    try {
      if (isEditing && item) {
        await updateExpense.mutateAsync({
          budgetId,
          itemId: item.id,
          data,
        })
        toast.success('Expense updated')
      } else {
        await addExpense.mutateAsync({
          budgetId,
          data,
        })
        toast.success('Expense added')
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

  const mutation = isEditing ? updateExpense : addExpense

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Expense' : 'Add Expense'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              {...register('name')}
              placeholder="e.g., Rent, Groceries"
              autoFocus
            />
            {errors.name && (
              <p className="text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="expense-amount">Amount *</Label>
            <Input
              id="expense-amount"
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

### Test File: `src/components/budget-detail/ExpenseItemModal.test.tsx`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import { ExpenseItemModal } from './ExpenseItemModal'
import { server } from '@/test/mocks/server'
import { http, HttpResponse } from 'msw'

describe('ExpenseItemModal', () => {
  const defaultProps = {
    budgetId: 'budget-123',
    item: null,
    open: true,
    onOpenChange: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders Add Expense title when creating', () => {
    render(<ExpenseItemModal {...defaultProps} />)
    
    expect(screen.getByText('Add Expense')).toBeInTheDocument()
  })

  it('renders Edit Expense title when editing', () => {
    render(
      <ExpenseItemModal
        {...defaultProps}
        item={{ id: '1', name: 'Rent', amount: 8000 }}
      />
    )
    
    expect(screen.getByText('Edit Expense')).toBeInTheDocument()
  })

  it('pre-fills form when editing', () => {
    render(
      <ExpenseItemModal
        {...defaultProps}
        item={{ id: '1', name: 'Rent', amount: 8000 }}
      />
    )
    
    expect(screen.getByDisplayValue('Rent')).toBeInTheDocument()
    expect(screen.getByDisplayValue('8000')).toBeInTheDocument()
  })

  it('calls API to create expense', async () => {
    let requestBody: unknown
    server.use(
      http.post('/api/budgets/budget-123/expenses', async ({ request }) => {
        requestBody = await request.json()
        return HttpResponse.json({ id: 'new-1' }, { status: 201 })
      })
    )

    const onOpenChange = vi.fn()
    render(<ExpenseItemModal {...defaultProps} onOpenChange={onOpenChange} />)
    
    await userEvent.type(screen.getByLabelText(/name/i), 'Groceries')
    await userEvent.type(screen.getByLabelText(/amount/i), '5000')
    await userEvent.click(screen.getByRole('button', { name: /save/i }))
    
    await waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledWith(false)
    })
    
    expect(requestBody).toEqual({
      name: 'Groceries',
      amount: 5000,
    })
  })

  it('calls API to update expense', async () => {
    let requestBody: unknown
    server.use(
      http.put('/api/budgets/budget-123/expenses/1', async ({ request }) => {
        requestBody = await request.json()
        return HttpResponse.json({ id: '1' })
      })
    )

    const onOpenChange = vi.fn()
    render(
      <ExpenseItemModal
        {...defaultProps}
        item={{ id: '1', name: 'Rent', amount: 8000 }}
        onOpenChange={onOpenChange}
      />
    )
    
    await userEvent.clear(screen.getByLabelText(/amount/i))
    await userEvent.type(screen.getByLabelText(/amount/i), '8500')
    await userEvent.click(screen.getByRole('button', { name: /save/i }))
    
    await waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledWith(false)
    })
    
    expect(requestBody).toEqual({
      name: 'Rent',
      amount: 8500,
    })
  })
})
```

### Definition of Done

- [ ] Tests pass
- [ ] Create and edit modes work
- [ ] API calls succeed

---