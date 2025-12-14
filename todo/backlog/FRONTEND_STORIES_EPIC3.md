# Balance — Frontend Stories: Epic 3 (Recurring Expenses)

This document contains detailed, implementable stories for the Recurring Expenses epic. Complete Epic 1 (Infrastructure) before starting this epic.

---

## Epic Overview

The Recurring Expenses feature allows users to:
- View all recurring expense templates
- See which expenses are due based on their interval
- Create new templates
- Edit existing templates
- Delete templates

Recurring expenses are **templates**, not actual budget items. They make it easy to quickly add regular expenses (rent, subscriptions, insurance) to monthly budgets via the budget wizard.

**Dependencies:** Epic 1 (Infrastructure) must be complete.

**API Endpoints Used:**
- `GET /api/recurring-expenses`
- `POST /api/recurring-expenses`
- `PUT /api/recurring-expenses/:id`
- `DELETE /api/recurring-expenses/:id`

---

## Story 3.1: Recurring Expenses Page Shell

**As a** user  
**I want to** see a dedicated page for managing recurring expenses  
**So that** I have a clear place to manage my expense templates

### Acceptance Criteria

- [ ] Page renders at `/recurring-expenses` route
- [ ] Page header shows "Recurring Expenses" title
- [ ] "New Recurring Expense" button visible in header
- [ ] Main content area ready for list

### Implementation

**Update `src/pages/RecurringExpensesPage.tsx`:**

```typescript
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/shared'

export function RecurringExpensesPage() {
  return (
    <div>
      <PageHeader
        title="Recurring Expenses"
        description="Manage templates for regular expenses"
        action={
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Recurring Expense
          </Button>
        }
      />

      {/* List - to be implemented in 3.2 */}
      <div>
        {/* RecurringExpensesList component will go here */}
      </div>
    </div>
  )
}
```

### Test File: `src/pages/RecurringExpensesPage.test.tsx`

```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@/test/test-utils'
import { RecurringExpensesPage } from './RecurringExpensesPage'

describe('RecurringExpensesPage', () => {
  it('renders page header with title', () => {
    render(<RecurringExpensesPage />)
    
    expect(screen.getByRole('heading', { name: /recurring expenses/i })).toBeInTheDocument()
  })

  it('renders new recurring expense button', () => {
    render(<RecurringExpensesPage />)
    
    expect(screen.getByRole('button', { name: /new recurring expense/i })).toBeInTheDocument()
  })
})
```

### Definition of Done

- [ ] Tests pass
- [ ] Page renders at `/recurring-expenses`
- [ ] Header and button visible

---

## Story 3.2: Recurring Expenses List

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

## Story 3.3: Create Recurring Expense Modal

**As a** user  
**I want to** create a new recurring expense template  
**So that** I can quickly add it to future budgets

### Acceptance Criteria

- [ ] Modal opens when "New Recurring Expense" button is clicked
- [ ] Form has fields: Name (required), Amount (required), Interval (required), Manual Payment checkbox
- [ ] Interval dropdown: Monthly, Quarterly, Biannually, Yearly
- [ ] Validation: Name required, Amount must be positive
- [ ] Submit creates template via API
- [ ] Success: Close modal, show toast, refresh list
- [ ] Error: Show error message inline
- [ ] Cancel closes modal without changes

### Form Schema

**Create `src/components/recurring-expenses/schemas.ts`:**

```typescript
import { z } from 'zod'

export const createRecurringExpenseSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  amount: z
    .number({ invalid_type_error: 'Must be a number' })
    .positive('Amount must be greater than 0'),
  recurrenceInterval: z.enum(['MONTHLY', 'QUARTERLY', 'BIANNUALLY', 'YEARLY'], {
    required_error: 'Please select an interval',
  }),
  isManual: z.boolean().default(false),
})

export const updateRecurringExpenseSchema = createRecurringExpenseSchema

export type CreateRecurringExpenseFormData = z.infer<typeof createRecurringExpenseSchema>
export type UpdateRecurringExpenseFormData = z.infer<typeof updateRecurringExpenseSchema>
```

### Implementation

