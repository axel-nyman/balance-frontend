# Balance — Frontend Stories: Epic 6 (Budget Detail)

This document contains detailed, implementable stories for the Budget Detail epic. This epic covers viewing and editing existing budgets.

---

## Epic Overview

The Budget Detail feature allows users to:
- View a budget with all its items (income, expenses, savings)
- Add/edit/delete items in draft budgets
- Lock a draft budget (applies savings to accounts, creates todo list)
- Unlock a locked budget (reverts savings)
- Delete a budget entirely

**Key Design Decisions:**
- Collapsible sections for Income, Expenses, Savings (consistent with wizard review)
- Modal-based editing (no inline editing)
- Lock/unlock with confirmation dialogs
- Locked budgets are read-only

**Dependencies:** Epic 1 (Infrastructure) must be complete.

**API Endpoints Used:**
- `GET /api/budgets/:id` — Get budget detail
- `DELETE /api/budgets/:id` — Delete budget
- `POST /api/budgets/:id/lock` — Lock budget
- `POST /api/budgets/:id/unlock` — Unlock budget
- `POST /api/budgets/:id/income` — Add income item
- `PUT /api/budgets/:id/income/:itemId` — Update income item
- `DELETE /api/budgets/:id/income/:itemId` — Delete income item
- `POST /api/budgets/:id/expenses` — Add expense item
- `PUT /api/budgets/:id/expenses/:itemId` — Update expense item
- `DELETE /api/budgets/:id/expenses/:itemId` — Delete expense item
- `POST /api/budgets/:id/savings` — Add savings item
- `PUT /api/budgets/:id/savings/:itemId` — Update savings item
- `DELETE /api/budgets/:id/savings/:itemId` — Delete savings item

---

## Story 6.1: Budget Detail Page Shell

**As a** user  
**I want to** see a dedicated page for viewing a budget  
**So that** I can see all the details of a specific monthly budget

### Acceptance Criteria

- [ ] Page renders at `/budgets/:id` route
- [ ] Shows budget month/year as title
- [ ] Shows status badge (Draft/Locked)
- [ ] Shows loading state while fetching
- [ ] Shows error state if budget not found
- [ ] Action buttons in header (based on status)

### Implementation

**Update `src/pages/BudgetDetailPage.tsx`:**

```typescript
import { useParams, useNavigate } from 'react-router-dom'
import { Lock, Unlock, Trash2, ListTodo } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PageHeader, LoadingState, ErrorState } from '@/components/shared'
import { useBudgetDetail } from '@/hooks'
import { formatMonthYear } from '@/lib/utils'
import { BudgetStatus } from '@/api/types'

export function BudgetDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: budget, isLoading, isError, refetch } = useBudgetDetail(id!)

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Loading..." />
        <LoadingState variant="detail" />
      </div>
    )
  }

  if (isError || !budget) {
    return (
      <div>
        <PageHeader title="Budget Not Found" />
        <ErrorState
          title="Budget not found"
          message="This budget doesn't exist or has been deleted."
          onRetry={refetch}
        />
      </div>
    )
  }

  const isLocked = budget.status === BudgetStatus.LOCKED
  const title = formatMonthYear(budget.month, budget.year)

  return (
    <div>
      <PageHeader
        title={title}
        description={
          <Badge variant={isLocked ? 'default' : 'secondary'} className="mt-1">
            {isLocked ? (
              <>
                <Lock className="w-3 h-3 mr-1" />
                Locked
              </>
            ) : (
              'Draft'
            )}
          </Badge>
        }
        action={
          <div className="flex gap-2">
            {isLocked && (
              <Button
                variant="outline"
                onClick={() => navigate(`/budgets/${id}/todo`)}
              >
                <ListTodo className="w-4 h-4 mr-2" />
                Todo List
              </Button>
            )}
          </div>
        }
      />

      {/* Budget sections will go here */}
      <div className="space-y-6">
        {/* BudgetSummary */}
        {/* IncomeSection */}
        {/* ExpensesSection */}
        {/* SavingsSection */}
        {/* BudgetActions */}
      </div>
    </div>
  )
}
```

### Test File: `src/pages/BudgetDetailPage.test.tsx`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@/test/test-utils'
import { BudgetDetailPage } from './BudgetDetailPage'
import { server } from '@/test/mocks/server'
import { http, HttpResponse } from 'msw'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

// Mock useNavigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

const mockBudget = {
  id: '123',
  month: 3,
  year: 2025,
  status: 'DRAFT',
  incomeItems: [
    { id: 'i1', source: 'Salary', amount: 50000 }
  ],
  expenseItems: [
    { id: 'e1', name: 'Rent', amount: 8000 }
  ],
  savingsItems: [],
  totalIncome: 50000,
  totalExpenses: 8000,
  totalSavings: 0,
}

