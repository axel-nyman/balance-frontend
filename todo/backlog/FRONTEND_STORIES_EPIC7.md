# Balance — Frontend Stories: Epic 7 (Todo List)

This document contains detailed, implementable stories for the Todo List epic. This is the final frontend epic, covering the payment checklist feature.

---

## Epic Overview

When a budget is locked, a todo list is automatically created containing:
- **Manual payment expenses:** Expenses linked to recurring items marked as "manual payment"
- **Savings transfers:** All planned savings items

Users can check off items as they complete the actual payments/transfers. The todo list helps track what still needs to be done for the month.

**Key Design Decisions:**
- Todo items have optimistic updates (instant UI feedback)
- Completed items show strikethrough
- Progress indicator shows completion percentage
- Quick action to update account balance after completing a transfer

**Dependencies:** Epic 6 (Budget Detail) must be complete.

**API Endpoints Used:**
- `GET /api/budgets/{budgetId}/todo-list` — Get todo list for budget
- `PUT /api/budgets/{budgetId}/todo-list/items/{id}` — Update todo item (toggle completion)

---

## Story 7.1: Todo List Page Shell

**As a** user  
**I want to** access the todo list for a locked budget  
**So that** I can see what payments I need to make

### Acceptance Criteria

- [ ] Page renders at `/budgets/:id/todo` route
- [ ] Shows budget month/year in title
- [ ] Shows "Back to Budget" link
- [ ] Loading state while fetching
- [ ] Error state if budget not found or not locked
- [ ] Empty state if no todo items

### Implementation

**Update `src/pages/TodoListPage.tsx`:**

```typescript
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageHeader, LoadingState, ErrorState, EmptyState } from '@/components/shared'
import { TodoProgress, TodoItemList } from '@/components/todo'
import { useBudgetTodo } from '@/hooks'
import { formatMonthYear } from '@/lib/utils'

export function TodoListPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: todoData, isLoading, isError, error, refetch } = useBudgetTodo(id!)

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Loading..." />
        <LoadingState variant="cards" />
      </div>
    )
  }

  if (isError) {
    const errorMessage = error?.message || 'Failed to load todo list'
    const isNotLocked = errorMessage.toLowerCase().includes('not locked')
    
    return (
      <div>
        <PageHeader
          title="Todo List"
          action={
            <Button variant="ghost" asChild>
              <Link to={`/budgets/${id}`}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Budget
              </Link>
            </Button>
          }
        />
        <ErrorState
          title={isNotLocked ? 'Budget Not Locked' : 'Error Loading Todo List'}
          message={isNotLocked 
            ? 'This budget must be locked before you can view its todo list.'
            : errorMessage
          }
          onRetry={isNotLocked ? undefined : refetch}
        />
      </div>
    )
  }

  if (!todoData || todoData.items.length === 0) {
    return (
      <div>
        <PageHeader
          title={`Todo List — ${formatMonthYear(todoData?.month ?? 1, todoData?.year ?? 2025)}`}
          action={
            <Button variant="ghost" asChild>
              <Link to={`/budgets/${id}`}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Budget
              </Link>
            </Button>
          }
        />
        <EmptyState
          title="No todo items"
          description="This budget has no manual payments or savings transfers to track."
        />
      </div>
    )
  }

  const title = `Todo List — ${formatMonthYear(todoData.month, todoData.year)}`

  return (
    <div>
      <PageHeader
        title={title}
        description="Track your manual payments and savings transfers"
        action={
          <Button variant="ghost" asChild>
            <Link to={`/budgets/${id}`}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Budget
            </Link>
          </Button>
        }
      />

      <div className="space-y-6">
        <TodoProgress items={todoData.items} />
        <TodoItemList budgetId={id!} items={todoData.items} />
      </div>
    </div>
  )
}
```

### Test File: `src/pages/TodoListPage.test.tsx`

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@/test/test-utils'
import { TodoListPage } from './TodoListPage'
import { server } from '@/test/mocks/server'
import { http, HttpResponse } from 'msw'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