**Create `src/components/recurring-expenses/CreateRecurringExpenseModal.tsx`:**

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
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useCreateRecurringExpense } from '@/hooks'
import { createRecurringExpenseSchema, type CreateRecurringExpenseFormData } from './schemas'

interface CreateRecurringExpenseModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const INTERVAL_OPTIONS = [
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'QUARTERLY', label: 'Quarterly' },
  { value: 'BIANNUALLY', label: 'Biannually' },
  { value: 'YEARLY', label: 'Yearly' },
]

export function CreateRecurringExpenseModal({ open, onOpenChange }: CreateRecurringExpenseModalProps) {
  const createExpense = useCreateRecurringExpense()

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateRecurringExpenseFormData>({
    resolver: zodResolver(createRecurringExpenseSchema),
    defaultValues: {
      name: '',
      amount: undefined,
      recurrenceInterval: 'MONTHLY',
      isManual: false,
    },
  })

  const isManual = watch('isManual')
  const recurrenceInterval = watch('recurrenceInterval')

  const onSubmit = async (data: CreateRecurringExpenseFormData) => {
    try {
      await createExpense.mutateAsync({
        name: data.name,
        amount: data.amount,
        recurrenceInterval: data.recurrenceInterval,
        isManual: data.isManual,
      })
      toast.success('Recurring expense created')
      reset()
      onOpenChange(false)
    } catch (error) {
      // Error is handled by the mutation and displayed inline
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
          <DialogTitle>New Recurring Expense</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              {...register('name')}
              placeholder="e.g., Rent, Netflix, Insurance"
              autoFocus
            />
            {errors.name && (
              <p className="text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount *</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              {...register('amount', { valueAsNumber: true })}
              placeholder="0.00"
            />
            {errors.amount && (
              <p className="text-sm text-red-600">{errors.amount.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="interval">Interval *</Label>
            <Select
              value={recurrenceInterval}
              onValueChange={(value) => setValue('recurrenceInterval', value as CreateRecurringExpenseFormData['recurrenceInterval'])}
            >
              <SelectTrigger id="interval">
                <SelectValue placeholder="Select interval" />
              </SelectTrigger>
              <SelectContent>
                {INTERVAL_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.recurrenceInterval && (
              <p className="text-sm text-red-600">{errors.recurrenceInterval.message}</p>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="isManual"
              checked={isManual}
              onCheckedChange={(checked) => setValue('isManual', checked === true)}
            />
            <Label htmlFor="isManual" className="text-sm font-normal cursor-pointer">
              Requires manual payment
            </Label>
          </div>
          <p className="text-xs text-gray-500 -mt-2">
            If checked, this will create a payment todo item when the budget is locked.
          </p>

          {createExpense.error && (
            <p className="text-sm text-red-600">
              {createExpense.error.message}
            </p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={createExpense.isPending}>
              {createExpense.isPending ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
```

### Test File: `src/components/recurring-expenses/CreateRecurringExpenseModal.test.tsx`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import { CreateRecurringExpenseModal } from './CreateRecurringExpenseModal'
import { server } from '@/test/mocks/server'
import { http, HttpResponse } from 'msw'

describe('CreateRecurringExpenseModal', () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders form fields when open', () => {
    render(<CreateRecurringExpenseModal {...defaultProps} />)
    
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/amount/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/interval/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/manual payment/i)).toBeInTheDocument()
  })

  it('does not render when closed', () => {
    render(<CreateRecurringExpenseModal {...defaultProps} open={false} />)
    
    expect(screen.queryByLabelText(/name/i)).not.toBeInTheDocument()
  })

  it('shows validation error when name is empty', async () => {
    render(<CreateRecurringExpenseModal {...defaultProps} />)
    
    await userEvent.click(screen.getByRole('button', { name: /create/i }))
    
    expect(await screen.findByText(/name is required/i)).toBeInTheDocument()
  })

  it('shows validation error for invalid amount', async () => {
    render(<CreateRecurringExpenseModal {...defaultProps} />)
    
    await userEvent.type(screen.getByLabelText(/name/i), 'Test')
    await userEvent.type(screen.getByLabelText(/amount/i), '-100')
    await userEvent.click(screen.getByRole('button', { name: /create/i }))
    
    expect(await screen.findByText(/must be greater than 0/i)).toBeInTheDocument()
  })

  it('defaults interval to Monthly', () => {
    render(<CreateRecurringExpenseModal {...defaultProps} />)
    
    expect(screen.getByText('Monthly')).toBeInTheDocument()
  })

  it('submits form with valid data', async () => {
    let requestBody: unknown
    server.use(
      http.post('/api/recurring-expenses', async ({ request }) => {
        requestBody = await request.json()
        return HttpResponse.json({ id: '123', name: 'Rent' }, { status: 201 })
      })
    )

    const onOpenChange = vi.fn()
    render(<CreateRecurringExpenseModal open={true} onOpenChange={onOpenChange} />)
    
    await userEvent.type(screen.getByLabelText(/name/i), 'Rent')
    await userEvent.type(screen.getByLabelText(/amount/i), '8000')
    await userEvent.click(screen.getByLabelText(/manual payment/i))
    await userEvent.click(screen.getByRole('button', { name: /create/i }))
    
    await waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledWith(false)
    })
    
    expect(requestBody).toEqual({
      name: 'Rent',
      amount: 8000,
      recurrenceInterval: 'MONTHLY',
      isManual: true,
    })
  })

  it('allows selecting different intervals', async () => {
    render(<CreateRecurringExpenseModal {...defaultProps} />)
    
    await userEvent.click(screen.getByRole('combobox'))
    await userEvent.click(screen.getByText('Yearly'))
    
    expect(screen.getByText('Yearly')).toBeInTheDocument()
  })

  it('shows error message on API failure', async () => {
    server.use(
      http.post('/api/recurring-expenses', () => {
        return HttpResponse.json(
          { error: 'Recurring expense with this name already exists' },
          { status: 400 }
        )
      })
    )

    render(<CreateRecurringExpenseModal {...defaultProps} />)
    
    await userEvent.type(screen.getByLabelText(/name/i), 'Existing')
    await userEvent.type(screen.getByLabelText(/amount/i), '100')
    await userEvent.click(screen.getByRole('button', { name: /create/i }))
    
    expect(await screen.findByText(/already exists/i)).toBeInTheDocument()
  })

  it('closes modal when cancel is clicked', async () => {
    const onOpenChange = vi.fn()
    render(<CreateRecurringExpenseModal open={true} onOpenChange={onOpenChange} />)
    
    await userEvent.click(screen.getByRole('button', { name: /cancel/i }))
    
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('disables submit button while submitting', async () => {
    server.use(
      http.post('/api/recurring-expenses', async () => {
        await new Promise(resolve => setTimeout(resolve, 100))
        return HttpResponse.json({ id: '123' }, { status: 201 })
      })
    )

    render(<CreateRecurringExpenseModal {...defaultProps} />)
    
    await userEvent.type(screen.getByLabelText(/name/i), 'Test')
    await userEvent.type(screen.getByLabelText(/amount/i), '100')
    await userEvent.click(screen.getByRole('button', { name: /create/i }))
    
    expect(screen.getByRole('button', { name: /creating/i })).toBeDisabled()
  })
})
```

### Definition of Done

- [ ] All tests pass
- [ ] Modal opens/closes correctly
- [ ] Form validation works
- [ ] Interval dropdown works
- [ ] Manual payment checkbox works
- [ ] Successful submission creates expense
- [ ] Error messages display

---

## Story 3.4: Edit Recurring Expense Modal

**As a** user  
**I want to** edit an existing recurring expense template  
**So that** I can update amounts or change settings

### Acceptance Criteria

- [ ] Modal opens when edit button or row is clicked
- [ ] Form pre-filled with current values
- [ ] Can update name, amount, interval, and manual flag
- [ ] Shows last used date and next due date (read-only)
- [ ] Success: Close modal, show toast, refresh list
- [ ] Error: Show error message inline

### Implementation

**Create `src/components/recurring-expenses/EditRecurringExpenseModal.tsx`:**

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
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useUpdateRecurringExpense } from '@/hooks'
import { formatDate, formatMonthYear } from '@/lib/utils'
import { updateRecurringExpenseSchema, type UpdateRecurringExpenseFormData } from './schemas'
import type { RecurringExpense } from '@/api/types'

interface EditRecurringExpenseModalProps {
  expense: RecurringExpense | null
  onClose: () => void
}

const INTERVAL_OPTIONS = [
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'QUARTERLY', label: 'Quarterly' },
  { value: 'BIANNUALLY', label: 'Biannually' },
  { value: 'YEARLY', label: 'Yearly' },
]

export function EditRecurringExpenseModal({ expense, onClose }: EditRecurringExpenseModalProps) {
  const updateExpense = useUpdateRecurringExpense()
  const isOpen = expense !== null

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<UpdateRecurringExpenseFormData>({
    resolver: zodResolver(updateRecurringExpenseSchema),
  })

  const isManual = watch('isManual')
  const recurrenceInterval = watch('recurrenceInterval')

  // Reset form when expense changes
  useEffect(() => {
    if (expense) {
      reset({
        name: expense.name,
        amount: expense.amount,
        recurrenceInterval: expense.recurrenceInterval,
        isManual: expense.isManual,
      })
    }
  }, [expense, reset])

  const onSubmit = async (data: UpdateRecurringExpenseFormData) => {
    if (!expense) return

    try {
      await updateExpense.mutateAsync({
        id: expense.id,
        data: {
          name: data.name,
          amount: data.amount,
          recurrenceInterval: data.recurrenceInterval,
          isManual: data.isManual,
        },
      })
      toast.success('Recurring expense updated')
      onClose()
    } catch (error) {
      // Error displayed inline
    }
  }

  const getNextDueDisplay = () => {
    if (!expense) return null
    if (expense.lastUsedDate === null) return 'Never used'
    if (expense.isDue) return 'Due now'
    if (expense.nextDueDate) {
      const date = new Date(expense.nextDueDate)
      return formatMonthYear(date.getMonth() + 1, date.getFullYear())
    }
    return 'Unknown'
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Recurring Expense</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Name *</Label>
            <Input
              id="edit-name"
              {...register('name')}
              autoFocus
            />
            {errors.name && (
              <p className="text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-amount">Amount *</Label>
            <Input
              id="edit-amount"
              type="number"
              step="0.01"
              {...register('amount', { valueAsNumber: true })}
            />
            {errors.amount && (
              <p className="text-sm text-red-600">{errors.amount.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-interval">Interval *</Label>
            <Select
              value={recurrenceInterval}
              onValueChange={(value) => setValue('recurrenceInterval', value as UpdateRecurringExpenseFormData['recurrenceInterval'])}
            >
              <SelectTrigger id="edit-interval">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {INTERVAL_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="edit-isManual"
              checked={isManual}
              onCheckedChange={(checked) => setValue('isManual', checked === true)}
            />
            <Label htmlFor="edit-isManual" className="text-sm font-normal cursor-pointer">
              Requires manual payment
            </Label>
          </div>

          {/* Read-only info */}
          <div className="p-3 bg-gray-50 rounded-lg space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Last used:</span>
              <span className="text-gray-900">
                {expense?.lastUsedDate ? formatDate(expense.lastUsedDate) : 'Never'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Next due:</span>
              <span className="text-gray-900">{getNextDueDisplay()}</span>
            </div>
          </div>

          {updateExpense.error && (
            <p className="text-sm text-red-600">
              {updateExpense.error.message}
            </p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateExpense.isPending}>
              {updateExpense.isPending ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
```

### Test File: `src/components/recurring-expenses/EditRecurringExpenseModal.test.tsx`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import { EditRecurringExpenseModal } from './EditRecurringExpenseModal'
import { server } from '@/test/mocks/server'
import { http, HttpResponse } from 'msw'
import type { RecurringExpense } from '@/api/types'

const mockExpense: RecurringExpense = {
  id: '123',
  name: 'Rent',
  amount: 8000,
  recurrenceInterval: 'MONTHLY',
  isManual: true,
  lastUsedDate: '2025-01-15',
  nextDueDate: '2025-02-15',
  isDue: false,
  createdAt: '2025-01-01',
}

describe('EditRecurringExpenseModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders when expense is provided', () => {
    render(<EditRecurringExpenseModal expense={mockExpense} onClose={vi.fn()} />)
    
    expect(screen.getByText('Edit Recurring Expense')).toBeInTheDocument()
  })

  it('does not render when expense is null', () => {
    render(<EditRecurringExpenseModal expense={null} onClose={vi.fn()} />)
    
    expect(screen.queryByText('Edit Recurring Expense')).not.toBeInTheDocument()
  })

  it('pre-fills form with expense values', () => {
    render(<EditRecurringExpenseModal expense={mockExpense} onClose={vi.fn()} />)
    
    expect(screen.getByDisplayValue('Rent')).toBeInTheDocument()
    expect(screen.getByDisplayValue('8000')).toBeInTheDocument()
    expect(screen.getByText('Monthly')).toBeInTheDocument()
  })

  it('shows manual checkbox as checked when isManual is true', () => {
    render(<EditRecurringExpenseModal expense={mockExpense} onClose={vi.fn()} />)
    
    const checkbox = screen.getByRole('checkbox')
    expect(checkbox).toBeChecked()
  })

  it('shows last used and next due dates', () => {
    render(<EditRecurringExpenseModal expense={mockExpense} onClose={vi.fn()} />)
    
    expect(screen.getByText(/last used/i)).toBeInTheDocument()
    expect(screen.getByText(/next due/i)).toBeInTheDocument()
  })

  it('shows "Never" for last used when null', () => {
    const neverUsedExpense = { ...mockExpense, lastUsedDate: null, nextDueDate: null }
    render(<EditRecurringExpenseModal expense={neverUsedExpense} onClose={vi.fn()} />)
    
    expect(screen.getByText('Never')).toBeInTheDocument()
  })

  it('submits updated data', async () => {
    let requestBody: unknown
    server.use(
      http.put('/api/recurring-expenses/123', async ({ request }) => {
        requestBody = await request.json()
        return HttpResponse.json({ ...mockExpense, name: 'Updated' })
      })
    )

    const onClose = vi.fn()
    render(<EditRecurringExpenseModal expense={mockExpense} onClose={onClose} />)
    
    await userEvent.clear(screen.getByLabelText(/name/i))
    await userEvent.type(screen.getByLabelText(/name/i), 'Updated Rent')
    await userEvent.click(screen.getByRole('button', { name: /save/i }))
    
    await waitFor(() => {
      expect(onClose).toHaveBeenCalled()
    })
    
    expect(requestBody).toMatchObject({
      name: 'Updated Rent',
    })
  })

  it('calls onClose when cancel is clicked', async () => {
    const onClose = vi.fn()
    render(<EditRecurringExpenseModal expense={mockExpense} onClose={onClose} />)
    
    await userEvent.click(screen.getByRole('button', { name: /cancel/i }))
    
    expect(onClose).toHaveBeenCalled()
  })

  it('shows validation error when name is cleared', async () => {
    render(<EditRecurringExpenseModal expense={mockExpense} onClose={vi.fn()} />)
    
    await userEvent.clear(screen.getByLabelText(/name/i))
    await userEvent.click(screen.getByRole('button', { name: /save/i }))
    
    expect(await screen.findByText(/name is required/i)).toBeInTheDocument()
  })
})
```

### Definition of Done

- [ ] All tests pass
- [ ] Modal shows when expense provided
- [ ] Form pre-fills with current values
- [ ] Read-only info (last used, next due) displays
- [ ] Updates save correctly

---

## Story 3.5: Delete Recurring Expense Flow

**As a** user  
**I want to** delete a recurring expense template I no longer need  
**So that** it doesn't clutter my templates list

### Acceptance Criteria

- [ ] Confirmation dialog shows when delete clicked
- [ ] Dialog shows expense name
- [ ] Clarifies that existing budget expenses are not affected
- [ ] Successful delete: Close dialog, show toast, refresh list

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

- [ ] All tests pass
- [ ] Confirmation dialog shows expense name
- [ ] Message clarifies existing expenses unaffected
- [ ] Successful deletion removes template

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

1. Run all tests: `npm test`
2. Test manually in browser
3. Verify due status indicators display correctly
4. Verify sorting (due items first)
5. Proceed to Epic 4: Budget List

---

*Last updated: December 2024*
