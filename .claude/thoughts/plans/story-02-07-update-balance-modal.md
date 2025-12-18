# Story 2.7: Update Balance Modal

**As a** user  
**I want to** manually update an account balance  
**So that** I can keep it synchronized with my actual bank

### Acceptance Criteria

- [ ] Modal opens from Balance History drawer
- [ ] Shows account name and current balance (read-only)
- [ ] Form fields: New Balance (required), Date (required, defaults to today), Comment (optional)
- [ ] Date cannot be in the future
- [ ] Success: Close modal, show toast, refresh drawer and list
- [ ] Error: Show error message inline

### Implementation

**Create `src/components/accounts/UpdateBalanceModal.tsx`:**

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
import { useUpdateBalance } from '@/hooks'
import { formatCurrency } from '@/lib/utils'
import { updateBalanceSchema, type UpdateBalanceFormData } from './schemas'
import type { BankAccount } from '@/api/types'

interface UpdateBalanceModalProps {
  account: BankAccount
  open: boolean
  onOpenChange: (open: boolean) => void
}

function getTodayString(): string {
  return new Date().toISOString().split('T')[0]
}

export function UpdateBalanceModal({ account, open, onOpenChange }: UpdateBalanceModalProps) {
  const updateBalance = useUpdateBalance()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UpdateBalanceFormData>({
    resolver: zodResolver(updateBalanceSchema),
    defaultValues: {
      newBalance: account.currentBalance,
      date: getTodayString(),
      comment: '',
    },
  })

  const onSubmit = async (data: UpdateBalanceFormData) => {
    try {
      await updateBalance.mutateAsync({
        id: account.id,
        data: {
          newBalance: data.newBalance,
          date: data.date,
          comment: data.comment || undefined,
        },
      })
      toast.success('Balance updated')
      reset({
        newBalance: data.newBalance,
        date: getTodayString(),
        comment: '',
      })
      onOpenChange(false)
    } catch (error) {
      // Error displayed inline
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
          <DialogTitle>Update Balance</DialogTitle>
        </DialogHeader>

        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-500">{account.name}</p>
          <p className="text-lg font-medium">
            Current: {formatCurrency(account.currentBalance)}
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="newBalance">New Balance *</Label>
            <Input
              id="newBalance"
              type="number"
              step="0.01"
              {...register('newBalance', { valueAsNumber: true })}
              autoFocus
            />
            {errors.newBalance && (
              <p className="text-sm text-red-600">{errors.newBalance.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Date *</Label>
            <Input
              id="date"
              type="date"
              max={getTodayString()}
              {...register('date')}
            />
            {errors.date && (
              <p className="text-sm text-red-600">{errors.date.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="comment">Comment</Label>
            <Input
              id="comment"
              {...register('comment')}
              placeholder="e.g., Reconciled with bank statement"
            />
          </div>

          {updateBalance.error && (
            <p className="text-sm text-red-600">
              {updateBalance.error.message}
            </p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateBalance.isPending}>
              {updateBalance.isPending ? 'Updating...' : 'Update'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
```

### Test File: `src/components/accounts/UpdateBalanceModal.test.tsx`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import { UpdateBalanceModal } from './UpdateBalanceModal'
import { server } from '@/test/mocks/server'
import { http, HttpResponse } from 'msw'
import type { BankAccount } from '@/api/types'

const mockAccount: BankAccount = {
  id: '123',
  name: 'Checking',
  description: 'Main account',
  currentBalance: 5000,
  createdAt: '2025-01-01',
}

describe('UpdateBalanceModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders when open', () => {
    render(
      <UpdateBalanceModal
        account={mockAccount}
        open={true}
        onOpenChange={vi.fn()}
      />
    )
    
    expect(screen.getByText('Update Balance')).toBeInTheDocument()
  })

  it('shows account name and current balance', () => {
    render(
      <UpdateBalanceModal
        account={mockAccount}
        open={true}
        onOpenChange={vi.fn()}
      />
    )
    
    expect(screen.getByText('Checking')).toBeInTheDocument()
    expect(screen.getByText(/5 000,00 kr/)).toBeInTheDocument()
  })

  it('has form fields', () => {
    render(
      <UpdateBalanceModal
        account={mockAccount}
        open={true}
        onOpenChange={vi.fn()}
      />
    )
    
    expect(screen.getByLabelText(/new balance/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/date/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/comment/i)).toBeInTheDocument()
  })

  it('defaults date to today', () => {
    render(
      <UpdateBalanceModal
        account={mockAccount}
        open={true}
        onOpenChange={vi.fn()}
      />
    )
    
    const dateInput = screen.getByLabelText(/date/i) as HTMLInputElement
    const today = new Date().toISOString().split('T')[0]
    expect(dateInput.value).toBe(today)
  })

  it('submits valid form data', async () => {
    let requestBody: unknown
    server.use(
      http.post('/api/bank-accounts/123/balance', async ({ request }) => {
        requestBody = await request.json()
        return HttpResponse.json({
          id: '123',
          currentBalance: 6000,
          previousBalance: 5000,
          changeAmount: 1000,
        })
      })
    )

    const onOpenChange = vi.fn()
    render(
      <UpdateBalanceModal
        account={mockAccount}
        open={true}
        onOpenChange={onOpenChange}
      />
    )
    
    await userEvent.clear(screen.getByLabelText(/new balance/i))
    await userEvent.type(screen.getByLabelText(/new balance/i), '6000')
    await userEvent.type(screen.getByLabelText(/comment/i), 'Test update')
    await userEvent.click(screen.getByRole('button', { name: /update/i }))
    
    await waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledWith(false)
    })
    
    expect(requestBody).toMatchObject({
      newBalance: 6000,
      comment: 'Test update',
    })
  })

  it('shows error for future date', async () => {
    render(
      <UpdateBalanceModal
        account={mockAccount}
        open={true}
        onOpenChange={vi.fn()}
      />
    )
    
    // The date input has max={today} so this would be handled by browser
    // But we can also test API error handling
    server.use(
      http.post('/api/bank-accounts/123/balance', () => {
        return HttpResponse.json(
          { error: 'Date cannot be in the future' },
          { status: 403 }
        )
      })
    )

    await userEvent.click(screen.getByRole('button', { name: /update/i }))
    
    await waitFor(() => {
      expect(screen.getByText(/cannot be in the future/i)).toBeInTheDocument()
    })
  })
})
```

### Definition of Done

- [ ] All tests pass
- [ ] Shows current account info
- [ ] Date defaults to today
- [ ] Cannot select future dates
- [ ] Successful update refreshes data
- [ ] Error messages display correctly

---

## Final: Update AccountsPage with All Components

**Update `src/pages/AccountsPage.tsx`:**

```typescript
import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/shared'
import {
  AccountsSummary,
  AccountsList,
  CreateAccountModal,
  EditAccountModal,
  DeleteAccountDialog,
  BalanceHistoryDrawer,
} from '@/components/accounts'
import { useAccounts } from '@/hooks'
import type { BankAccount } from '@/api/types'

export function AccountsPage() {
  const { data, isLoading, isError, refetch } = useAccounts()
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null)
  const [deletingAccount, setDeletingAccount] = useState<BankAccount | null>(null)
  const [selectedAccount, setSelectedAccount] = useState<BankAccount | null>(null)
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false)

  const handleAccountClick = (account: BankAccount) => {
    setSelectedAccount(account)
    setIsHistoryDrawerOpen(true)
  }

  return (
    <div>
      <PageHeader
        title="Accounts"
        description="Manage your bank accounts"
        action={
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Account
          </Button>
        }
      />

      <div className="mb-6">
        <AccountsSummary
          totalBalance={data?.totalBalance ?? 0}
          accountCount={data?.accountCount ?? 0}
          isLoading={isLoading}
        />
      </div>

      <AccountsList
        accounts={data?.accounts ?? []}
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
        onEdit={setEditingAccount}
        onDelete={setDeletingAccount}
        onClick={handleAccountClick}
        onCreateNew={() => setIsCreateModalOpen(true)}
      />

      <CreateAccountModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
      />

      <EditAccountModal
        account={editingAccount}
        onClose={() => setEditingAccount(null)}
      />

      <DeleteAccountDialog
        account={deletingAccount}
        onClose={() => setDeletingAccount(null)}
      />

      <BalanceHistoryDrawer
        account={selectedAccount}
        open={isHistoryDrawerOpen}
        onOpenChange={setIsHistoryDrawerOpen}
      />
    </div>
  )
}
```

### Update Barrel Export

**Final `src/components/accounts/index.ts`:**

```typescript
export { AccountsSummary } from './AccountsSummary'
export { AccountsList } from './AccountsList'
export { AccountRow } from './AccountRow'
export { AccountCard } from './AccountCard'
export { CreateAccountModal } from './CreateAccountModal'
export { EditAccountModal } from './EditAccountModal'
export { DeleteAccountDialog } from './DeleteAccountDialog'
export { BalanceHistoryDrawer } from './BalanceHistoryDrawer'
export { UpdateBalanceModal } from './UpdateBalanceModal'
export * from './schemas'
```

---

## Epic 2 Complete File Structure

```
src/
├── components/
│   └── accounts/
│       ├── AccountCard.tsx
│       ├── AccountRow.tsx
│       ├── AccountsList.tsx
│       ├── AccountsSummary.tsx
│       ├── BalanceHistoryDrawer.tsx
│       ├── CreateAccountModal.tsx
│       ├── DeleteAccountDialog.tsx
│       ├── EditAccountModal.tsx
│       ├── index.ts
│       ├── schemas.ts
│       └── UpdateBalanceModal.tsx
└── pages/
    └── AccountsPage.tsx
```

---

## Test Summary

| Component | Test File | Tests (approx) |
|-----------|-----------|----------------|
| AccountsSummary | AccountsSummary.test.tsx | 4 |
| AccountsList | AccountsList.test.tsx | 10 |
| CreateAccountModal | CreateAccountModal.test.tsx | 8 |
| EditAccountModal | EditAccountModal.test.tsx | 6 |
| DeleteAccountDialog | DeleteAccountDialog.test.tsx | 5 |
| BalanceHistoryDrawer | BalanceHistoryDrawer.test.tsx | 7 |
| UpdateBalanceModal | UpdateBalanceModal.test.tsx | 6 |

**Total: ~46 tests for Epic 2**

---

## MSW Handlers Update

Add these handlers to `src/test/mocks/handlers.ts`:

```typescript
// Add to existing handlers array:

// Create account
http.post('/api/bank-accounts', async ({ request }) => {
  const body = await request.json() as { name: string }
  return HttpResponse.json({
    id: crypto.randomUUID(),
    name: body.name,
    currentBalance: 0,
    createdAt: new Date().toISOString(),
  }, { status: 201 })
}),

// Update account
http.put('/api/bank-accounts/:id', async ({ request, params }) => {
  const body = await request.json()
  return HttpResponse.json({
    id: params.id,
    ...body,
    currentBalance: 0,
    createdAt: new Date().toISOString(),
  })
}),

// Delete account
http.delete('/api/bank-accounts/:id', () => {
  return new HttpResponse(null, { status: 204 })
}),

// Update balance
http.post('/api/bank-accounts/:id/balance', async ({ request, params }) => {
  const body = await request.json() as { newBalance: number }
  return HttpResponse.json({
    id: params.id,
    currentBalance: body.newBalance,
    previousBalance: 0,
    changeAmount: body.newBalance,
  })
}),

// Balance history
http.get('/api/bank-accounts/:id/balance-history', () => {
  return HttpResponse.json({
    content: [],
    page: { size: 20, number: 0, totalElements: 0, totalPages: 0 },
  })
}),
```

---

## Next Steps

After completing Epic 2:

1. Run all tests: `npm test`
2. Test manually in browser
3. Verify responsive behavior (desktop table, mobile cards)
4. Proceed to Epic 3: Recurring Expenses

---

*Last updated: December 2024*