const mockTodoData = {
  budgetId: '123',
  month: 3,
  year: 2025,
  items: [
    {
      id: 'todo-1',
      type: 'EXPENSE',
      description: 'Pay Rent',
      amount: 8000,
      status: 'PENDING',
      expenseItemId: 'exp-1',
    },
    {
      id: 'todo-2',
      type: 'SAVINGS',
      description: 'Transfer to Savings Account',
      amount: 5000,
      status: 'COMPLETED',
      savingsItemId: 'sav-1',
      targetAccountId: 'acc-1',
      targetAccountName: 'Savings Account',
    },
  ],
}

function renderWithRouter(budgetId = '123') {
  return render(
    <MemoryRouter initialEntries={[`/budgets/${budgetId}/todo`]}>
      <Routes>
        <Route path="/budgets/:id/todo" element={<TodoListPage />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('TodoListPage', () => {
  beforeEach(() => {
    server.use(
      http.get('/api/budgets/123/todo', () => {
        return HttpResponse.json(mockTodoData)
      })
    )
  })

  it('shows loading state initially', () => {
    renderWithRouter()
    
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('displays budget month and year in title', async () => {
    renderWithRouter()
    
    await waitFor(() => {
      expect(screen.getByText(/mars 2025/i)).toBeInTheDocument()
    })
  })

  it('shows back to budget link', async () => {
    renderWithRouter()
    
    await waitFor(() => {
      expect(screen.getByRole('link', { name: /back to budget/i })).toBeInTheDocument()
    })
  })

  it('shows todo items', async () => {
    renderWithRouter()
    
    await waitFor(() => {
      expect(screen.getByText('Pay Rent')).toBeInTheDocument()
      expect(screen.getByText(/transfer to savings/i)).toBeInTheDocument()
    })
  })

  it('shows error for non-locked budget', async () => {
    server.use(
      http.get('/api/budgets/123/todo', () => {
        return HttpResponse.json(
          { error: 'Budget is not locked' },
          { status: 400 }
        )
      })
    )

    renderWithRouter()
    
    await waitFor(() => {
      expect(screen.getByText(/must be locked/i)).toBeInTheDocument()
    })
  })

  it('shows empty state when no todo items', async () => {
    server.use(
      http.get('/api/budgets/123/todo', () => {
        return HttpResponse.json({
          ...mockTodoData,
          items: [],
        })
      })
    )

    renderWithRouter()
    
    await waitFor(() => {
      expect(screen.getByText(/no todo items/i)).toBeInTheDocument()
    })
  })
})
```

### Definition of Done

- [ ] Tests pass
- [ ] Page loads todo data
- [ ] Title shows month/year
- [ ] Back link works
- [ ] Loading, error, empty states work

---

## Story 7.2: Todo Progress Indicator

**As a** user  
**I want to** see my progress on the todo list  
**So that** I know how much is left to do

### Acceptance Criteria

- [ ] Shows progress bar
- [ ] Shows "X of Y completed" text
- [ ] Shows percentage
- [ ] Progress bar fills based on completion
- [ ] Green color when 100% complete

### Implementation

**Create `src/components/todo/TodoProgress.tsx`:**

```typescript
import { CheckCircle2 } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { TodoItem } from '@/api/types'

interface TodoProgressProps {
  items: TodoItem[]
}

export function TodoProgress({ items }: TodoProgressProps) {
  const total = items.length
  const completed = items.filter((item) => item.status === 'COMPLETED').length
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0
  const isComplete = completed === total && total > 0

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className={cn(
              'w-5 h-5',
              isComplete ? 'text-green-600' : 'text-gray-400'
            )} />
            <span className="font-medium text-gray-900">
              {completed} of {total} completed
            </span>
          </div>
          <span className={cn(
            'text-sm font-semibold',
            isComplete ? 'text-green-600' : 'text-gray-600'
          )}>
            {percentage}%
          </span>
        </div>
        <Progress 
          value={percentage} 
          className={cn(
            'h-2',
            isComplete && '[&>div]:bg-green-600'
          )}
        />
      </CardContent>
    </Card>
  )
}
```

### Test File: `src/components/todo/TodoProgress.test.tsx`

```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@/test/test-utils'
import { TodoProgress } from './TodoProgress'
import type { TodoItem } from '@/api/types'

const createItem = (status: 'PENDING' | 'COMPLETED'): TodoItem => ({
  id: crypto.randomUUID(),
  type: 'EXPENSE',
  description: 'Test',
  amount: 100,
  status,
})

describe('TodoProgress', () => {
  it('shows completion count', () => {
    const items = [
      createItem('COMPLETED'),
      createItem('PENDING'),
      createItem('PENDING'),
    ]

    render(<TodoProgress items={items} />)
    
    expect(screen.getByText(/1 of 3 completed/i)).toBeInTheDocument()
  })

  it('shows percentage', () => {
    const items = [
      createItem('COMPLETED'),
      createItem('COMPLETED'),
      createItem('PENDING'),
      createItem('PENDING'),
    ]

    render(<TodoProgress items={items} />)
    
    expect(screen.getByText('50%')).toBeInTheDocument()
  })

  it('shows 0% when no items completed', () => {
    const items = [
      createItem('PENDING'),
      createItem('PENDING'),
    ]

    render(<TodoProgress items={items} />)
    
    expect(screen.getByText('0%')).toBeInTheDocument()
  })

  it('shows 100% when all items completed', () => {
    const items = [
      createItem('COMPLETED'),
      createItem('COMPLETED'),
    ]

    render(<TodoProgress items={items} />)
    
    expect(screen.getByText('100%')).toBeInTheDocument()
  })

  it('handles empty items array', () => {
    render(<TodoProgress items={[]} />)
    
    expect(screen.getByText(/0 of 0 completed/i)).toBeInTheDocument()
    expect(screen.getByText('0%')).toBeInTheDocument()
  })

  it('applies green styling when complete', () => {
    const items = [
      createItem('COMPLETED'),
      createItem('COMPLETED'),
    ]

    const { container } = render(<TodoProgress items={items} />)
    
    expect(container.querySelector('.text-green-600')).toBeInTheDocument()
  })
})
```

### Definition of Done

- [ ] Tests pass
- [ ] Progress bar renders
- [ ] Completion count accurate
- [ ] Percentage calculated correctly
- [ ] Green styling at 100%

---

## Story 7.3: Todo Item List

**As a** user  
**I want to** see all my todo items with their details  
**So that** I know what payments and transfers to make

### Acceptance Criteria

- [ ] Shows list of todo items
- [ ] Each item shows: checkbox, description, amount, type badge
- [ ] Expense items show "Manual Payment" badge
- [ ] Savings items show target account name
- [ ] Completed items have strikethrough
- [ ] Items grouped by type (Expenses first, then Savings)

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
  const expenseItems = items.filter((item) => item.type === 'EXPENSE')
  const savingsItems = items.filter((item) => item.type === 'SAVINGS')

  const handleUpdateBalance = (item: TodoItem) => {
    setBalanceModalItem(item)
  }

  return (
    <div className="space-y-6">
      {/* Expense Items */}
      {expenseItems.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">Manual Payments</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ul className="divide-y">
              {expenseItems.map((item) => (
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

      {/* Savings Items */}
      {savingsItems.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">Savings Transfers</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ul className="divide-y">
              {savingsItems.map((item) => (
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
      {balanceModalItem && (
        <UpdateBalanceModal
          accountId={balanceModalItem.targetAccountId!}
          accountName={balanceModalItem.targetAccountName!}
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
  const isSavings = item.type === 'SAVINGS'

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
        aria-label={`Mark "${item.description}" as ${isCompleted ? 'pending' : 'completed'}`}
      />
      
      <div className="flex-1 min-w-0">
        <p className={cn(
          'font-medium text-gray-900',
          isCompleted && 'line-through text-gray-500'
        )}>
          {item.description}
        </p>
        {isSavings && item.targetAccountName && (
          <p className="text-sm text-gray-500">
            To: {item.targetAccountName}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Badge variant="outline" className={cn(
          'text-xs',
          isCompleted && 'opacity-50'
        )}>
          {isSavings ? 'Transfer' : 'Payment'}
        </Badge>
        
        <span className={cn(
          'font-medium text-gray-900 tabular-nums',
          isCompleted && 'line-through text-gray-500'
        )}>
          {formatCurrency(item.amount)}
        </span>

        {isSavings && isCompleted && onUpdateBalance && (
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
    type: 'EXPENSE',
    description: 'Pay Rent',
    amount: 8000,
    status: 'PENDING',
    expenseItemId: 'exp-1',
  },
  {
    id: 'todo-2',
    type: 'EXPENSE',
    description: 'Pay Insurance',
    amount: 500,
    status: 'COMPLETED',
    expenseItemId: 'exp-2',
  },
  {
    id: 'todo-3',
    type: 'SAVINGS',
    description: 'Transfer to Savings',
    amount: 5000,
    status: 'PENDING',
    savingsItemId: 'sav-1',
    targetAccountId: 'acc-1',
    targetAccountName: 'Savings Account',
  },
]

describe('TodoItemList', () => {
  it('renders expense items under Manual Payments section', () => {
    render(<TodoItemList budgetId="123" items={mockItems} />)
    
    expect(screen.getByText('Manual Payments')).toBeInTheDocument()
    expect(screen.getByText('Pay Rent')).toBeInTheDocument()
    expect(screen.getByText('Pay Insurance')).toBeInTheDocument()
  })

  it('renders savings items under Savings Transfers section', () => {
    render(<TodoItemList budgetId="123" items={mockItems} />)
    
    expect(screen.getByText('Savings Transfers')).toBeInTheDocument()
    expect(screen.getByText('Transfer to Savings')).toBeInTheDocument()
  })

  it('shows target account for savings items', () => {
    render(<TodoItemList budgetId="123" items={mockItems} />)
    
    expect(screen.getByText(/to: savings account/i)).toBeInTheDocument()
  })

  it('shows amounts for all items', () => {
    render(<TodoItemList budgetId="123" items={mockItems} />)
    
    expect(screen.getByText(/8 000,00 kr/)).toBeInTheDocument()
    expect(screen.getByText(/500,00 kr/)).toBeInTheDocument()
    expect(screen.getByText(/5 000,00 kr/)).toBeInTheDocument()
  })

  it('does not show Manual Payments section when no expenses', () => {
    const savingsOnly = mockItems.filter((item) => item.type === 'SAVINGS')
    render(<TodoItemList budgetId="123" items={savingsOnly} />)
    
    expect(screen.queryByText('Manual Payments')).not.toBeInTheDocument()
    expect(screen.getByText('Savings Transfers')).toBeInTheDocument()
  })

  it('does not show Savings Transfers section when no savings', () => {
    const expensesOnly = mockItems.filter((item) => item.type === 'EXPENSE')
    render(<TodoItemList budgetId="123" items={expensesOnly} />)
    
    expect(screen.getByText('Manual Payments')).toBeInTheDocument()
    expect(screen.queryByText('Savings Transfers')).not.toBeInTheDocument()
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

const pendingExpense: TodoItem = {
  id: 'todo-1',
  type: 'EXPENSE',
  description: 'Pay Rent',
  amount: 8000,
  status: 'PENDING',
  expenseItemId: 'exp-1',
}

const completedSavings: TodoItem = {
  id: 'todo-2',
  type: 'SAVINGS',
  description: 'Transfer to Savings',
  amount: 5000,
  status: 'COMPLETED',
  savingsItemId: 'sav-1',
  targetAccountId: 'acc-1',
  targetAccountName: 'Savings Account',
}

describe('TodoItemRow', () => {
  beforeEach(() => {
    server.use(
      http.put('/api/budgets/:budgetId/todo/:itemId', () => {
        return HttpResponse.json({ status: 'COMPLETED' })
      })
    )
  })

  it('renders item description', () => {
    render(<TodoItemRow budgetId="123" item={pendingExpense} />)
    
    expect(screen.getByText('Pay Rent')).toBeInTheDocument()
  })

  it('renders item amount', () => {
    render(<TodoItemRow budgetId="123" item={pendingExpense} />)
    
    expect(screen.getByText(/8 000,00 kr/)).toBeInTheDocument()
  })

  it('shows unchecked checkbox for pending items', () => {
    render(<TodoItemRow budgetId="123" item={pendingExpense} />)
    
    const checkbox = screen.getByRole('checkbox')
    expect(checkbox).not.toBeChecked()
  })

  it('shows checked checkbox for completed items', () => {
    render(<TodoItemRow budgetId="123" item={completedSavings} />)
    
    const checkbox = screen.getByRole('checkbox')
    expect(checkbox).toBeChecked()
  })

  it('applies strikethrough to completed items', () => {
    render(<TodoItemRow budgetId="123" item={completedSavings} />)
    
    const description = screen.getByText('Transfer to Savings')
    expect(description).toHaveClass('line-through')
  })

  it('shows Payment badge for expense items', () => {
    render(<TodoItemRow budgetId="123" item={pendingExpense} />)
    
    expect(screen.getByText('Payment')).toBeInTheDocument()
  })

  it('shows Transfer badge for savings items', () => {
    render(<TodoItemRow budgetId="123" item={completedSavings} />)
    
    expect(screen.getByText('Transfer')).toBeInTheDocument()
  })

  it('shows target account for savings items', () => {
    render(<TodoItemRow budgetId="123" item={completedSavings} />)
    
    expect(screen.getByText(/to: savings account/i)).toBeInTheDocument()
  })

  it('calls API when checkbox toggled', async () => {
    let requestBody: unknown
    server.use(
      http.put('/api/budgets/123/todo/todo-1', async ({ request }) => {
        requestBody = await request.json()
        return HttpResponse.json({ status: 'COMPLETED' })
      })
    )

    render(<TodoItemRow budgetId="123" item={pendingExpense} />)
    
    await userEvent.click(screen.getByRole('checkbox'))
    
    await waitFor(() => {
      expect(requestBody).toEqual({ status: 'COMPLETED' })
    })
  })

  it('shows update balance button for completed savings', () => {
    const onUpdateBalance = vi.fn()
    render(
      <TodoItemRow
        budgetId="123"
        item={completedSavings}
        onUpdateBalance={onUpdateBalance}
      />
    )
    
    expect(screen.getByTitle(/update account balance/i)).toBeInTheDocument()
  })

  it('does not show update balance button for pending savings', () => {
    const pendingSavings = { ...completedSavings, status: 'PENDING' as const }
    render(
      <TodoItemRow
        budgetId="123"
        item={pendingSavings}
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
        item={completedSavings}
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

## Story 7.4: Update Balance Quick Action

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

## Story 7.5: Optimistic Updates for Todo Toggle

**As a** user  
**I want to** see immediate feedback when toggling todo items  
**So that** the interface feels responsive

### Acceptance Criteria

- [ ] Checkbox state updates immediately on click
- [ ] Progress bar updates immediately
- [ ] If API fails, state reverts
- [ ] Error toast shown on failure

### Implementation

Update the React Query hook to use optimistic updates. This is already implemented in the hooks from Epic 1.

**Update `src/hooks/use-todo.ts`:**

```typescript
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getTodoList, updateTodoItem } from '@/api/todo'
import { queryKeys } from './query-keys'
import type { TodoList, TodoItem } from '@/api/types'

export function useBudgetTodo(budgetId: string) {
  return useQuery({
    queryKey: queryKeys.budgetTodo(budgetId),
    queryFn: () => getTodoList(budgetId),
    enabled: !!budgetId,
  })
}

export function useUpdateTodoItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      budgetId,
      itemId,
      data,
    }: {
      budgetId: string
      itemId: string
      data: { status: 'PENDING' | 'COMPLETED' }
    }) => updateTodoItem(budgetId, itemId, data),

    // Optimistic update
    onMutate: async ({ budgetId, itemId, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.budgetTodo(budgetId) })

      // Snapshot previous value
      const previousTodo = queryClient.getQueryData<TodoList>(queryKeys.budgetTodo(budgetId))

      // Optimistically update
      if (previousTodo) {
        queryClient.setQueryData<TodoList>(queryKeys.budgetTodo(budgetId), {
          ...previousTodo,
          items: previousTodo.items.map((item) =>
            item.id === itemId ? { ...item, status: data.status } : item
          ),
        })
      }

      return { previousTodo }
    },

    // Revert on error
    onError: (err, { budgetId }, context) => {
      if (context?.previousTodo) {
        queryClient.setQueryData(queryKeys.budgetTodo(budgetId), context.previousTodo)
      }
    },

    // Refetch after success or error
    onSettled: (data, error, { budgetId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.budgetTodo(budgetId) })
    },
  })
}
```

### Test File: `src/hooks/use-todo.test.tsx`

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useBudgetTodo, useUpdateTodoItem } from './use-todo'
import { server } from '@/test/mocks/server'
import { http, HttpResponse } from 'msw'
import type { ReactNode } from 'react'

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    )
  }
}

describe('useBudgetTodo', () => {
  beforeEach(() => {
    server.use(
      http.get('/api/budgets/123/todo', () => {
        return HttpResponse.json({
          budgetId: '123',
          month: 3,
          year: 2025,
          items: [
            { id: 'todo-1', type: 'EXPENSE', description: 'Pay Rent', amount: 8000, status: 'PENDING' },
          ],
        })
      })
    )
  })

  it('fetches todo list', async () => {
    const { result } = renderHook(() => useBudgetTodo('123'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data?.items).toHaveLength(1)
    expect(result.current.data?.items[0].description).toBe('Pay Rent')
  })
})

describe('useUpdateTodoItem', () => {
  beforeEach(() => {
    server.use(
      http.get('/api/budgets/123/todo', () => {
        return HttpResponse.json({
          budgetId: '123',
          month: 3,
          year: 2025,
          items: [
            { id: 'todo-1', type: 'EXPENSE', description: 'Pay Rent', amount: 8000, status: 'PENDING' },
          ],
        })
      }),
      http.put('/api/budgets/123/todo/todo-1', () => {
        return HttpResponse.json({ id: 'todo-1', status: 'COMPLETED' })
      })
    )
  })

  it('updates todo item optimistically', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })

    // Pre-populate the cache
    queryClient.setQueryData(['budgets', '123', 'todo'], {
      budgetId: '123',
      month: 3,
      year: 2025,
      items: [
        { id: 'todo-1', type: 'EXPENSE', description: 'Pay Rent', amount: 8000, status: 'PENDING' },
      ],
    })

    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    )

    const { result } = renderHook(() => useUpdateTodoItem(), { wrapper })

    result.current.mutate({
      budgetId: '123',
      itemId: 'todo-1',
      data: { status: 'COMPLETED' },
    })

    // Check optimistic update happened
    await waitFor(() => {
      const cachedData = queryClient.getQueryData(['budgets', '123', 'todo']) as { items: Array<{ status: string }> }
      expect(cachedData.items[0].status).toBe('COMPLETED')
    })
  })

  it('reverts on error', async () => {
    server.use(
      http.put('/api/budgets/123/todo/todo-1', () => {
        return HttpResponse.json({ error: 'Failed' }, { status: 500 })
      })
    )

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })

    // Pre-populate the cache
    queryClient.setQueryData(['budgets', '123', 'todo'], {
      budgetId: '123',
      month: 3,
      year: 2025,
      items: [
        { id: 'todo-1', type: 'EXPENSE', description: 'Pay Rent', amount: 8000, status: 'PENDING' },
      ],
    })

    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    )

    const { result } = renderHook(() => useUpdateTodoItem(), { wrapper })

    result.current.mutate({
      budgetId: '123',
      itemId: 'todo-1',
      data: { status: 'COMPLETED' },
    })

    // Wait for error and revert
    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    // Check it reverted
    await waitFor(() => {
      const cachedData = queryClient.getQueryData(['budgets', '123', 'todo']) as { items: Array<{ status: string }> }
      expect(cachedData.items[0].status).toBe('PENDING')
    })
  })
})
```

