# Story 3.2: Recurring Expenses List

**As a** user  
**I want to** see all my recurring expense templates with due status  
**So that** I know which expenses need attention

### Acceptance Criteria

- [ ] Lists all recurring expenses in a table (desktop) or cards (mobile)
- [ ] Each row shows: name, amount, interval, due status, actions
- [ ] Due status indicator: 🔴 red (due now), 🟢 green (not due), 🟡 yellow (never used)
- [ ] Due column shows "Due now" or next due date
- [ ] Sorted by: due items first, then by next due date ascending
- [ ] Shows loading state while fetching
- [ ] Shows empty state when no templates exist
- [ ] Shows error state with retry on failure
- [ ] Clicking a row opens the Edit modal

### Components to Create

1. `RecurringExpensesList` — Table/card list
2. `RecurringExpenseRow` — Table row
3. `RecurringExpenseCard` — Mobile card
4. `DueStatusIndicator` — Visual status badge

### Implementation

**Create `src/components/recurring-expenses/DueStatusIndicator.tsx`:**

```typescript
import { cn } from '@/lib/utils'
import { formatMonthYear } from '@/lib/utils'

interface DueStatusIndicatorProps {
  isDue: boolean
  nextDueDate: string | null
  lastUsedDate: string | null
}

export function DueStatusIndicator({ isDue, nextDueDate, lastUsedDate }: DueStatusIndicatorProps) {
  // Never used
  if (lastUsedDate === null) {
    return (
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-yellow-500" aria-hidden="true" />
        <span className="text-sm text-gray-600">Never used</span>
      </div>
    )
  }

  // Due now
  if (isDue) {
    return (
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-red-500" aria-hidden="true" />
        <span className="text-sm font-medium text-red-600">Due now</span>
      </div>
    )
  }

  // Not due - show next due date
  if (nextDueDate) {
    const date = new Date(nextDueDate)
    const month = date.getMonth() + 1
    const year = date.getFullYear()
    
    return (
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-green-500" aria-hidden="true" />
        <span className="text-sm text-gray-600">{formatMonthYear(month, year)}</span>
      </div>
    )
  }

  return null
}
```

**Create `src/components/recurring-expenses/RecurringExpenseRow.tsx`:**

```typescript
import { Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import { DueStatusIndicator } from './DueStatusIndicator'
import type { RecurringExpense } from '@/api/types'

interface RecurringExpenseRowProps {
  expense: RecurringExpense
  onEdit: (expense: RecurringExpense) => void
  onDelete: (expense: RecurringExpense) => void
  onClick: (expense: RecurringExpense) => void
}

const INTERVAL_LABELS: Record<string, string> = {
  MONTHLY: 'Monthly',
  QUARTERLY: 'Quarterly',
  BIANNUALLY: 'Biannually',
  YEARLY: 'Yearly',
}

export function RecurringExpenseRow({ expense, onEdit, onDelete, onClick }: RecurringExpenseRowProps) {
  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    onEdit(expense)
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    onDelete(expense)
  }

  return (
    <tr
      className="hover:bg-gray-50 cursor-pointer"
      onClick={() => onClick(expense)}
    >
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <DueStatusIndicator
            isDue={expense.isDue}
            nextDueDate={expense.nextDueDate}
            lastUsedDate={expense.lastUsedDate}
          />
          <span className="font-medium text-gray-900">{expense.name}</span>
        </div>
      </td>
      <td className="px-4 py-3 text-right font-medium text-gray-900">
        {formatCurrency(expense.amount)}
      </td>
      <td className="px-4 py-3 text-gray-500">
        {INTERVAL_LABELS[expense.recurrenceInterval]}
      </td>
      <td className="px-4 py-3 text-right">
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleEdit}
            aria-label={`Edit ${expense.name}`}
          >
            <Pencil className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            aria-label={`Delete ${expense.name}`}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </td>
    </tr>
  )
}
```

**Create `src/components/recurring-expenses/RecurringExpenseCard.tsx`:**

