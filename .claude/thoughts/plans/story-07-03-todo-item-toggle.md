# Story 7.3: Todo Item List

**As a** user  
**I want to** see all my todo items with their details  
**So that** I know what payments and transfers to make

### Acceptance Criteria

- [ ] Shows list of todo items
- [ ] Each item shows: checkbox, name, amount, type badge
- [ ] Payment items show "Payment" badge
- [ ] Transfer items show destination account name
- [ ] Completed items have strikethrough
- [ ] Items grouped by type (Payments first, then Transfers)

### Implementation

**Create `src/components/todo/TodoItemList.tsx`:**

```typescript
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TodoItemRow } from './TodoItemRow'
import { UpdateBalanceModal } from './UpdateBalanceModal'
import type { TodoItem } from '@/api/types'

interface TodoItemListProps {
  budgetId: string
  items: TodoItem[]
}

export function TodoItemList({ budgetId, items }: TodoItemListProps) {
  const [balanceModalItem, setBalanceModalItem] = useState<TodoItem | null>(null)

  // Separate items by type
  const paymentItems = items.filter((item) => item.type === 'PAYMENT')
  const transferItems = items.filter((item) => item.type === 'TRANSFER')

  const handleUpdateBalance = (item: TodoItem) => {
    setBalanceModalItem(item)
  }

  return (
    <div className="space-y-6">
      {/* Payment Items */}
      {paymentItems.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">Payments</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ul className="divide-y">
              {paymentItems.map((item) => (
                <TodoItemRow
                  key={item.id}
                  budgetId={budgetId}
                  item={item}
                />
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Transfer Items */}
      {transferItems.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">Transfers</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ul className="divide-y">
              {transferItems.map((item) => (
                <TodoItemRow
                  key={item.id}
                  budgetId={budgetId}
                  item={item}
                  onUpdateBalance={() => handleUpdateBalance(item)}
                />
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Update Balance Modal */}
      {balanceModalItem && balanceModalItem.toAccount && (
        <UpdateBalanceModal
          accountId={balanceModalItem.toAccount.id}
          accountName={balanceModalItem.toAccount.name}
          suggestedAmount={balanceModalItem.amount}
          open={!!balanceModalItem}
          onOpenChange={(open) => !open && setBalanceModalItem(null)}
        />
      )}
    </div>
  )
}
```

**Create `src/components/todo/TodoItemRow.tsx`:**

```typescript
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Wallet } from 'lucide-react'
import { toast } from 'sonner'
import { useUpdateTodoItem } from '@/hooks'
import { formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { TodoItem } from '@/api/types'

interface TodoItemRowProps {
  budgetId: string
  item: TodoItem
  onUpdateBalance?: () => void
}

export function TodoItemRow({ budgetId, item, onUpdateBalance }: TodoItemRowProps) {
  const updateTodo = useUpdateTodoItem()

  const isCompleted = item.status === 'COMPLETED'
  const isTransfer = item.type === 'TRANSFER'

  const handleToggle = async () => {
    const newStatus = isCompleted ? 'PENDING' : 'COMPLETED'

    try {
      await updateTodo.mutateAsync({
        budgetId,
        itemId: item.id,
        data: { status: newStatus },
      })
    } catch (error) {
      toast.error('Failed to update item')
    }
  }

  return (
    <li className="flex items-center gap-3 py-3">
      <Checkbox
        checked={isCompleted}
        onCheckedChange={handleToggle}
        disabled={updateTodo.isPending}
        aria-label={`Mark "${item.name}" as ${isCompleted ? 'pending' : 'completed'}`}
      />

      <div className="flex-1 min-w-0">
        <p className={cn(
          'font-medium text-gray-900',
          isCompleted && 'line-through text-gray-500'
        )}>
          {item.name}
        </p>
        {isTransfer && item.toAccount && (
          <p className="text-sm text-gray-500">
            To: {item.toAccount.name}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Badge variant="outline" className={cn(
          'text-xs',
          isCompleted && 'opacity-50'
        )}>
          {isTransfer ? 'Transfer' : 'Payment'}
        </Badge>

        <span className={cn(
          'font-medium text-gray-900 tabular-nums',
          isCompleted && 'line-through text-gray-500'
        )}>
          {formatCurrency(item.amount)}
        </span>

        {isTransfer && isCompleted && onUpdateBalance && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onUpdateBalance}
            title="Update account balance"
          >
            <Wallet className="w-4 h-4 text-gray-500" />
          </Button>
        )}
      </div>
    </li>
  )
}
```