### Definition of Done

- [ ] Tests pass
- [ ] Checkbox updates immediately
- [ ] Progress updates immediately
- [ ] Error reverts the update

---

## Epic 7 Complete File Structure

```
src/
├── api/
│   └── todo.ts
├── components/
│   └── todo/
│       ├── index.ts
│       ├── TodoItemList.tsx
│       ├── TodoItemRow.tsx
│       ├── TodoProgress.tsx
│       └── UpdateBalanceModal.tsx
├── hooks/
│   └── use-todo.ts
└── pages/
    └── TodoListPage.tsx
```

**Create API file `src/api/todo.ts`:**

```typescript
import { apiGet, apiPut } from './client'
import type { TodoList } from './types'

export async function getTodoList(budgetId: string): Promise<TodoList> {
  return apiGet<TodoList>(`/api/budgets/${budgetId}/todo`)
}

export async function updateTodoItem(
  budgetId: string,
  itemId: string,
  data: { status: 'PENDING' | 'COMPLETED' }
): Promise<{ id: string; status: string }> {
  return apiPut<{ id: string; status: string }>(
    `/api/budgets/${budgetId}/todo/${itemId}`,
    data
  )
}
```

**Add types to `src/api/types.ts`:**

```typescript
// Add to existing types.ts

export type TodoItemType = 'EXPENSE' | 'SAVINGS'
export type TodoItemStatus = 'PENDING' | 'COMPLETED'

export interface TodoItem {
  id: string
  type: TodoItemType
  description: string
  amount: number
  status: TodoItemStatus
  expenseItemId?: string
  savingsItemId?: string
  targetAccountId?: string
  targetAccountName?: string
}

export interface TodoList {
  budgetId: string
  month: number
  year: number
  items: TodoItem[]
}
```