```typescript
import { Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import { DueStatusIndicator } from './DueStatusIndicator'
import type { RecurringExpense } from '@/api/types'

interface RecurringExpenseCardProps {
  expense: RecurringExpense
  onEdit: (expense: RecurringExpense) => void
  onDelete: (expense: RecurringExpense) => void
  onClick: (expense: RecurringExpense) => void
}

const INTERVAL_LABELS: Record<string, string> = {
  MONTHLY: 'Monthly',
  QUARTERLY: 'Quarterly',
  BIANNUALLY: 'Biannually',
  YEARLY: 'Yearly',
}

export function RecurringExpenseCard({ expense, onEdit, onDelete, onClick }: RecurringExpenseCardProps) {
  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    onEdit(expense)
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    onDelete(expense)
  }

  return (
    <Card
      className="cursor-pointer hover:border-gray-300 transition-colors"
      onClick={() => onClick(expense)}
    >
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <DueStatusIndicator
                isDue={expense.isDue}
                nextDueDate={expense.nextDueDate}
                lastUsedDate={expense.lastUsedDate}
              />
            </div>
            <h3 className="font-medium text-gray-900 truncate">{expense.name}</h3>
            <p className="text-sm text-gray-500">
              {formatCurrency(expense.amount)} • {INTERVAL_LABELS[expense.recurrenceInterval]}
            </p>
          </div>
          <div className="flex gap-1 ml-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleEdit}
              aria-label={`Edit ${expense.name}`}
            >
              <Pencil className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              aria-label={`Delete ${expense.name}`}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
```

**Create `src/components/recurring-expenses/RecurringExpensesList.tsx`:**

```typescript
import { RefreshCw } from 'lucide-react'
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { LoadingState, EmptyState, ErrorState } from '@/components/shared'
import { Button } from '@/components/ui/button'
import { RecurringExpenseRow } from './RecurringExpenseRow'
import { RecurringExpenseCard } from './RecurringExpenseCard'
import type { RecurringExpense } from '@/api/types'

interface RecurringExpensesListProps {
  expenses: RecurringExpense[]
  isLoading: boolean
  isError: boolean
  onRetry: () => void
  onEdit: (expense: RecurringExpense) => void
  onDelete: (expense: RecurringExpense) => void
  onClick: (expense: RecurringExpense) => void
  onCreateNew: () => void
}

// Sort: due items first, then by next due date ascending
function sortExpenses(expenses: RecurringExpense[]): RecurringExpense[] {
  return [...expenses].sort((a, b) => {
    // Never used items (yellow) come after due items but before not-due items
    const aScore = a.isDue ? 0 : a.lastUsedDate === null ? 1 : 2
    const bScore = b.isDue ? 0 : b.lastUsedDate === null ? 1 : 2
    
    if (aScore !== bScore) return aScore - bScore
    
    // Within same category, sort by next due date
    if (a.nextDueDate && b.nextDueDate) {
      return new Date(a.nextDueDate).getTime() - new Date(b.nextDueDate).getTime()
    }
    
    // Items without next due date come last
    if (!a.nextDueDate) return 1
    if (!b.nextDueDate) return -1
    
    return 0
  })
}

export function RecurringExpensesList({
  expenses,
  isLoading,
  isError,
  onRetry,
  onEdit,
  onDelete,
  onClick,
  onCreateNew,
}: RecurringExpensesListProps) {
  if (isLoading) {
    return <LoadingState variant="table" rows={3} />
  }

  if (isError) {
    return (
      <ErrorState
        title="Failed to load recurring expenses"
        message="We couldn't load your recurring expenses. Please try again."
        onRetry={onRetry}
      />
    )
  }

  if (expenses.length === 0) {
    return (
      <EmptyState
        icon={<RefreshCw className="w-12 h-12" />}
        title="No recurring expenses yet"
        description="Create templates for regular expenses like rent, subscriptions, and bills to quickly add them to your monthly budgets."
        action={
          <Button onClick={onCreateNew}>Create Recurring Expense</Button>
        }
      />
    )
  }

  const sortedExpenses = sortExpenses(expenses)

  return (
    <>
      {/* Desktop Table */}
      <div className="hidden md:block bg-white rounded-lg border border-gray-200">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[300px]">Name</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Interval</TableHead>
              <TableHead className="w-[100px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedExpenses.map((expense) => (
              <RecurringExpenseRow
                key={expense.id}
                expense={expense}
                onEdit={onEdit}
                onDelete={onDelete}
                onClick={onClick}
              />
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {sortedExpenses.map((expense) => (
          <RecurringExpenseCard
            key={expense.id}
            expense={expense}
            onEdit={onEdit}
            onDelete={onDelete}
            onClick={onClick}
          />
        ))}
      </div>

      {/* Helper text */}
      <p className="text-sm text-gray-500 mt-4 text-center">
        Click any row to edit
      </p>
    </>
  )
}
```

