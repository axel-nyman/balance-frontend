# Story 6.8: Lock/Unlock Budget

**As a** user  
**I want to** lock my budget when finalized or unlock to make changes  
**So that** I can control the budget lifecycle

### Acceptance Criteria

- [x] "Lock Budget" button shown for draft budgets
- [x] Confirmation dialog explains what locking does
- [x] Lock applies savings to account balances
- [x] Lock creates todo list for manual payments
- [x] "Unlock Budget" button shown for locked budgets
- [x] Unlock reverts savings from account balances
- [x] Success refreshes the page

### Implementation

**Create `src/components/budget-detail/BudgetActions.tsx`:**

```typescript
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, Unlock, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/shared'
import { useLockBudget, useUnlockBudget, useDeleteBudget } from '@/hooks'
import { BudgetStatus } from '@/api/types'

interface BudgetActionsProps {
  budgetId: string
  status: BudgetStatus
}

export function BudgetActions({ budgetId, status }: BudgetActionsProps) {
  const navigate = useNavigate()
  const lockBudget = useLockBudget()
  const unlockBudget = useUnlockBudget()
  const deleteBudget = useDeleteBudget()

  const [showLockDialog, setShowLockDialog] = useState(false)
  const [showUnlockDialog, setShowUnlockDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const isLocked = status === BudgetStatus.LOCKED

  const handleLock = async () => {
    try {
      await lockBudget.mutateAsync(budgetId)
      toast.success('Budget locked')
      setShowLockDialog(false)
    } catch (error) {
      toast.error(lockBudget.error?.message || 'Failed to lock budget')
    }
  }

  const handleUnlock = async () => {
    try {
      await unlockBudget.mutateAsync(budgetId)
      toast.success('Budget unlocked')
      setShowUnlockDialog(false)
    } catch (error) {
      toast.error(unlockBudget.error?.message || 'Failed to unlock budget')
    }
  }

  const handleDelete = async () => {
    try {
      await deleteBudget.mutateAsync(budgetId)
      toast.success('Budget deleted')
      navigate('/budgets')
    } catch (error) {
      toast.error(deleteBudget.error?.message || 'Failed to delete budget')
    }
  }

  return (
    <div className="flex flex-col sm:flex-row gap-3 p-4 bg-gray-50 rounded-lg">
      {isLocked ? (
        <Button
          variant="outline"
          onClick={() => setShowUnlockDialog(true)}
          className="flex-1 sm:flex-none"
        >
          <Unlock className="w-4 h-4 mr-2" />
          Unlock Budget
        </Button>
      ) : (
        <Button
          onClick={() => setShowLockDialog(true)}
          className="flex-1 sm:flex-none"
        >
          <Lock className="w-4 h-4 mr-2" />
          Lock Budget
        </Button>
      )}

      <Button
        variant="outline"
        onClick={() => setShowDeleteDialog(true)}
        className="flex-1 sm:flex-none text-red-600 hover:text-red-700 hover:bg-red-50"
      >
        <Trash2 className="w-4 h-4 mr-2" />
        Delete Budget
      </Button>

      {/* Lock Dialog */}
      <ConfirmDialog
        open={showLockDialog}
        onOpenChange={setShowLockDialog}
        title="Lock Budget"
        description="Locking this budget will:
• Apply planned savings to your account balances
• Create a todo list for manual payment expenses
• Prevent further changes until unlocked

Are you sure you want to lock this budget?"
        confirmLabel="Lock Budget"
        onConfirm={handleLock}
        loading={lockBudget.isPending}
      />

      {/* Unlock Dialog */}
      <ConfirmDialog
        open={showUnlockDialog}
        onOpenChange={setShowUnlockDialog}
        title="Unlock Budget"
        description="Unlocking this budget will:
• Revert savings from your account balances
• Remove the todo list

Are you sure you want to unlock this budget?"
        confirmLabel="Unlock Budget"
        onConfirm={handleUnlock}
        loading={unlockBudget.isPending}
      />

      {/* Delete Dialog */}
      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Delete Budget"
        description="Are you sure you want to delete this budget? This action cannot be undone. If the budget is locked, savings will be reverted first."
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDelete}
        loading={deleteBudget.isPending}
      />
    </div>
  )
}
```