**Create barrel export `src/components/todo/index.ts`:**

```typescript
export { TodoProgress } from './TodoProgress'
export { TodoItemList } from './TodoItemList'
export { TodoItemRow } from './TodoItemRow'
export { UpdateBalanceModal } from './UpdateBalanceModal'
```

**Update query keys `src/hooks/query-keys.ts`:**

```typescript
export const queryKeys = {
  // ... existing keys
  budgetTodo: (budgetId: string) => ['budgets', budgetId, 'todo'] as const,
}
```

---

## Test Summary

| Component | Test File | Tests (approx) |
|-----------|-----------|----------------|
| TodoListPage | TodoListPage.test.tsx | 6 |
| TodoProgress | TodoProgress.test.tsx | 6 |
| TodoItemList | TodoItemList.test.tsx | 6 |
| TodoItemRow | TodoItemRow.test.tsx | 11 |
| UpdateBalanceModal | UpdateBalanceModal.test.tsx | 7 |
| use-todo hooks | use-todo.test.tsx | 3 |

**Total: ~39 tests for Epic 7**

---

## MSW Handlers Update

Add these handlers to `src/test/mocks/handlers.ts`:

```typescript
// Get todo list
http.get('/api/budgets/:id/todo', ({ params }) => {
  return HttpResponse.json({
    budgetId: params.id,
    month: 3,
    year: 2025,
    items: [
      {
        id: 'todo-1',
        type: 'EXPENSE',
        description: 'Pay Rent',
        amount: 8000,
        status: 'PENDING',
        expenseItemId: 'exp-1',
      },
      {
        id: 'todo-2',
        type: 'SAVINGS',
        description: 'Transfer to Savings',
        amount: 5000,
        status: 'COMPLETED',
        savingsItemId: 'sav-1',
        targetAccountId: 'acc-1',
        targetAccountName: 'Savings Account',
      },
    ],
  })
}),

// Update todo item
http.put('/api/budgets/:budgetId/todo/:itemId', async ({ request }) => {
  const body = await request.json() as { status: string }
  return HttpResponse.json({ id: 'todo-1', status: body.status })
}),
```