**Create barrel export `src/components/recurring-expenses/index.ts`:**

```typescript
export { DueStatusIndicator } from './DueStatusIndicator'
export { RecurringExpenseRow } from './RecurringExpenseRow'
export { RecurringExpenseCard } from './RecurringExpenseCard'
export { RecurringExpensesList } from './RecurringExpensesList'
```

### Test File: `src/components/recurring-expenses/DueStatusIndicator.test.tsx`

```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@/test/test-utils'
import { DueStatusIndicator } from './DueStatusIndicator'

describe('DueStatusIndicator', () => {
  it('shows "Never used" for items without lastUsedDate', () => {
    render(
      <DueStatusIndicator
        isDue={false}
        nextDueDate={null}
        lastUsedDate={null}
      />
    )
    
    expect(screen.getByText(/never used/i)).toBeInTheDocument()
  })

  it('shows yellow indicator for never used items', () => {
    const { container } = render(
      <DueStatusIndicator
        isDue={false}
        nextDueDate={null}
        lastUsedDate={null}
      />
    )
    
    expect(container.querySelector('.bg-yellow-500')).toBeInTheDocument()
  })

  it('shows "Due now" for due items', () => {
    render(
      <DueStatusIndicator
        isDue={true}
        nextDueDate="2025-01-01"
        lastUsedDate="2024-12-01"
      />
    )
    
    expect(screen.getByText(/due now/i)).toBeInTheDocument()
  })

  it('shows red indicator for due items', () => {
    const { container } = render(
      <DueStatusIndicator
        isDue={true}
        nextDueDate="2025-01-01"
        lastUsedDate="2024-12-01"
      />
    )
    
    expect(container.querySelector('.bg-red-500')).toBeInTheDocument()
  })

  it('shows next due date for not-due items', () => {
    render(
      <DueStatusIndicator
        isDue={false}
        nextDueDate="2025-06-01"
        lastUsedDate="2025-01-01"
      />
    )
    
    // Should show month/year format
    expect(screen.getByText(/juni 2025/i)).toBeInTheDocument()
  })

  it('shows green indicator for not-due items', () => {
    const { container } = render(
      <DueStatusIndicator
        isDue={false}
        nextDueDate="2025-06-01"
        lastUsedDate="2025-01-01"
      />
    )
    
    expect(container.querySelector('.bg-green-500')).toBeInTheDocument()
  })
})
```

### Test File: `src/components/recurring-expenses/RecurringExpensesList.test.tsx`

