# Story 6.6: Add/Edit Savings Modal

**As a** user  
**I want to** add or edit savings items in my budget  
**So that** I can plan my savings goals

### Implementation

**Create `src/components/budget-detail/SavingsItemModal.tsx`:**

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAddBudgetSavings, useUpdateBudgetSavings, useAccounts } from '@/hooks'
import { savingsItemSchema, type SavingsItemFormData } from './schemas'
import type { BudgetSavingsItem } from '@/api/types'

interface SavingsItemModalProps {
  budgetId: string
  item: BudgetSavingsItem | null
  existingAccountIds: string[] // accounts already used in other savings items
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SavingsItemModal({
  budgetId,
  item,
  existingAccountIds,
  open,
  onOpenChange,
}: SavingsItemModalProps) {
  const { data: accountsData } = useAccounts()
  const addSavings = useAddBudgetSavings()
  const updateSavings = useUpdateBudgetSavings()
  const isEditing = item !== null

  const accounts = accountsData?.accounts ?? []
  
  // Filter out accounts already used (except current item's account when editing)
  const availableAccounts = accounts.filter(
    (account) =>
      !existingAccountIds.includes(account.id) ||
      (isEditing && account.id === item?.targetAccountId)
  )

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SavingsItemFormData>({
    resolver: zodResolver(savingsItemSchema),
    defaultValues: {
      targetAccountId: '',
      amount: undefined,
    },
  })

  const targetAccountId = watch('targetAccountId')

  useEffect(() => {
    if (item) {
      reset({
        targetAccountId: item.targetAccountId,
        amount: item.amount,
      })
    } else {
      reset({
        targetAccountId: '',
        amount: undefined,
      })
    }
  }, [item, reset])

  const onSubmit = async (data: SavingsItemFormData) => {
    try {
      if (isEditing && item) {
        await updateSavings.mutateAsync({
          budgetId,
          itemId: item.id,
          data,
        })
        toast.success('Savings updated')
      } else {
        await addSavings.mutateAsync({
          budgetId,
          data,
        })
        toast.success('Savings added')
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

  const mutation = isEditing ? updateSavings : addSavings

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Savings' : 'Add Savings'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="account">Account *</Label>
            <Select
              value={targetAccountId}
              onValueChange={(value) => setValue('targetAccountId', value)}
            >
              <SelectTrigger id="account">
                <SelectValue placeholder="Select account" />
              </SelectTrigger>
              <SelectContent>
                {availableAccounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.targetAccountId && (
              <p className="text-sm text-red-600">{errors.targetAccountId.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="savings-amount">Amount *</Label>
            <Input
              id="savings-amount"
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

### Test File: `src/components/budget-detail/SavingsItemModal.test.tsx`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import { SavingsItemModal } from './SavingsItemModal'
import { server } from '@/test/mocks/server'
import { http, HttpResponse } from 'msw'

describe('SavingsItemModal', () => {
  const defaultProps = {
    budgetId: 'budget-123',
    item: null,
    existingAccountIds: [],
    open: true,
    onOpenChange: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    server.use(
      http.get('/api/bank-accounts', () => {
        return HttpResponse.json({
          totalBalance: 10000,
          accountCount: 2,
          accounts: [
            { id: 'acc-1', name: 'Savings Account', currentBalance: 5000 },
            { id: 'acc-2', name: 'Emergency Fund', currentBalance: 5000 },
          ]
        })
      })
    )
  })

  it('renders Add Savings title when creating', () => {
    render(<SavingsItemModal {...defaultProps} />)
    
    expect(screen.getByText('Add Savings')).toBeInTheDocument()
  })

  it('renders Edit Savings title when editing', () => {
    render(
      <SavingsItemModal
        {...defaultProps}
        item={{ id: '1', targetAccountId: 'acc-1', targetAccountName: 'Savings Account', amount: 5000 }}
      />
    )
    
    expect(screen.getByText('Edit Savings')).toBeInTheDocument()
  })

  it('shows available accounts in dropdown', async () => {
    render(<SavingsItemModal {...defaultProps} />)
    
    await waitFor(() => {
      expect(screen.getByRole('combobox')).toBeInTheDocument()
    })

    await userEvent.click(screen.getByRole('combobox'))
    
    expect(screen.getByText('Savings Account')).toBeInTheDocument()
    expect(screen.getByText('Emergency Fund')).toBeInTheDocument()
  })

  it('filters out already-used accounts', async () => {
    render(<SavingsItemModal {...defaultProps} existingAccountIds={['acc-1']} />)
    
    await waitFor(() => {
      expect(screen.getByRole('combobox')).toBeInTheDocument()
    })

    await userEvent.click(screen.getByRole('combobox'))
    
    expect(screen.queryByText('Savings Account')).not.toBeInTheDocument()
    expect(screen.getByText('Emergency Fund')).toBeInTheDocument()
  })

  it('calls API to create savings', async () => {
    let requestBody: unknown
    server.use(
      http.post('/api/budgets/budget-123/savings', async ({ request }) => {
        requestBody = await request.json()
        return HttpResponse.json({ id: 'new-1' }, { status: 201 })
      })
    )

    const onOpenChange = vi.fn()
    render(<SavingsItemModal {...defaultProps} onOpenChange={onOpenChange} />)
    
    await waitFor(() => {
      expect(screen.getByRole('combobox')).toBeInTheDocument()
    })

    await userEvent.click(screen.getByRole('combobox'))
    await userEvent.click(screen.getByText('Savings Account'))
    await userEvent.type(screen.getByLabelText(/amount/i), '5000')
    await userEvent.click(screen.getByRole('button', { name: /save/i }))
    
    await waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledWith(false)
    })
    
    expect(requestBody).toEqual({
      targetAccountId: 'acc-1',
      amount: 5000,
    })
  })

  it('calls API to update savings', async () => {
    let requestBody: unknown
    server.use(
      http.put('/api/budgets/budget-123/savings/1', async ({ request }) => {
        requestBody = await request.json()
        return HttpResponse.json({ id: '1' })
      })
    )

    const onOpenChange = vi.fn()
    render(
      <SavingsItemModal
        {...defaultProps}
        item={{ id: '1', targetAccountId: 'acc-1', targetAccountName: 'Savings Account', amount: 5000 }}
        onOpenChange={onOpenChange}
      />
    )
    
    await userEvent.clear(screen.getByLabelText(/amount/i))
    await userEvent.type(screen.getByLabelText(/amount/i), '6000')
    await userEvent.click(screen.getByRole('button', { name: /save/i }))
    
    await waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledWith(false)
    })
    
    expect(requestBody).toEqual({
      targetAccountId: 'acc-1',
      amount: 6000,
    })
  })
})
```

### Definition of Done

- [x] Tests pass
- [x] Account dropdown shows available accounts
- [x] Already-used accounts are filtered
- [x] Create and edit modes work

---