function renderWithRouter(budgetId = '123') {
  return render(
    <MemoryRouter initialEntries={[`/budgets/${budgetId}`]}>
      <Routes>
        <Route path="/budgets/:id" element={<BudgetDetailPage />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('BudgetDetailPage', () => {
  beforeEach(() => {
    mockNavigate.mockClear()
    server.use(
      http.get('/api/budgets/123', () => {
        return HttpResponse.json(mockBudget)
      })
    )
  })

  it('shows loading state initially', () => {
    renderWithRouter()
    
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('displays budget month and year as title', async () => {
    renderWithRouter()
    
    await waitFor(() => {
      expect(screen.getByText(/mars 2025/i)).toBeInTheDocument()
    })
  })

  it('shows Draft badge for draft budgets', async () => {
    renderWithRouter()
    
    await waitFor(() => {
      expect(screen.getByText('Draft')).toBeInTheDocument()
    })
  })

  it('shows Locked badge for locked budgets', async () => {
    server.use(
      http.get('/api/budgets/123', () => {
        return HttpResponse.json({ ...mockBudget, status: 'LOCKED' })
      })
    )

    renderWithRouter()
    
    await waitFor(() => {
      expect(screen.getByText('Locked')).toBeInTheDocument()
    })
  })

  it('shows Todo List button for locked budgets', async () => {
    server.use(
      http.get('/api/budgets/123', () => {
        return HttpResponse.json({ ...mockBudget, status: 'LOCKED' })
      })
    )

    renderWithRouter()
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /todo list/i })).toBeInTheDocument()
    })
  })

  it('shows error state for non-existent budget', async () => {
    server.use(
      http.get('/api/budgets/999', () => {
        return HttpResponse.json({ error: 'Not found' }, { status: 404 })
      })
    )

    renderWithRouter('999')
    
    await waitFor(() => {
      expect(screen.getByText(/not found/i)).toBeInTheDocument()
    })
  })
})
```

### Definition of Done

- [ ] Tests pass
- [ ] Page loads budget data
- [ ] Title shows month/year
- [ ] Status badge displays correctly
- [ ] Loading and error states work

---

## Story 6.2: Budget Summary Card

**As a** user  
**I want to** see a summary of my budget totals  
**So that** I can quickly understand my financial position

### Acceptance Criteria

- [ ] Shows total income, expenses, savings
- [ ] Shows calculated balance
- [ ] Color-coded (green positive, red negative)
- [ ] Compact card layout

### Implementation

**Create `src/components/budget-detail/BudgetSummary.tsx`:**

```typescript
import { Card, CardContent } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface BudgetSummaryProps {
  totalIncome: number
  totalExpenses: number
  totalSavings: number
}

