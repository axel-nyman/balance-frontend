# Story 3.5: Delete Recurring Expense Flow

**As a** user  
**I want to** delete a recurring expense template I no longer need  
**So that** it doesn't clutter my templates list

### Acceptance Criteria

- [x] Confirmation dialog shows when delete clicked
- [x] Dialog shows expense name
- [x] Clarifies that existing budget expenses are not affected
- [x] Successful delete: Close dialog, show toast, refresh list

### Implementation

**Create `src/components/recurring-expenses/DeleteRecurringExpenseDialog.tsx`:**

```typescript
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/shared'
import { useDeleteRecurringExpense } from '@/hooks'
import type { RecurringExpense } from '@/api/types'

interface DeleteRecurringExpenseDialogProps {
  expense: RecurringExpense | null
  onClose: () => void
}

export function DeleteRecurringExpenseDialog({ expense, onClose }: DeleteRecurringExpenseDialogProps) {
  const deleteExpense = useDeleteRecurringExpense()
  const isOpen = expense !== null

  const handleConfirm = async () => {
    if (!expense) return

    try {
      await deleteExpense.mutateAsync(expense.id)
      toast.success('Recurring expense deleted')
      onClose()
    } catch (error) {
      toast.error(deleteExpense.error?.message || 'Failed to delete recurring expense')
    }
  }

  return (
    <ConfirmDialog
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
      title="Delete Recurring Expense"
      description={`Are you sure you want to delete "${expense?.name}"? This will not affect any existing budget expenses created from this template.`}
      confirmLabel="Delete"
      variant="destructive"
      onConfirm={handleConfirm}
      loading={deleteExpense.isPending}
    />
  )
}
```

### Test File: `src/components/recurring-expenses/DeleteRecurringExpenseDialog.test.tsx`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import { DeleteRecurringExpenseDialog } from './DeleteRecurringExpenseDialog'
import { server } from '@/test/mocks/server'
import { http, HttpResponse } from 'msw'
import type { RecurringExpense } from '@/api/types'

const mockExpense: RecurringExpense = {
  id: '123',
  name: 'Netflix',
  amount: 169,
  recurrenceInterval: 'MONTHLY',
  isManual: false,
  lastUsedDate: '2025-01-01',
  nextDueDate: '2025-02-01',
  isDue: false,
  createdAt: '2025-01-01',
}

describe('DeleteRecurringExpenseDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders when expense is provided', () => {
    render(<DeleteRecurringExpenseDialog expense={mockExpense} onClose={vi.fn()} />)
    
    expect(screen.getByText(/delete recurring expense/i)).toBeInTheDocument()
  })

  it('does not render when expense is null', () => {
    render(<DeleteRecurringExpenseDialog expense={null} onClose={vi.fn()} />)
    
    expect(screen.queryByText(/delete recurring expense/i)).not.toBeInTheDocument()
  })

  it('shows expense name in confirmation message', () => {
    render(<DeleteRecurringExpenseDialog expense={mockExpense} onClose={vi.fn()} />)
    
    expect(screen.getByText(/Netflix/)).toBeInTheDocument()
  })

  it('mentions that existing expenses are not affected', () => {
    render(<DeleteRecurringExpenseDialog expense={mockExpense} onClose={vi.fn()} />)
    
    expect(screen.getByText(/will not affect/i)).toBeInTheDocument()
  })

  it('deletes expense on confirm', async () => {
    server.use(
      http.delete('/api/recurring-expenses/123', () => {
        return new HttpResponse(null, { status: 204 })
      })
    )

    const onClose = vi.fn()
    render(<DeleteRecurringExpenseDialog expense={mockExpense} onClose={onClose} />)
    
    await userEvent.click(screen.getByRole('button', { name: /delete/i }))
    
    await waitFor(() => {
      expect(onClose).toHaveBeenCalled()
    })
  })

  it('calls onClose when cancel is clicked', async () => {
    const onClose = vi.fn()
    render(<DeleteRecurringExpenseDialog expense={mockExpense} onClose={onClose} />)
    
    await userEvent.click(screen.getByRole('button', { name: /cancel/i }))
    
    expect(onClose).toHaveBeenCalled()
  })
})
```

### Definition of Done

- [x] All tests pass
- [x] Confirmation dialog shows expense name
- [x] Message clarifies existing expenses unaffected
- [x] Successful deletion removes template

---

## Final: Update RecurringExpensesPage with All Components

**Update `src/pages/RecurringExpensesPage.tsx`:**

```typescript
import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/shared'
import {
  RecurringExpensesList,
  CreateRecurringExpenseModal,
  EditRecurringExpenseModal,
  DeleteRecurringExpenseDialog,
} from '@/components/recurring-expenses'
import { useRecurringExpenses } from '@/hooks'
import type { RecurringExpense } from '@/api/types'