### Test File: `src/components/budget-detail/BudgetActions.test.tsx`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import { BudgetActions } from './BudgetActions'
import { server } from '@/test/mocks/server'
import { http, HttpResponse } from 'msw'
import { BudgetStatus } from '@/api/types'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

describe('BudgetActions', () => {
  beforeEach(() => {
    mockNavigate.mockClear()
  })

  it('shows Lock button for draft budgets', () => {
    render(<BudgetActions budgetId="123" status={BudgetStatus.DRAFT} />)
    
    expect(screen.getByRole('button', { name: /lock budget/i })).toBeInTheDocument()
  })

  it('shows Unlock button for locked budgets', () => {
    render(<BudgetActions budgetId="123" status={BudgetStatus.LOCKED} />)
    
    expect(screen.getByRole('button', { name: /unlock budget/i })).toBeInTheDocument()
  })

  it('always shows Delete button', () => {
    render(<BudgetActions budgetId="123" status={BudgetStatus.DRAFT} />)
    
    expect(screen.getByRole('button', { name: /delete budget/i })).toBeInTheDocument()
  })

  it('opens lock confirmation dialog', async () => {
    render(<BudgetActions budgetId="123" status={BudgetStatus.DRAFT} />)
    
    await userEvent.click(screen.getByRole('button', { name: /lock budget/i }))
    
    expect(screen.getByText(/locking this budget will/i)).toBeInTheDocument()
  })

  it('locks budget when confirmed', async () => {
    server.use(
      http.put('/api/budgets/123/lock', () => {
        return HttpResponse.json({ ...mockBudget, status: 'LOCKED', lockedAt: new Date().toISOString() })
      })
    )

    render(<BudgetActions budgetId="123" status={BudgetStatus.DRAFT} />)
    
    await userEvent.click(screen.getByRole('button', { name: /lock budget/i }))
    
    // Find the confirm button in the dialog
    const confirmButtons = screen.getAllByRole('button', { name: /lock budget/i })
    await userEvent.click(confirmButtons[confirmButtons.length - 1])
    
    await waitFor(() => {
      expect(screen.queryByText(/locking this budget will/i)).not.toBeInTheDocument()
    })
  })

  it('opens unlock confirmation dialog', async () => {
    render(<BudgetActions budgetId="123" status={BudgetStatus.LOCKED} />)
    
    await userEvent.click(screen.getByRole('button', { name: /unlock budget/i }))
    
    expect(screen.getByText(/unlocking this budget will/i)).toBeInTheDocument()
  })

  it('unlocks budget when confirmed', async () => {
    server.use(
      http.put('/api/budgets/123/unlock', () => {
        return HttpResponse.json({ ...mockBudget, status: 'UNLOCKED', lockedAt: null })
      })
    )

    render(<BudgetActions budgetId="123" status={BudgetStatus.LOCKED} />)
    
    await userEvent.click(screen.getByRole('button', { name: /unlock budget/i }))
    
    const confirmButtons = screen.getAllByRole('button', { name: /unlock budget/i })
    await userEvent.click(confirmButtons[confirmButtons.length - 1])
    
    await waitFor(() => {
      expect(screen.queryByText(/unlocking this budget will/i)).not.toBeInTheDocument()
    })
  })

  it('opens delete confirmation dialog', async () => {
    render(<BudgetActions budgetId="123" status={BudgetStatus.DRAFT} />)
    
    await userEvent.click(screen.getByRole('button', { name: /delete budget/i }))
    
    expect(screen.getByText(/are you sure you want to delete/i)).toBeInTheDocument()
  })

  it('deletes budget and navigates to list', async () => {
    server.use(
      http.delete('/api/budgets/123', () => {
        return new HttpResponse(null, { status: 204 })
      })
    )

    render(<BudgetActions budgetId="123" status={BudgetStatus.DRAFT} />)
    
    await userEvent.click(screen.getByRole('button', { name: /delete budget/i }))
    await userEvent.click(screen.getByRole('button', { name: /^delete$/i }))
    
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/budgets')
    })
  })
})
```

### Definition of Done

- [x] Tests pass
- [x] Lock/Unlock buttons show based on status
- [x] Confirmation dialogs explain consequences
- [x] API calls succeed
- [x] Delete navigates back to list

---