export function BudgetSummary({ totalIncome, totalExpenses, totalSavings }: BudgetSummaryProps) {
  const balance = totalIncome - totalExpenses - totalSavings

  return (
    <Card>
      <CardContent className="p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Income</p>
            <p className="text-lg font-semibold text-green-600">
              {formatCurrency(totalIncome)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Expenses</p>
            <p className="text-lg font-semibold text-red-600">
              {formatCurrency(totalExpenses)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Savings</p>
            <p className="text-lg font-semibold text-blue-600">
              {formatCurrency(totalSavings)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Balance</p>
            <p className={cn(
              'text-lg font-semibold',
              balance >= 0 ? 'text-green-600' : 'text-red-600'
            )}>
              {formatCurrency(balance)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
```

### Test File: `src/components/budget-detail/BudgetSummary.test.tsx`

```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@/test/test-utils'
import { BudgetSummary } from './BudgetSummary'

describe('BudgetSummary', () => {
  it('displays all totals', () => {
    render(
      <BudgetSummary
        totalIncome={50000}
        totalExpenses={30000}
        totalSavings={10000}
      />
    )
    
    expect(screen.getByText(/50 000,00 kr/)).toBeInTheDocument()
    expect(screen.getByText(/30 000,00 kr/)).toBeInTheDocument()
    expect(screen.getByText(/10 000,00 kr/)).toBeInTheDocument()
  })

  it('calculates balance correctly', () => {
    render(
      <BudgetSummary
        totalIncome={50000}
        totalExpenses={30000}
        totalSavings={10000}
      />
    )
    
    // Balance = 50000 - 30000 - 10000 = 10000
    expect(screen.getAllByText(/10 000,00 kr/)).toHaveLength(2) // savings and balance
  })

  it('shows positive balance in green', () => {
    const { container } = render(
      <BudgetSummary
        totalIncome={50000}
        totalExpenses={30000}
        totalSavings={10000}
      />
    )
    
    const balanceElements = container.querySelectorAll('.text-green-600')
    expect(balanceElements.length).toBeGreaterThanOrEqual(2) // income and balance
  })

  it('shows negative balance in red', () => {
    const { container } = render(
      <BudgetSummary
        totalIncome={30000}
        totalExpenses={40000}
        totalSavings={0}
      />
    )
    
    // Balance = -10000, should be red
    const redElements = container.querySelectorAll('.text-red-600')
    expect(redElements.length).toBeGreaterThanOrEqual(2) // expenses and balance
  })
})
```

### Definition of Done

- [ ] Tests pass
- [ ] Shows all four values
- [ ] Balance calculated correctly
- [ ] Colors applied correctly

---

## Story 6.3: Collapsible Budget Sections

**As a** user  
**I want to** see income, expenses, and savings in collapsible sections  
**So that** I can focus on one category at a time

### Acceptance Criteria

- [ ] Three collapsible sections: Income, Expenses, Savings
- [ ] Each shows item count and total in header
- [ ] Expanded by default
- [ ] Lists all items when expanded
- [ ] "Add" button in each section header (draft only)
- [ ] Edit/Delete buttons per item (draft only)

### Implementation

**Create `src/components/budget-detail/BudgetSection.tsx`:**

```typescript
import { useState } from 'react'
import { ChevronDown, ChevronRight, Plus, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface BudgetSectionItem {
  id: string
  label: string
  amount: number
  sublabel?: string
}

interface BudgetSectionProps {
  title: string
  items: BudgetSectionItem[]
  total: number
  totalColor: 'green' | 'red' | 'blue'
  isEditable: boolean
  onAdd?: () => void
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
  emptyMessage?: string
}

export function BudgetSection({
  title,
  items,
  total,
  totalColor,
  isEditable,
  onAdd,
  onEdit,
  onDelete,
  emptyMessage = 'No items',
}: BudgetSectionProps) {
  const [isOpen, setIsOpen] = useState(true)

  const colorClasses = {
    green: 'text-green-600',
    red: 'text-red-600',
    blue: 'text-blue-600',
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="border rounded-lg">
      <CollapsibleTrigger asChild>
        <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50">
          <div className="flex items-center gap-2">
            {isOpen ? (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-500" />
            )}
            <span className="font-medium text-gray-900">{title}</span>
            <span className="text-sm text-gray-500">({items.length})</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={cn('font-semibold', colorClasses[totalColor])}>
              {formatCurrency(total)}
            </span>
            {isEditable && onAdd && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onAdd()
                }}
                aria-label={`Add ${title.toLowerCase()}`}
              >
                <Plus className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="border-t">
          {items.length === 0 ? (
            <p className="p-4 text-center text-gray-500">{emptyMessage}</p>
          ) : (
            <ul className="divide-y">
              {items.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between px-4 py-3 hover:bg-gray-50"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{item.label}</p>
                    {item.sublabel && (
                      <p className="text-sm text-gray-500 truncate">{item.sublabel}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <span className="font-medium text-gray-900">
                      {formatCurrency(item.amount)}
                    </span>
                    {isEditable && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit?.(item.id)}
                          aria-label={`Edit ${item.label}`}
                        >
                          <Pencil className="w-4 h-4 text-gray-400" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDelete?.(item.id)}
                          aria-label={`Delete ${item.label}`}
                        >
                          <Trash2 className="w-4 h-4 text-gray-400" />
                        </Button>
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
```

### Test File: `src/components/budget-detail/BudgetSection.test.tsx`

```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import { BudgetSection } from './BudgetSection'

const mockItems = [
  { id: '1', label: 'Salary', amount: 50000 },
  { id: '2', label: 'Bonus', amount: 5000, sublabel: 'Q1 bonus' },
]

describe('BudgetSection', () => {
  it('renders section title', () => {
    render(
      <BudgetSection
        title="Income"
        items={mockItems}
        total={55000}
        totalColor="green"
        isEditable={false}
      />
    )
    
    expect(screen.getByText('Income')).toBeInTheDocument()
  })

  it('shows item count', () => {
    render(
      <BudgetSection
        title="Income"
        items={mockItems}
        total={55000}
        totalColor="green"
        isEditable={false}
      />
    )
    
    expect(screen.getByText('(2)')).toBeInTheDocument()
  })

  it('shows total with correct color', () => {
    const { container } = render(
      <BudgetSection
        title="Income"
        items={mockItems}
        total={55000}
        totalColor="green"
        isEditable={false}
      />
    )
    
    expect(screen.getByText(/55 000,00 kr/)).toBeInTheDocument()
    expect(container.querySelector('.text-green-600')).toBeInTheDocument()
  })

  it('renders all items', () => {
    render(
      <BudgetSection
        title="Income"
        items={mockItems}
        total={55000}
        totalColor="green"
        isEditable={false}
      />
    )
    
    expect(screen.getByText('Salary')).toBeInTheDocument()
    expect(screen.getByText('Bonus')).toBeInTheDocument()
  })

  it('shows sublabel when provided', () => {
    render(
      <BudgetSection
        title="Income"
        items={mockItems}
        total={55000}
        totalColor="green"
        isEditable={false}
      />
    )
    
    expect(screen.getByText('Q1 bonus')).toBeInTheDocument()
  })

  it('shows empty message when no items', () => {
    render(
      <BudgetSection
        title="Savings"
        items={[]}
        total={0}
        totalColor="blue"
        isEditable={false}
        emptyMessage="No savings planned"
      />
    )
    
    expect(screen.getByText('No savings planned')).toBeInTheDocument()
  })

  it('shows Add button when editable', () => {
    render(
      <BudgetSection
        title="Income"
        items={mockItems}
        total={55000}
        totalColor="green"
        isEditable={true}
        onAdd={vi.fn()}
      />
    )
    
    expect(screen.getByRole('button', { name: /add income/i })).toBeInTheDocument()
  })

  it('hides Add button when not editable', () => {
    render(
      <BudgetSection
        title="Income"
        items={mockItems}
        total={55000}
        totalColor="green"
        isEditable={false}
        onAdd={vi.fn()}
      />
    )
    
    expect(screen.queryByRole('button', { name: /add income/i })).not.toBeInTheDocument()
  })

  it('shows Edit/Delete buttons when editable', () => {
    render(
      <BudgetSection
        title="Income"
        items={mockItems}
        total={55000}
        totalColor="green"
        isEditable={true}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    )
    
    expect(screen.getAllByRole('button', { name: /edit/i })).toHaveLength(2)
    expect(screen.getAllByRole('button', { name: /delete/i })).toHaveLength(2)
  })

  it('calls onAdd when Add clicked', async () => {
    const onAdd = vi.fn()
    render(
      <BudgetSection
        title="Income"
        items={mockItems}
        total={55000}
        totalColor="green"
        isEditable={true}
        onAdd={onAdd}
      />
    )
    
    await userEvent.click(screen.getByRole('button', { name: /add income/i }))
    
    expect(onAdd).toHaveBeenCalled()
  })

  it('calls onEdit with item id when Edit clicked', async () => {
    const onEdit = vi.fn()
    render(
      <BudgetSection
        title="Income"
        items={mockItems}
        total={55000}
        totalColor="green"
        isEditable={true}
        onEdit={onEdit}
      />
    )
    
    const editButtons = screen.getAllByRole('button', { name: /edit/i })
    await userEvent.click(editButtons[0])
    
    expect(onEdit).toHaveBeenCalledWith('1')
  })

  it('calls onDelete with item id when Delete clicked', async () => {
    const onDelete = vi.fn()
    render(
      <BudgetSection
        title="Income"
        items={mockItems}
        total={55000}
        totalColor="green"
        isEditable={true}
        onDelete={onDelete}
      />
    )
    
    const deleteButtons = screen.getAllByRole('button', { name: /delete/i })
    await userEvent.click(deleteButtons[0])
    
    expect(onDelete).toHaveBeenCalledWith('1')
  })

  it('can collapse and expand', async () => {
    render(
      <BudgetSection
        title="Income"
        items={mockItems}
        total={55000}
        totalColor="green"
        isEditable={false}
      />
    )
    
    // Initially expanded
    expect(screen.getByText('Salary')).toBeVisible()
    
    // Click to collapse
    await userEvent.click(screen.getByText('Income'))
    
    // Items should be hidden
    expect(screen.queryByText('Salary')).not.toBeVisible()
  })
})
```

### Definition of Done

- [ ] Tests pass
- [ ] Sections render with items
- [ ] Collapse/expand works
- [ ] Add/Edit/Delete buttons show only when editable
- [ ] Callbacks fire correctly

---

## Story 6.4: Add/Edit Income Modal

**As a** user  
**I want to** add or edit income items in my budget  
**So that** I can keep my budget up to date

### Acceptance Criteria

- [ ] Modal for adding new income
- [ ] Modal for editing existing income (pre-filled)
- [ ] Fields: Source (required), Amount (required, positive)
- [ ] Save button creates/updates via API
- [ ] Success: Close modal, refresh budget
- [ ] Error: Show inline error

### Implementation

**Create `src/components/budget-detail/schemas.ts`:**

```typescript
import { z } from 'zod'

export const incomeItemSchema = z.object({
  source: z.string().min(1, 'Source is required'),
  amount: z
    .number({ invalid_type_error: 'Must be a number' })
    .positive('Amount must be greater than 0'),
})

export const expenseItemSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  amount: z
    .number({ invalid_type_error: 'Must be a number' })
    .positive('Amount must be greater than 0'),
})

export const savingsItemSchema = z.object({
  targetAccountId: z.string().min(1, 'Account is required'),
  amount: z
    .number({ invalid_type_error: 'Must be a number' })
    .positive('Amount must be greater than 0'),
})

export type IncomeItemFormData = z.infer<typeof incomeItemSchema>
export type ExpenseItemFormData = z.infer<typeof expenseItemSchema>
export type SavingsItemFormData = z.infer<typeof savingsItemSchema>
```

**Create `src/components/budget-detail/IncomeItemModal.tsx`:**

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
import { useAddBudgetIncome, useUpdateBudgetIncome } from '@/hooks'
import { incomeItemSchema, type IncomeItemFormData } from './schemas'
import type { BudgetIncomeItem } from '@/api/types'

interface IncomeItemModalProps {
  budgetId: string
  item: BudgetIncomeItem | null // null = create mode
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function IncomeItemModal({ budgetId, item, open, onOpenChange }: IncomeItemModalProps) {
  const addIncome = useAddBudgetIncome()
  const updateIncome = useUpdateBudgetIncome()
  const isEditing = item !== null

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<IncomeItemFormData>({
    resolver: zodResolver(incomeItemSchema),
    defaultValues: {
      source: '',
      amount: undefined,
    },
  })

  // Reset form when item changes
  useEffect(() => {
    if (item) {
      reset({
        source: item.source,
        amount: item.amount,
      })
    } else {
      reset({
        source: '',
        amount: undefined,
      })
    }
  }, [item, reset])

  const onSubmit = async (data: IncomeItemFormData) => {
    try {
      if (isEditing && item) {
        await updateIncome.mutateAsync({
          budgetId,
          itemId: item.id,
          data,
        })
        toast.success('Income updated')
      } else {
        await addIncome.mutateAsync({
          budgetId,
          data,
        })
        toast.success('Income added')
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

  const mutation = isEditing ? updateIncome : addIncome

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Income' : 'Add Income'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="source">Source *</Label>
            <Input
              id="source"
              {...register('source')}
              placeholder="e.g., Salary, Freelance"
              autoFocus
            />
            {errors.source && (
              <p className="text-sm text-red-600">{errors.source.message}</p>
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

### Test File: `src/components/budget-detail/IncomeItemModal.test.tsx`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import { IncomeItemModal } from './IncomeItemModal'
import { server } from '@/test/mocks/server'
import { http, HttpResponse } from 'msw'

describe('IncomeItemModal', () => {
  const defaultProps = {
    budgetId: 'budget-123',
    item: null,
    open: true,
    onOpenChange: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders Add Income title when creating', () => {
    render(<IncomeItemModal {...defaultProps} />)
    
    expect(screen.getByText('Add Income')).toBeInTheDocument()
  })

  it('renders Edit Income title when editing', () => {
    render(
      <IncomeItemModal
        {...defaultProps}
        item={{ id: '1', source: 'Salary', amount: 50000 }}
      />
    )
    
    expect(screen.getByText('Edit Income')).toBeInTheDocument()
  })

  it('pre-fills form when editing', () => {
    render(
      <IncomeItemModal
        {...defaultProps}
        item={{ id: '1', source: 'Salary', amount: 50000 }}
      />
    )
    
    expect(screen.getByDisplayValue('Salary')).toBeInTheDocument()
    expect(screen.getByDisplayValue('50000')).toBeInTheDocument()
  })

  it('shows validation error for empty source', async () => {
    render(<IncomeItemModal {...defaultProps} />)
    
    await userEvent.click(screen.getByRole('button', { name: /save/i }))
    
    expect(await screen.findByText(/source is required/i)).toBeInTheDocument()
  })

  it('shows validation error for invalid amount', async () => {
    render(<IncomeItemModal {...defaultProps} />)
    
    await userEvent.type(screen.getByLabelText(/source/i), 'Test')
    await userEvent.type(screen.getByLabelText(/amount/i), '-100')
    await userEvent.click(screen.getByRole('button', { name: /save/i }))
    
    expect(await screen.findByText(/must be greater than 0/i)).toBeInTheDocument()
  })

  it('calls API to create income', async () => {
    let requestBody: unknown
    server.use(
      http.post('/api/budgets/budget-123/income', async ({ request }) => {
        requestBody = await request.json()
        return HttpResponse.json({ id: 'new-1' }, { status: 201 })
      })
    )

    const onOpenChange = vi.fn()
    render(<IncomeItemModal {...defaultProps} onOpenChange={onOpenChange} />)
    
    await userEvent.type(screen.getByLabelText(/source/i), 'Salary')
    await userEvent.type(screen.getByLabelText(/amount/i), '50000')
    await userEvent.click(screen.getByRole('button', { name: /save/i }))
    
    await waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledWith(false)
    })
    
    expect(requestBody).toEqual({
      source: 'Salary',
      amount: 50000,
    })
  })

  it('calls API to update income', async () => {
    let requestBody: unknown
    server.use(
      http.put('/api/budgets/budget-123/income/1', async ({ request }) => {
        requestBody = await request.json()
        return HttpResponse.json({ id: '1' })
      })
    )

    const onOpenChange = vi.fn()
    render(
      <IncomeItemModal
        {...defaultProps}
        item={{ id: '1', source: 'Salary', amount: 50000 }}
        onOpenChange={onOpenChange}
      />
    )
    
    await userEvent.clear(screen.getByLabelText(/amount/i))
    await userEvent.type(screen.getByLabelText(/amount/i), '55000')
    await userEvent.click(screen.getByRole('button', { name: /save/i }))
    
    await waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledWith(false)
    })
    
    expect(requestBody).toEqual({
      source: 'Salary',
      amount: 55000,
    })
  })

  it('closes on cancel', async () => {
    const onOpenChange = vi.fn()
    render(<IncomeItemModal {...defaultProps} onOpenChange={onOpenChange} />)
    
    await userEvent.click(screen.getByRole('button', { name: /cancel/i }))
    
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })
})
```

### Definition of Done

- [ ] Tests pass
- [ ] Create mode works
- [ ] Edit mode pre-fills and updates
- [ ] Validation works
- [ ] API calls succeed

---

## Story 6.5: Add/Edit Expense Modal

**As a** user  
**I want to** add or edit expense items in my budget  
**So that** I can track my spending

### Implementation

**Create `src/components/budget-detail/ExpenseItemModal.tsx`:**

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
import { useAddBudgetExpense, useUpdateBudgetExpense } from '@/hooks'
import { expenseItemSchema, type ExpenseItemFormData } from './schemas'
import type { BudgetExpenseItem } from '@/api/types'

interface ExpenseItemModalProps {
  budgetId: string
  item: BudgetExpenseItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ExpenseItemModal({ budgetId, item, open, onOpenChange }: ExpenseItemModalProps) {
  const addExpense = useAddBudgetExpense()
  const updateExpense = useUpdateBudgetExpense()
  const isEditing = item !== null

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ExpenseItemFormData>({
    resolver: zodResolver(expenseItemSchema),
    defaultValues: {
      name: '',
      amount: undefined,
    },
  })

  useEffect(() => {
    if (item) {
      reset({
        name: item.name,
        amount: item.amount,
      })
    } else {
      reset({
        name: '',
        amount: undefined,
      })
    }
  }, [item, reset])

  const onSubmit = async (data: ExpenseItemFormData) => {
    try {
      if (isEditing && item) {
        await updateExpense.mutateAsync({
          budgetId,
          itemId: item.id,
          data,
        })
        toast.success('Expense updated')
      } else {
        await addExpense.mutateAsync({
          budgetId,
          data,
        })
        toast.success('Expense added')
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

  const mutation = isEditing ? updateExpense : addExpense

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Expense' : 'Add Expense'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              {...register('name')}
              placeholder="e.g., Rent, Groceries"
              autoFocus
            />
            {errors.name && (
              <p className="text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="expense-amount">Amount *</Label>
            <Input
              id="expense-amount"
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

### Test File: `src/components/budget-detail/ExpenseItemModal.test.tsx`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import { ExpenseItemModal } from './ExpenseItemModal'
import { server } from '@/test/mocks/server'
import { http, HttpResponse } from 'msw'

describe('ExpenseItemModal', () => {
  const defaultProps = {
    budgetId: 'budget-123',
    item: null,
    open: true,
    onOpenChange: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders Add Expense title when creating', () => {
    render(<ExpenseItemModal {...defaultProps} />)
    
    expect(screen.getByText('Add Expense')).toBeInTheDocument()
  })

  it('renders Edit Expense title when editing', () => {
    render(
      <ExpenseItemModal
        {...defaultProps}
        item={{ id: '1', name: 'Rent', amount: 8000 }}
      />
    )
    
    expect(screen.getByText('Edit Expense')).toBeInTheDocument()
  })

  it('pre-fills form when editing', () => {
    render(
      <ExpenseItemModal
        {...defaultProps}
        item={{ id: '1', name: 'Rent', amount: 8000 }}
      />
    )
    
    expect(screen.getByDisplayValue('Rent')).toBeInTheDocument()
    expect(screen.getByDisplayValue('8000')).toBeInTheDocument()
  })

  it('calls API to create expense', async () => {
    let requestBody: unknown
    server.use(
      http.post('/api/budgets/budget-123/expenses', async ({ request }) => {
        requestBody = await request.json()
        return HttpResponse.json({ id: 'new-1' }, { status: 201 })
      })
    )

    const onOpenChange = vi.fn()
    render(<ExpenseItemModal {...defaultProps} onOpenChange={onOpenChange} />)
    
    await userEvent.type(screen.getByLabelText(/name/i), 'Groceries')
    await userEvent.type(screen.getByLabelText(/amount/i), '5000')
    await userEvent.click(screen.getByRole('button', { name: /save/i }))
    
    await waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledWith(false)
    })
    
    expect(requestBody).toEqual({
      name: 'Groceries',
      amount: 5000,
    })
  })

  it('calls API to update expense', async () => {
    let requestBody: unknown
    server.use(
      http.put('/api/budgets/budget-123/expenses/1', async ({ request }) => {
        requestBody = await request.json()
        return HttpResponse.json({ id: '1' })
      })
    )

    const onOpenChange = vi.fn()
    render(
      <ExpenseItemModal
        {...defaultProps}
        item={{ id: '1', name: 'Rent', amount: 8000 }}
        onOpenChange={onOpenChange}
      />
    )
    
    await userEvent.clear(screen.getByLabelText(/amount/i))
    await userEvent.type(screen.getByLabelText(/amount/i), '8500')
    await userEvent.click(screen.getByRole('button', { name: /save/i }))
    
    await waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledWith(false)
    })
    
    expect(requestBody).toEqual({
      name: 'Rent',
      amount: 8500,
    })
  })
})
```

### Definition of Done

- [ ] Tests pass
- [ ] Create and edit modes work
- [ ] API calls succeed

---

## Story 6.6: Add/Edit Savings Modal

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

- [ ] Tests pass
- [ ] Account dropdown shows available accounts
- [ ] Already-used accounts are filtered
- [ ] Create and edit modes work

---

## Story 6.7: Delete Item Dialogs

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

## Story 6.8: Lock/Unlock Budget

**As a** user  
**I want to** lock my budget when finalized or unlock to make changes  
**So that** I can control the budget lifecycle

### Acceptance Criteria

- [ ] "Lock Budget" button shown for draft budgets
- [ ] Confirmation dialog explains what locking does
- [ ] Lock applies savings to account balances
- [ ] Lock creates todo list for manual payments
- [ ] "Unlock Budget" button shown for locked budgets
- [ ] Unlock reverts savings from account balances
- [ ] Success refreshes the page

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
      http.post('/api/budgets/123/lock', () => {
        return HttpResponse.json({ status: 'LOCKED' })
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
      http.post('/api/budgets/123/unlock', () => {
        return HttpResponse.json({ status: 'DRAFT' })
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

- [ ] Tests pass
- [ ] Lock/Unlock buttons show based on status
- [ ] Confirmation dialogs explain consequences
- [ ] API calls succeed
- [ ] Delete navigates back to list

---

## Story 6.9: Complete Budget Detail Page

**As a** user  
**I want to** see the fully integrated budget detail page  
**So that** I can manage my budget effectively

### Implementation

**Update `src/pages/BudgetDetailPage.tsx`:**

```typescript
import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Lock, ListTodo } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PageHeader, LoadingState, ErrorState } from '@/components/shared'
import {
  BudgetSummary,
  BudgetSection,
  BudgetActions,
  IncomeItemModal,
  ExpenseItemModal,
  SavingsItemModal,
  DeleteItemDialog,
} from '@/components/budget-detail'
import { useBudgetDetail } from '@/hooks'
import { formatMonthYear } from '@/lib/utils'
import { BudgetStatus } from '@/api/types'
import type { BudgetIncomeItem, BudgetExpenseItem, BudgetSavingsItem } from '@/api/types'

type DeleteTarget = {
  id: string
  name: string
  type: 'income' | 'expense' | 'savings'
} | null

export function BudgetDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: budget, isLoading, isError, refetch } = useBudgetDetail(id!)

  // Modal state
  const [incomeModalOpen, setIncomeModalOpen] = useState(false)
  const [expenseModalOpen, setExpenseModalOpen] = useState(false)
  const [savingsModalOpen, setSavingsModalOpen] = useState(false)
  
  // Edit item state
  const [editingIncome, setEditingIncome] = useState<BudgetIncomeItem | null>(null)
  const [editingExpense, setEditingExpense] = useState<BudgetExpenseItem | null>(null)
  const [editingSavings, setEditingSavings] = useState<BudgetSavingsItem | null>(null)
  
  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null)

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Loading..." />
        <LoadingState variant="detail" />
      </div>
    )
  }

  if (isError || !budget) {
    return (
      <div>
        <PageHeader title="Budget Not Found" />
        <ErrorState
          title="Budget not found"
          message="This budget doesn't exist or has been deleted."
          onRetry={refetch}
        />
      </div>
    )
  }

  const isLocked = budget.status === BudgetStatus.LOCKED
  const isEditable = !isLocked
  const title = formatMonthYear(budget.month, budget.year)

  // Transform items for BudgetSection
  const incomeItems = budget.incomeItems.map((item) => ({
    id: item.id,
    label: item.source,
    amount: item.amount,
  }))

  const expenseItems = budget.expenseItems.map((item) => ({
    id: item.id,
    label: item.name,
    amount: item.amount,
    sublabel: item.recurringExpenseId ? 'From recurring' : undefined,
  }))

  const savingsItems = budget.savingsItems.map((item) => ({
    id: item.id,
    label: item.targetAccountName,
    amount: item.amount,
  }))

  // Calculate totals
  const totalIncome = budget.incomeItems.reduce((sum, item) => sum + item.amount, 0)
  const totalExpenses = budget.expenseItems.reduce((sum, item) => sum + item.amount, 0)
  const totalSavings = budget.savingsItems.reduce((sum, item) => sum + item.amount, 0)

  // Get existing account IDs for savings modal
  const existingSavingsAccountIds = budget.savingsItems
    .filter((item) => item.id !== editingSavings?.id)
    .map((item) => item.targetAccountId)

  // Handlers for income
  const handleAddIncome = () => {
    setEditingIncome(null)
    setIncomeModalOpen(true)
  }

  const handleEditIncome = (itemId: string) => {
    const item = budget.incomeItems.find((i) => i.id === itemId)
    if (item) {
      setEditingIncome(item)
      setIncomeModalOpen(true)
    }
  }

  const handleDeleteIncome = (itemId: string) => {
    const item = budget.incomeItems.find((i) => i.id === itemId)
    if (item) {
      setDeleteTarget({ id: itemId, name: item.source, type: 'income' })
    }
  }

  // Handlers for expenses
  const handleAddExpense = () => {
    setEditingExpense(null)
    setExpenseModalOpen(true)
  }

  const handleEditExpense = (itemId: string) => {
    const item = budget.expenseItems.find((i) => i.id === itemId)
    if (item) {
      setEditingExpense(item)
      setExpenseModalOpen(true)
    }
  }

  const handleDeleteExpense = (itemId: string) => {
    const item = budget.expenseItems.find((i) => i.id === itemId)
    if (item) {
      setDeleteTarget({ id: itemId, name: item.name, type: 'expense' })
    }
  }

  // Handlers for savings
  const handleAddSavings = () => {
    setEditingSavings(null)
    setSavingsModalOpen(true)
  }

  const handleEditSavings = (itemId: string) => {
    const item = budget.savingsItems.find((i) => i.id === itemId)
    if (item) {
      setEditingSavings(item)
      setSavingsModalOpen(true)
    }
  }

  const handleDeleteSavings = (itemId: string) => {
    const item = budget.savingsItems.find((i) => i.id === itemId)
    if (item) {
      setDeleteTarget({ id: itemId, name: item.targetAccountName, type: 'savings' })
    }
  }

  return (
    <div>
      <PageHeader
        title={title}
        description={
          <Badge variant={isLocked ? 'default' : 'secondary'} className="mt-1">
            {isLocked ? (
              <>
                <Lock className="w-3 h-3 mr-1" />
                Locked
              </>
            ) : (
              'Draft'
            )}
          </Badge>
        }
        action={
          isLocked && (
            <Button
              variant="outline"
              onClick={() => navigate(`/budgets/${id}/todo`)}
            >
              <ListTodo className="w-4 h-4 mr-2" />
              Todo List
            </Button>
          )
        }
      />

      <div className="space-y-6">
        <BudgetSummary
          totalIncome={totalIncome}
          totalExpenses={totalExpenses}
          totalSavings={totalSavings}
        />

        <BudgetSection
          title="Income"
          items={incomeItems}
          total={totalIncome}
          totalColor="green"
          isEditable={isEditable}
          onAdd={handleAddIncome}
          onEdit={handleEditIncome}
          onDelete={handleDeleteIncome}
          emptyMessage="No income items"
        />

        <BudgetSection
          title="Expenses"
          items={expenseItems}
          total={totalExpenses}
          totalColor="red"
          isEditable={isEditable}
          onAdd={handleAddExpense}
          onEdit={handleEditExpense}
          onDelete={handleDeleteExpense}
          emptyMessage="No expense items"
        />

        <BudgetSection
          title="Savings"
          items={savingsItems}
          total={totalSavings}
          totalColor="blue"
          isEditable={isEditable}
          onAdd={handleAddSavings}
          onEdit={handleEditSavings}
          onDelete={handleDeleteSavings}
          emptyMessage="No savings planned"
        />

        <BudgetActions budgetId={id!} status={budget.status} />
      </div>

      {/* Income Modal */}
      <IncomeItemModal
        budgetId={id!}
        item={editingIncome}
        open={incomeModalOpen}
        onOpenChange={(open) => {
          setIncomeModalOpen(open)
          if (!open) setEditingIncome(null)
        }}
      />

      {/* Expense Modal */}
      <ExpenseItemModal
        budgetId={id!}
        item={editingExpense}
        open={expenseModalOpen}
        onOpenChange={(open) => {
          setExpenseModalOpen(open)
          if (!open) setEditingExpense(null)
        }}
      />

      {/* Savings Modal */}
      <SavingsItemModal
        budgetId={id!}
        item={editingSavings}
        existingAccountIds={existingSavingsAccountIds}
        open={savingsModalOpen}
        onOpenChange={(open) => {
          setSavingsModalOpen(open)
          if (!open) setEditingSavings(null)
        }}
      />

      {/* Delete Dialog */}
      {deleteTarget && (
        <DeleteItemDialog
          budgetId={id!}
          itemId={deleteTarget.id}
          itemName={deleteTarget.name}
          itemType={deleteTarget.type}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}
```

**Create barrel export `src/components/budget-detail/index.ts`:**

```typescript
export { BudgetSummary } from './BudgetSummary'
export { BudgetSection } from './BudgetSection'
export { BudgetActions } from './BudgetActions'
export { IncomeItemModal } from './IncomeItemModal'
export { ExpenseItemModal } from './ExpenseItemModal'
export { SavingsItemModal } from './SavingsItemModal'
export { DeleteItemDialog } from './DeleteItemDialog'
export * from './schemas'
```

### Definition of Done

- [ ] All tests pass
- [ ] Page loads and displays budget
- [ ] All sections render with items
- [ ] Add/Edit/Delete modals work
- [ ] Lock/Unlock actions work
- [ ] Delete budget works

---

## Epic 6 Complete File Structure

```
src/
├── components/
│   └── budget-detail/
│       ├── BudgetActions.tsx
│       ├── BudgetSection.tsx
│       ├── BudgetSummary.tsx
│       ├── DeleteItemDialog.tsx
│       ├── ExpenseItemModal.tsx
│       ├── IncomeItemModal.tsx
│       ├── index.ts
│       ├── SavingsItemModal.tsx
│       └── schemas.ts
└── pages/
    └── BudgetDetailPage.tsx
```

---

## Test Summary

| Component | Test File | Tests (approx) |
|-----------|-----------|----------------|
| BudgetDetailPage | BudgetDetailPage.test.tsx | 6 |
| BudgetSummary | BudgetSummary.test.tsx | 4 |
| BudgetSection | BudgetSection.test.tsx | 14 |
| IncomeItemModal | IncomeItemModal.test.tsx | 8 |
| ExpenseItemModal | ExpenseItemModal.test.tsx | 5 |
| SavingsItemModal | SavingsItemModal.test.tsx | 6 |
| DeleteItemDialog | DeleteItemDialog.test.tsx | 6 |
| BudgetActions | BudgetActions.test.tsx | 9 |

**Total: ~58 tests for Epic 6**

---

## MSW Handlers Update

Add these handlers to `src/test/mocks/handlers.ts`:

```typescript
// Lock budget
http.post('/api/budgets/:id/lock', () => {
  return HttpResponse.json({ status: 'LOCKED' })
}),

// Unlock budget
http.post('/api/budgets/:id/unlock', () => {
  return HttpResponse.json({ status: 'DRAFT' })
}),

// Delete budget
http.delete('/api/budgets/:id', () => {
  return new HttpResponse(null, { status: 204 })
}),

// Income CRUD
http.post('/api/budgets/:id/income', async ({ request }) => {
  const body = await request.json()
  return HttpResponse.json({ id: crypto.randomUUID(), ...body }, { status: 201 })
}),

http.put('/api/budgets/:budgetId/income/:itemId', async ({ request }) => {
  const body = await request.json()
  return HttpResponse.json(body)
}),

http.delete('/api/budgets/:budgetId/income/:itemId', () => {
  return new HttpResponse(null, { status: 204 })
}),

// Expense CRUD
http.post('/api/budgets/:id/expenses', async ({ request }) => {
  const body = await request.json()
  return HttpResponse.json({ id: crypto.randomUUID(), ...body }, { status: 201 })
}),

http.put('/api/budgets/:budgetId/expenses/:itemId', async ({ request }) => {
  const body = await request.json()
  return HttpResponse.json(body)
}),

http.delete('/api/budgets/:budgetId/expenses/:itemId', () => {
  return new HttpResponse(null, { status: 204 })
}),

// Savings CRUD
http.post('/api/budgets/:id/savings', async ({ request }) => {
  const body = await request.json()
  return HttpResponse.json({ id: crypto.randomUUID(), ...body }, { status: 201 })
}),

http.put('/api/budgets/:budgetId/savings/:itemId', async ({ request }) => {
  const body = await request.json()
  return HttpResponse.json(body)
}),

http.delete('/api/budgets/:budgetId/savings/:itemId', () => {
  return new HttpResponse(null, { status: 204 })
}),
```

---

## Next Steps

After completing Epic 6:

1. Run all tests: `npm test`
2. Test manually in browser
3. Verify lock/unlock behavior
4. Verify item CRUD operations
5. Proceed to Epic 7: Todo List

---

## Progress Summary

| Epic | Stories | Tests |
|------|---------|-------|
| Epic 1: Infrastructure | 6 | ~50 |
| Epic 2: Accounts | 7 | ~46 |
| Epic 3: Recurring Expenses | 5 | ~42 |
| Epic 4: Budget List | 3 | ~24 |
| Epic 5: Budget Wizard | 7 | ~83 |
| **Epic 6: Budget Detail** | **9** | **~58** |
| **Total** | **37** | **~303** |

---

*Last updated: December 2024*