### Test File: `src/components/todo/TodoItemList.test.tsx`

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@/test/test-utils'
import { TodoItemList } from './TodoItemList'
import type { TodoItem } from '@/api/types'

const mockItems: TodoItem[] = [
  {
    id: 'todo-1',
    type: 'PAYMENT',
    name: 'Pay Rent',
    amount: 8000,
    status: 'PENDING',
    fromAccount: { id: 'acc-main', name: 'Main Account' },
    toAccount: null,
    completedAt: null,
    createdAt: '2025-03-01T00:00:00Z',
  },
  {
    id: 'todo-2',
    type: 'PAYMENT',
    name: 'Pay Insurance',
    amount: 500,
    status: 'COMPLETED',
    fromAccount: { id: 'acc-main', name: 'Main Account' },
    toAccount: null,
    completedAt: '2025-03-15T10:30:00Z',
    createdAt: '2025-03-01T00:00:00Z',
  },
  {
    id: 'todo-3',
    type: 'TRANSFER',
    name: 'Transfer to Savings',
    amount: 5000,
    status: 'PENDING',
    fromAccount: { id: 'acc-main', name: 'Main Account' },
    toAccount: { id: 'acc-savings', name: 'Savings Account' },
    completedAt: null,
    createdAt: '2025-03-01T00:00:00Z',
  },
]