---

## Final Progress Summary

| Epic | Stories | Tests |
|------|---------|-------|
| Epic 1: Infrastructure | 6 | ~50 |
| Epic 2: Accounts | 7 | ~46 |
| Epic 3: Recurring Expenses | 5 | ~42 |
| Epic 4: Budget List | 3 | ~24 |
| Epic 5: Budget Wizard | 7 | ~83 |
| Epic 6: Budget Detail | 9 | ~58 |
| **Epic 7: Todo List** | **5** | **~39** |
| **TOTAL** | **42** | **~342** |

---

## Complete Frontend Architecture

```
src/
├── api/
│   ├── accounts.ts
│   ├── budgets.ts
│   ├── client.ts
│   ├── index.ts
│   ├── recurring-expenses.ts
│   ├── todo.ts
│   └── types.ts
├── components/
│   ├── accounts/
│   │   ├── AccountCard.tsx
│   │   ├── AccountRow.tsx
│   │   ├── AccountsList.tsx
│   │   ├── AccountsSummary.tsx
│   │   ├── BalanceHistoryDrawer.tsx
│   │   ├── CreateAccountModal.tsx
│   │   ├── DeleteAccountDialog.tsx
│   │   ├── EditAccountModal.tsx
│   │   ├── UpdateBalanceModal.tsx
│   │   ├── schemas.ts
│   │   └── index.ts
│   ├── budget-detail/
│   │   ├── BudgetActions.tsx
│   │   ├── BudgetSection.tsx
│   │   ├── BudgetSummary.tsx
│   │   ├── DeleteItemDialog.tsx
│   │   ├── ExpenseItemModal.tsx
│   │   ├── IncomeItemModal.tsx
│   │   ├── SavingsItemModal.tsx
│   │   ├── schemas.ts
│   │   └── index.ts
│   ├── budgets/
│   │   ├── BudgetCard.tsx
│   │   ├── BudgetGrid.tsx
│   │   └── index.ts
│   ├── layout/
│   │   ├── AppLayout.tsx
│   │   ├── Header.tsx
│   │   └── Sidebar.tsx
│   ├── recurring-expenses/
│   │   ├── CreateRecurringExpenseModal.tsx
│   │   ├── DeleteRecurringExpenseDialog.tsx
│   │   ├── DueStatusIndicator.tsx
│   │   ├── EditRecurringExpenseModal.tsx
│   │   ├── RecurringExpenseCard.tsx
│   │   ├── RecurringExpenseRow.tsx
│   │   ├── RecurringExpensesList.tsx
│   │   ├── schemas.ts
│   │   └── index.ts
│   ├── shared/
│   │   ├── ConfirmDialog.tsx
│   │   ├── EmptyState.tsx
│   │   ├── ErrorState.tsx
│   │   ├── LoadingState.tsx
│   │   ├── PageHeader.tsx
│   │   └── index.ts
│   ├── todo/
│   │   ├── TodoItemList.tsx
│   │   ├── TodoItemRow.tsx
│   │   ├── TodoProgress.tsx
│   │   ├── UpdateBalanceModal.tsx
│   │   └── index.ts
│   ├── ui/ (shadcn components)
│   │   └── ...
│   └── wizard/
│       ├── WizardContext.tsx
│       ├── WizardNavigation.tsx
│       ├── WizardShell.tsx
│       ├── StepIndicator.tsx
│       ├── types.ts
│       ├── wizardReducer.ts
│       ├── steps/
│       │   ├── StepMonthYear.tsx
│       │   ├── StepIncome.tsx
│       │   ├── StepExpenses.tsx
│       │   ├── StepSavings.tsx
│       │   └── StepReview.tsx
│       └── index.ts
├── hooks/
│   ├── query-keys.ts
│   ├── use-accounts.ts
│   ├── use-budgets.ts
│   ├── use-recurring-expenses.ts
│   └── use-todo.ts
├── lib/
│   └── utils.ts
├── pages/
│   ├── AccountsPage.tsx
│   ├── BudgetDetailPage.tsx
│   ├── BudgetsPage.tsx
│   ├── BudgetWizardPage.tsx
│   ├── NotFoundPage.tsx
│   ├── RecurringExpensesPage.tsx
│   └── TodoListPage.tsx
├── test/
│   ├── mocks/
│   │   ├── handlers.ts
│   │   └── server.ts
│   ├── setup.ts
│   └── test-utils.tsx
├── App.tsx
├── index.css
├── main.tsx
└── routes.ts
```

