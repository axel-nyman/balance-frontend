# Story 6.7: Delete Item Dialogs

**As a** user  
**I want to** delete items from my budget  
**So that** I can remove incorrect entries

### Implementation

**Create `src/components/budget-detail/DeleteItemDialog.tsx`:**

```typescript
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/shared'
import {
  useDeleteBudgetIncome,
  useDeleteBudgetExpense,
  useDeleteBudgetSavings,
} from '@/hooks'

type ItemType = 'income' | 'expense' | 'savings'

interface DeleteItemDialogProps {
  budgetId: string
  itemId: string | null
  itemName: string
  itemType: ItemType
  onClose: () => void
}

export function DeleteItemDialog({
  budgetId,
  itemId,
  itemName,
  itemType,
  onClose,
}: DeleteItemDialogProps) {
  const deleteIncome = useDeleteBudgetIncome()
  const deleteExpense = useDeleteBudgetExpense()
  const deleteSavings = useDeleteBudgetSavings()

  const isOpen = itemId !== null

  const getMutation = () => {
    switch (itemType) {
      case 'income':
        return deleteIncome
      case 'expense':
        return deleteExpense
      case 'savings':
        return deleteSavings
    }
  }

  const mutation = getMutation()

  const handleConfirm = async () => {
    if (!itemId) return

    try {
      await mutation.mutateAsync({ budgetId, itemId })
      toast.success(`${itemType.charAt(0).toUpperCase() + itemType.slice(1)} deleted`)
      onClose()
    } catch (error) {
      toast.error(`Failed to delete ${itemType}`)
    }
  }

  const typeLabels: Record<ItemType, string> = {
    income: 'Income',
    expense: 'Expense',
    savings: 'Savings',
  }

  return (
    <ConfirmDialog
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
      title={`Delete ${typeLabels[itemType]}`}
      description={`Are you sure you want to delete "${itemName}"? This action cannot be undone.`}
      confirmLabel="Delete"
      variant="destructive"
      onConfirm={handleConfirm}
      loading={mutation.isPending}
    />
  )
}
```

### Test File: `src/components/budget-detail/DeleteItemDialog.test.tsx`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import { DeleteItemDialog } from './DeleteItemDialog'
import { server } from '@/test/mocks/server'
import { http, HttpResponse } from 'msw'

describe('DeleteItemDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders when itemId is provided', () => {
    render(
      <DeleteItemDialog
        budgetId="budget-123"
        itemId="item-1"
        itemName="Salary"
        itemType="income"
        onClose={vi.fn()}
      />
    )
    
    expect(screen.getByText(/delete income/i)).toBeInTheDocument()
  })

  it('does not render when itemId is null', () => {
    render(
      <DeleteItemDialog
        budgetId="budget-123"
        itemId={null}
        itemName="Salary"
        itemType="income"
        onClose={vi.fn()}
      />
    )
    
    expect(screen.queryByText(/delete income/i)).not.toBeInTheDocument()
  })

  it('shows item name in confirmation', () => {
    render(
      <DeleteItemDialog
        budgetId="budget-123"
        itemId="item-1"
        itemName="Rent"
        itemType="expense"
        onClose={vi.fn()}
      />
    )
    
    expect(screen.getByText(/Rent/)).toBeInTheDocument()
  })

  it('deletes income item', async () => {
    server.use(
      http.delete('/api/budgets/budget-123/income/item-1', () => {
        return new HttpResponse(null, { status: 204 })
      })
    )

    const onClose = vi.fn()
    render(
      <DeleteItemDialog
        budgetId="budget-123"
        itemId="item-1"
        itemName="Salary"
        itemType="income"
        onClose={onClose}
      />
    )
    
    await userEvent.click(screen.getByRole('button', { name: /delete/i }))
    
    await waitFor(() => {
      expect(onClose).toHaveBeenCalled()
    })
  })

  it('deletes expense item', async () => {
    server.use(
      http.delete('/api/budgets/budget-123/expenses/item-1', () => {
        return new HttpResponse(null, { status: 204 })
      })
    )

    const onClose = vi.fn()
    render(
      <DeleteItemDialog
        budgetId="budget-123"
        itemId="item-1"
        itemName="Rent"
        itemType="expense"
        onClose={onClose}
      />
    )
    
    await userEvent.click(screen.getByRole('button', { name: /delete/i }))
    
    await waitFor(() => {
      expect(onClose).toHaveBeenCalled()
    })
  })

  it('deletes savings item', async () => {
    server.use(
      http.delete('/api/budgets/budget-123/savings/item-1', () => {
        return new HttpResponse(null, { status: 204 })
      })
    )

    const onClose = vi.fn()
    render(
      <DeleteItemDialog
        budgetId="budget-123"
        itemId="item-1"
        itemName="Emergency Fund"
        itemType="savings"
        onClose={onClose}
      />
    )
    
    await userEvent.click(screen.getByRole('button', { name: /delete/i }))
    
    await waitFor(() => {
      expect(onClose).toHaveBeenCalled()
    })
  })

  it('calls onClose when cancel is clicked', async () => {
    const onClose = vi.fn()
    render(
      <DeleteItemDialog
        budgetId="budget-123"
        itemId="item-1"
        itemName="Salary"
        itemType="income"
        onClose={onClose}
      />
    )
    
    await userEvent.click(screen.getByRole('button', { name: /cancel/i }))
    
    expect(onClose).toHaveBeenCalled()
  })
})
```

### Definition of Done

- [ ] Tests pass
- [ ] Delete works for all three item types
- [ ] Confirmation dialog shows item name

---