```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import { RecurringExpensesList } from './RecurringExpensesList'
import type { RecurringExpense } from '@/api/types'

const mockExpenses: RecurringExpense[] = [
  {
    id: '1',
    name: 'Rent',
    amount: 8000,
    recurrenceInterval: 'MONTHLY',
    isManual: true,
    lastUsedDate: '2025-01-01',
    nextDueDate: '2025-02-01',
    isDue: true,
    createdAt: '2025-01-01',
  },
  {
    id: '2',
    name: 'Car Insurance',
    amount: 3000,
    recurrenceInterval: 'BIANNUALLY',
    isManual: false,
    lastUsedDate: '2025-01-01',
    nextDueDate: '2025-07-01',
    isDue: false,
    createdAt: '2025-01-01',
  },
  {
    id: '3',
    name: 'New Subscription',
    amount: 100,
    recurrenceInterval: 'MONTHLY',
    isManual: false,
    lastUsedDate: null,
    nextDueDate: null,
    isDue: false,
    createdAt: '2025-01-01',
  },
]

const defaultProps = {
  expenses: mockExpenses,
  isLoading: false,
  isError: false,
  onRetry: vi.fn(),
  onEdit: vi.fn(),
  onDelete: vi.fn(),
  onClick: vi.fn(),
  onCreateNew: vi.fn(),
}

describe('RecurringExpensesList', () => {
  it('renders loading state', () => {
    render(<RecurringExpensesList {...defaultProps} isLoading={true} expenses={[]} />)
    
    expect(screen.queryByText('Rent')).not.toBeInTheDocument()
  })

  it('renders error state with retry button', async () => {
    const onRetry = vi.fn()
    render(<RecurringExpensesList {...defaultProps} isError={true} expenses={[]} onRetry={onRetry} />)
    
    expect(screen.getByText(/failed to load/i)).toBeInTheDocument()
    
    await userEvent.click(screen.getByRole('button', { name: /try again/i }))
    expect(onRetry).toHaveBeenCalled()
  })

  it('renders empty state when no expenses', () => {
    render(<RecurringExpensesList {...defaultProps} expenses={[]} />)
    
    expect(screen.getByText(/no recurring expenses yet/i)).toBeInTheDocument()
  })

  it('renders empty state with create button', async () => {
    const onCreateNew = vi.fn()
    render(<RecurringExpensesList {...defaultProps} expenses={[]} onCreateNew={onCreateNew} />)
    
    await userEvent.click(screen.getByRole('button', { name: /create recurring expense/i }))
    expect(onCreateNew).toHaveBeenCalled()
  })

  it('renders expense names', () => {
    render(<RecurringExpensesList {...defaultProps} />)
    
    expect(screen.getByText('Rent')).toBeInTheDocument()
    expect(screen.getByText('Car Insurance')).toBeInTheDocument()
    expect(screen.getByText('New Subscription')).toBeInTheDocument()
  })

  it('renders expense amounts', () => {
    render(<RecurringExpensesList {...defaultProps} />)
    
    expect(screen.getByText(/8 000,00 kr/)).toBeInTheDocument()
    expect(screen.getByText(/3 000,00 kr/)).toBeInTheDocument()
  })

  it('renders interval labels', () => {
    render(<RecurringExpensesList {...defaultProps} />)
    
    expect(screen.getByText('Monthly')).toBeInTheDocument()
    expect(screen.getByText('Biannually')).toBeInTheDocument()
  })

  it('shows due status indicators', () => {
    render(<RecurringExpensesList {...defaultProps} />)
    
    expect(screen.getByText(/due now/i)).toBeInTheDocument()
    expect(screen.getByText(/never used/i)).toBeInTheDocument()
  })

  it('sorts due items first', () => {
    render(<RecurringExpensesList {...defaultProps} />)
    
    const rows = screen.getAllByRole('row')
    // First data row (after header) should be the due item
    expect(rows[1]).toHaveTextContent('Rent')
  })

  it('calls onClick when row is clicked', async () => {
    const onClick = vi.fn()
    render(<RecurringExpensesList {...defaultProps} onClick={onClick} />)
    
    await userEvent.click(screen.getByText('Rent'))
    
    expect(onClick).toHaveBeenCalledWith(mockExpenses[0])
  })

  it('calls onEdit when edit button is clicked', async () => {
    const onEdit = vi.fn()
    render(<RecurringExpensesList {...defaultProps} onEdit={onEdit} />)
    
    const editButtons = screen.getAllByRole('button', { name: /edit/i })
    await userEvent.click(editButtons[0])
    
    expect(onEdit).toHaveBeenCalled()
  })

  it('calls onDelete when delete button is clicked', async () => {
    const onDelete = vi.fn()
    render(<RecurringExpensesList {...defaultProps} onDelete={onDelete} />)
    
    const deleteButtons = screen.getAllByRole('button', { name: /delete/i })
    await userEvent.click(deleteButtons[0])
    
    expect(onDelete).toHaveBeenCalled()
  })

  it('edit button click does not trigger row click', async () => {
    const onClick = vi.fn()
    const onEdit = vi.fn()
    render(<RecurringExpensesList {...defaultProps} onClick={onClick} onEdit={onEdit} />)
    
    const editButtons = screen.getAllByRole('button', { name: /edit/i })
    await userEvent.click(editButtons[0])
    
    expect(onEdit).toHaveBeenCalled()
    expect(onClick).not.toHaveBeenCalled()
  })
})
```

### Definition of Done

- [ ] All tests pass
- [ ] Table view works on desktop
- [ ] Card view works on mobile
- [ ] Due status indicators display correctly
- [ ] Sorting works (due first, then by date)
- [ ] Loading, error, and empty states work
- [ ] Click handlers fire correctly

---