describe('TodoItemList', () => {
  it('renders payment items under Payments section', () => {
    render(<TodoItemList budgetId="123" items={mockItems} />)

    expect(screen.getByText('Payments')).toBeInTheDocument()
    expect(screen.getByText('Pay Rent')).toBeInTheDocument()
    expect(screen.getByText('Pay Insurance')).toBeInTheDocument()
  })

  it('renders transfer items under Transfers section', () => {
    render(<TodoItemList budgetId="123" items={mockItems} />)

    expect(screen.getByText('Transfers')).toBeInTheDocument()
    expect(screen.getByText('Transfer to Savings')).toBeInTheDocument()
  })

  it('shows destination account for transfer items', () => {
    render(<TodoItemList budgetId="123" items={mockItems} />)

    expect(screen.getByText(/to: savings account/i)).toBeInTheDocument()
  })

  it('shows amounts for all items', () => {
    render(<TodoItemList budgetId="123" items={mockItems} />)
    
    expect(screen.getByText(/8 000,00 kr/)).toBeInTheDocument()
    expect(screen.getByText(/500,00 kr/)).toBeInTheDocument()
    expect(screen.getByText(/5 000,00 kr/)).toBeInTheDocument()
  })

  it('does not show Payments section when no payments', () => {
    const transfersOnly = mockItems.filter((item) => item.type === 'TRANSFER')
    render(<TodoItemList budgetId="123" items={transfersOnly} />)

    expect(screen.queryByText('Payments')).not.toBeInTheDocument()
    expect(screen.getByText('Transfers')).toBeInTheDocument()
  })

  it('does not show Transfers section when no transfers', () => {
    const paymentsOnly = mockItems.filter((item) => item.type === 'PAYMENT')
    render(<TodoItemList budgetId="123" items={paymentsOnly} />)

    expect(screen.getByText('Payments')).toBeInTheDocument()
    expect(screen.queryByText('Transfers')).not.toBeInTheDocument()
  })
})
```

### Test File: `src/components/todo/TodoItemRow.test.tsx`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import { TodoItemRow } from './TodoItemRow'
import { server } from '@/test/mocks/server'
import { http, HttpResponse } from 'msw'
import type { TodoItem } from '@/api/types'

const pendingPayment: TodoItem = {
  id: 'todo-1',
  type: 'PAYMENT',
  name: 'Pay Rent',
  amount: 8000,
  status: 'PENDING',
  fromAccount: { id: 'acc-main', name: 'Main Account' },
  toAccount: null,
  completedAt: null,
  createdAt: '2025-03-01T00:00:00Z',
}

const completedTransfer: TodoItem = {
  id: 'todo-2',
  type: 'TRANSFER',
  name: 'Transfer to Savings',
  amount: 5000,
  status: 'COMPLETED',
  fromAccount: { id: 'acc-main', name: 'Main Account' },
  toAccount: { id: 'acc-savings', name: 'Savings Account' },
  completedAt: '2025-03-15T10:30:00Z',
  createdAt: '2025-03-01T00:00:00Z',
}

describe('TodoItemRow', () => {
  beforeEach(() => {
    server.use(
      http.put('/api/budgets/:budgetId/todo-list/items/:itemId', () => {
        return HttpResponse.json(pendingPayment)
      })
    )
  })

  it('renders item name', () => {
    render(<TodoItemRow budgetId="123" item={pendingPayment} />)

    expect(screen.getByText('Pay Rent')).toBeInTheDocument()
  })

  it('renders item amount', () => {
    render(<TodoItemRow budgetId="123" item={pendingPayment} />)

    expect(screen.getByText(/8 000,00 kr/)).toBeInTheDocument()
  })

  it('shows unchecked checkbox for pending items', () => {
    render(<TodoItemRow budgetId="123" item={pendingPayment} />)

    const checkbox = screen.getByRole('checkbox')
    expect(checkbox).not.toBeChecked()
  })

  it('shows checked checkbox for completed items', () => {
    render(<TodoItemRow budgetId="123" item={completedTransfer} />)

    const checkbox = screen.getByRole('checkbox')
    expect(checkbox).toBeChecked()
  })

  it('applies strikethrough to completed items', () => {
    render(<TodoItemRow budgetId="123" item={completedTransfer} />)

    const name = screen.getByText('Transfer to Savings')
    expect(name).toHaveClass('line-through')
  })

  it('shows Payment badge for payment items', () => {
    render(<TodoItemRow budgetId="123" item={pendingPayment} />)

    expect(screen.getByText('Payment')).toBeInTheDocument()
  })

  it('shows Transfer badge for transfer items', () => {
    render(<TodoItemRow budgetId="123" item={completedTransfer} />)

    expect(screen.getByText('Transfer')).toBeInTheDocument()
  })

  it('shows destination account for transfer items', () => {
    render(<TodoItemRow budgetId="123" item={completedTransfer} />)

    expect(screen.getByText(/to: savings account/i)).toBeInTheDocument()
  })

  it('calls API when checkbox toggled', async () => {
    let requestBody: unknown
    server.use(
      http.put('/api/budgets/123/todo-list/items/todo-1', async ({ request }) => {
        requestBody = await request.json()
        return HttpResponse.json({ ...pendingPayment, status: 'COMPLETED' })
      })
    )

    render(<TodoItemRow budgetId="123" item={pendingPayment} />)

    await userEvent.click(screen.getByRole('checkbox'))

    await waitFor(() => {
      expect(requestBody).toEqual({ status: 'COMPLETED' })
    })
  })

  it('shows update balance button for completed transfers', () => {
    const onUpdateBalance = vi.fn()
    render(
      <TodoItemRow
        budgetId="123"
        item={completedTransfer}
        onUpdateBalance={onUpdateBalance}
      />
    )

    expect(screen.getByTitle(/update account balance/i)).toBeInTheDocument()
  })

  it('does not show update balance button for pending transfers', () => {
    const pendingTransfer = { ...completedTransfer, status: 'PENDING' as const, completedAt: null }
    render(
      <TodoItemRow
        budgetId="123"
        item={pendingTransfer}
        onUpdateBalance={vi.fn()}
      />
    )

    expect(screen.queryByTitle(/update account balance/i)).not.toBeInTheDocument()
  })

  it('calls onUpdateBalance when balance button clicked', async () => {
    const onUpdateBalance = vi.fn()
    render(
      <TodoItemRow
        budgetId="123"
        item={completedTransfer}
        onUpdateBalance={onUpdateBalance}
      />
    )

    await userEvent.click(screen.getByTitle(/update account balance/i))

    expect(onUpdateBalance).toHaveBeenCalled()
  })
})
```

### Definition of Done

- [ ] Tests pass
- [ ] Items grouped by type
- [ ] Checkboxes toggle correctly
- [ ] Completed items have strikethrough
- [ ] Update balance button shown for completed savings

---