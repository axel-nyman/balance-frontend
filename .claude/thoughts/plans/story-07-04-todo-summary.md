# Story 7.4: Update Balance Quick Action

**As a** user  
**I want to** quickly update an account balance after completing a savings transfer  
**So that** my account balances stay accurate

### Acceptance Criteria

- [ ] Button appears on completed savings items
- [ ] Opens modal pre-filled with account and suggested amount
- [ ] Allows adjusting the amount
- [ ] Saves new balance to account
- [ ] Success closes modal

### Implementation

**Create `src/components/todo/UpdateBalanceModal.tsx`:**

```typescript
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAccountDetail, useUpdateAccountBalance } from '@/hooks'
import { formatCurrency } from '@/lib/utils'

interface UpdateBalanceModalProps {
  accountId: string
  accountName: string
  suggestedAmount: number
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function UpdateBalanceModal({
  accountId,
  accountName,
  suggestedAmount,
  open,
  onOpenChange,
}: UpdateBalanceModalProps) {
  const { data: account } = useAccountDetail(accountId)
  const updateBalance = useUpdateAccountBalance()
  
  const [newBalance, setNewBalance] = useState<string>('')

  // Calculate suggested new balance when account data loads
  useEffect(() => {
    if (account && open) {
      const suggested = account.currentBalance + suggestedAmount
      setNewBalance(suggested.toString())
    }
  }, [account, suggestedAmount, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const balance = parseFloat(newBalance)
    if (isNaN(balance)) {
      toast.error('Please enter a valid amount')
      return
    }

    try {
      await updateBalance.mutateAsync({
        accountId,
        data: {
          newBalance: balance,
          date: new Date().toISOString().split('T')[0],
          comment: 'Savings transfer from budget',
        },
      })
      toast.success('Balance updated')
      onOpenChange(false)
    } catch (error) {
      toast.error('Failed to update balance')
    }
  }

  const currentBalance = account?.currentBalance ?? 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Balance</DialogTitle>
          <DialogDescription>
            Update the balance for {accountName} after your savings transfer.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Current Balance</span>
              <span className="font-medium">{formatCurrency(currentBalance)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Transfer Amount</span>
              <span className="font-medium text-green-600">+{formatCurrency(suggestedAmount)}</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="newBalance">New Balance</Label>
            <Input
              id="newBalance"
              type="number"
              step="0.01"
              value={newBalance}
              onChange={(e) => setNewBalance(e.target.value)}
              placeholder="0.00"
            />
            <p className="text-xs text-gray-500">
              Adjust if the actual transfer amount was different.
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateBalance.isPending}>
              {updateBalance.isPending ? 'Saving...' : 'Update Balance'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
```

### Test File: `src/components/todo/UpdateBalanceModal.test.tsx`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import { UpdateBalanceModal } from './UpdateBalanceModal'
import { server } from '@/test/mocks/server'
import { http, HttpResponse } from 'msw'

describe('UpdateBalanceModal', () => {
  const defaultProps = {
    accountId: 'acc-1',
    accountName: 'Savings Account',
    suggestedAmount: 5000,
    open: true,
    onOpenChange: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    server.use(
      http.get('/api/bank-accounts/acc-1', () => {
        return HttpResponse.json({
          id: 'acc-1',
          name: 'Savings Account',
          currentBalance: 10000,
        })
      })
    )
  })

  it('renders modal title', () => {
    render(<UpdateBalanceModal {...defaultProps} />)
    
    expect(screen.getByText('Update Balance')).toBeInTheDocument()
  })

  it('shows account name in description', () => {
    render(<UpdateBalanceModal {...defaultProps} />)
    
    expect(screen.getByText(/savings account/i)).toBeInTheDocument()
  })

  it('shows current balance', async () => {
    render(<UpdateBalanceModal {...defaultProps} />)
    
    await waitFor(() => {
      expect(screen.getByText(/10 000,00 kr/)).toBeInTheDocument()
    })
  })

  it('shows transfer amount', () => {
    render(<UpdateBalanceModal {...defaultProps} />)
    
    expect(screen.getByText(/\+5 000,00 kr/)).toBeInTheDocument()
  })

  it('pre-fills suggested new balance', async () => {
    render(<UpdateBalanceModal {...defaultProps} />)
    
    await waitFor(() => {
      // Current (10000) + Transfer (5000) = 15000
      expect(screen.getByLabelText(/new balance/i)).toHaveValue(15000)
    })
  })

  it('allows editing the new balance', async () => {
    render(<UpdateBalanceModal {...defaultProps} />)
    
    await waitFor(() => {
      expect(screen.getByLabelText(/new balance/i)).toHaveValue(15000)
    })

    const input = screen.getByLabelText(/new balance/i)
    await userEvent.clear(input)
    await userEvent.type(input, '14500')
    
    expect(input).toHaveValue(14500)
  })

  it('submits updated balance', async () => {
    let requestBody: unknown
    server.use(
      http.post('/api/bank-accounts/acc-1/balance', async ({ request }) => {
        requestBody = await request.json()
        return HttpResponse.json({ id: 'acc-1' })
      })
    )

    const onOpenChange = vi.fn()
    render(<UpdateBalanceModal {...defaultProps} onOpenChange={onOpenChange} />)
    
    await waitFor(() => {
      expect(screen.getByLabelText(/new balance/i)).toHaveValue(15000)
    })

    await userEvent.click(screen.getByRole('button', { name: /update balance/i }))
    
    await waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledWith(false)
    })

    expect(requestBody).toMatchObject({
      newBalance: 15000,
      comment: 'Savings transfer from budget',
    })
  })

  it('closes on cancel', async () => {
    const onOpenChange = vi.fn()
    render(<UpdateBalanceModal {...defaultProps} onOpenChange={onOpenChange} />)
    
    await userEvent.click(screen.getByRole('button', { name: /cancel/i }))
    
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })
})
```

### Definition of Done

- [ ] Tests pass
- [ ] Modal shows current balance and transfer amount
- [ ] New balance pre-calculated
- [ ] Amount editable
- [ ] API call updates balance

---