export function RecurringExpensesPage() {
  const { data, isLoading, isError, refetch } = useRecurringExpenses()
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState<RecurringExpense | null>(null)
  const [deletingExpense, setDeletingExpense] = useState<RecurringExpense | null>(null)

  const handleExpenseClick = (expense: RecurringExpense) => {
    setEditingExpense(expense)
  }

  return (
    <div>
      <PageHeader
        title="Recurring Expenses"
        description="Manage templates for regular expenses"
        action={
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Recurring Expense
          </Button>
        }
      />

      <RecurringExpensesList
        expenses={data?.expenses ?? []}
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
        onEdit={setEditingExpense}
        onDelete={setDeletingExpense}
        onClick={handleExpenseClick}
        onCreateNew={() => setIsCreateModalOpen(true)}
      />

      <CreateRecurringExpenseModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
      />

      <EditRecurringExpenseModal
        expense={editingExpense}
        onClose={() => setEditingExpense(null)}
      />

      <DeleteRecurringExpenseDialog
        expense={deletingExpense}
        onClose={() => setDeletingExpense(null)}
      />
    </div>
  )
}
```

### Update Barrel Export

**Final `src/components/recurring-expenses/index.ts`:**

```typescript
export { DueStatusIndicator } from './DueStatusIndicator'
export { RecurringExpenseRow } from './RecurringExpenseRow'
export { RecurringExpenseCard } from './RecurringExpenseCard'
export { RecurringExpensesList } from './RecurringExpensesList'
export { CreateRecurringExpenseModal } from './CreateRecurringExpenseModal'
export { EditRecurringExpenseModal } from './EditRecurringExpenseModal'
export { DeleteRecurringExpenseDialog } from './DeleteRecurringExpenseDialog'
export * from './schemas'
```

---

## Epic 3 Complete File Structure

```
src/
├── components/
│   └── recurring-expenses/
│       ├── CreateRecurringExpenseModal.tsx
│       ├── DeleteRecurringExpenseDialog.tsx
│       ├── DueStatusIndicator.tsx
│       ├── EditRecurringExpenseModal.tsx
│       ├── index.ts
│       ├── RecurringExpenseCard.tsx
│       ├── RecurringExpenseRow.tsx
│       ├── RecurringExpensesList.tsx
│       └── schemas.ts
└── pages/
    └── RecurringExpensesPage.tsx
```

---

## Test Summary

| Component | Test File | Tests (approx) |
|-----------|-----------|----------------|
| RecurringExpensesPage | RecurringExpensesPage.test.tsx | 2 |
| DueStatusIndicator | DueStatusIndicator.test.tsx | 6 |
| RecurringExpensesList | RecurringExpensesList.test.tsx | 12 |
| CreateRecurringExpenseModal | CreateRecurringExpenseModal.test.tsx | 9 |
| EditRecurringExpenseModal | EditRecurringExpenseModal.test.tsx | 8 |
| DeleteRecurringExpenseDialog | DeleteRecurringExpenseDialog.test.tsx | 5 |

**Total: ~42 tests for Epic 3**

---

## MSW Handlers Update

Add these handlers to `src/test/mocks/handlers.ts`:

```typescript
// Add to existing handlers array:

// Create recurring expense
http.post('/api/recurring-expenses', async ({ request }) => {
  const body = await request.json() as { name: string; amount: number }
  return HttpResponse.json({
    id: crypto.randomUUID(),
    name: body.name,
    amount: body.amount,
    recurrenceInterval: 'MONTHLY',
    isManual: false,
    lastUsedDate: null,
    nextDueDate: null,
    isDue: false,
    createdAt: new Date().toISOString(),
  }, { status: 201 })
}),

// Update recurring expense
http.put('/api/recurring-expenses/:id', async ({ request, params }) => {
  const body = await request.json()
  return HttpResponse.json({
    id: params.id,
    ...body,
    lastUsedDate: null,
    nextDueDate: null,
    isDue: false,
    createdAt: new Date().toISOString(),
  })
}),

// Delete recurring expense
http.delete('/api/recurring-expenses/:id', () => {
  return new HttpResponse(null, { status: 204 })
}),
```

---

## Next Steps

After completing Epic 3:

1. [x] Run all tests: `npm test`
2. [x] Test manually in browser
3. Verify due status indicators display correctly
4. Verify sorting (due items first)
5. Proceed to Epic 4: Budget List

---

*Last updated: December 2024*