---

## All Stories Complete! 🎉

You now have detailed, implementable stories for the entire Balance frontend:

| Document | Epics | Stories | Tests |
|----------|-------|---------|-------|
| FRONTEND_STORIES_EPIC1.md | Infrastructure | 6 | ~50 |
| FRONTEND_STORIES_EPIC2.md | Accounts | 7 | ~46 |
| FRONTEND_STORIES_EPIC3.md | Recurring Expenses | 5 | ~42 |
| FRONTEND_STORIES_EPIC4.md | Budget List | 3 | ~24 |
| FRONTEND_STORIES_EPIC5.md | Budget Wizard | 7 | ~83 |
| FRONTEND_STORIES_EPIC6.md | Budget Detail | 9 | ~58 |
| FRONTEND_STORIES_EPIC7.md | Todo List | 5 | ~39 |
| **TOTAL** | **7 Epics** | **42 Stories** | **~342 Tests** |

---

## Implementation Order

1. **Epic 1: Infrastructure** — Foundation, must be first
2. **Epic 2: Accounts** — No dependencies on other features
3. **Epic 3: Recurring Expenses** — No dependencies on other features
4. **Epic 4: Budget List** — Simple, sets up routing
5. **Epic 5: Budget Wizard** — Depends on Accounts, Recurring Expenses
6. **Epic 6: Budget Detail** — Depends on Budget Wizard patterns
7. **Epic 7: Todo List** — Depends on Budget Detail (locked budgets)

Each epic can be developed independently after Epic 1, though the order above represents logical dependencies.

---

*Frontend Stories Complete — December 2024*
