# Balance — Frontend Stories: Epic 4 (Budget List)

This document contains detailed, implementable stories for the Budget List epic. This is a simpler epic that displays existing budgets and provides entry points to create new budgets or view existing ones.

---

## Epic Overview

The Budget List feature allows users to:
- View all budgets in a card grid
- See budget status (Draft vs Locked)
- See budget totals (income, expenses, savings)
- Navigate to create a new budget
- Navigate to view/edit an existing budget

**Dependencies:** Epic 1 (Infrastructure) must be complete.

**API Endpoints Used:**
- `GET /api/budgets`

---

## Story 4.1: Budgets Page Shell

**As a** user  
**I want to** see a dedicated page for my budgets  
**So that** I have a clear place to manage my monthly budgets

### Acceptance Criteria

- [ ] Page renders at `/budgets` route
- [ ] Page header shows "Budgets" title
- [ ] "New Budget" button visible in header
- [ ] Clicking "New Budget" navigates to `/budgets/new`
- [ ] Main content area ready for budget grid

### Implementation

**Update `src/pages/BudgetsPage.tsx`:**

```typescript
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/shared'

export function BudgetsPage() {
  const navigate = useNavigate()

  return (
    <div>
      <PageHeader
        title="Budgets"
        description="Manage your monthly budgets"
        action={
          <Button onClick={() => navigate('/budgets/new')}>
            <Plus className="w-4 h-4 mr-2" />
            New Budget
          </Button>
        }
      />

      {/* Budget Grid - to be implemented in 4.2 */}
      <div>
        {/* BudgetGrid component will go here */}
      </div>
    </div>
  )
}
```

### Test File: `src/pages/BudgetsPage.test.tsx`

```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import { BudgetsPage } from './BudgetsPage'

// Mock useNavigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

describe('BudgetsPage', () => {
  beforeEach(() => {
    mockNavigate.mockClear()
  })

  it('renders page header with title', () => {
    render(<BudgetsPage />)
    
    expect(screen.getByRole('heading', { name: /budgets/i })).toBeInTheDocument()
  })

  it('renders new budget button', () => {
    render(<BudgetsPage />)
    
    expect(screen.getByRole('button', { name: /new budget/i })).toBeInTheDocument()
  })

  it('navigates to wizard when new budget button is clicked', async () => {
    render(<BudgetsPage />)
    
    await userEvent.click(screen.getByRole('button', { name: /new budget/i }))
    
    expect(mockNavigate).toHaveBeenCalledWith('/budgets/new')
  })
})
```

### Definition of Done

- [ ] Tests pass
- [ ] Page renders at `/budgets`
- [ ] Header and button visible
- [ ] Navigation to wizard works

---

## Story 4.2: Budget Grid

**As a** user  
**I want to** see all my budgets in a visual grid  
**So that** I can quickly browse and select a budget to view

### Acceptance Criteria

- [ ] Displays budgets in a responsive card grid
- [ ] Grid: 1 column on mobile, 2 on tablet, 3 on desktop
- [ ] Cards sorted by date descending (newest first)
- [ ] Shows loading state while fetching
- [ ] Shows empty state when no budgets exist
- [ ] Shows error state with retry on failure
- [ ] Clicking a card navigates to budget detail

### Components to Create

1. `BudgetGrid` — Grid container with loading/empty/error states
2. `BudgetCard` — Individual budget card

### Implementation

**Create `src/components/budgets/BudgetCard.tsx`:**

```typescript
import { useNavigate } from 'react-router-dom'
import { Lock, FileEdit } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatMonthYear } from '@/lib/utils'
import { BudgetStatus } from '@/api/types'
import type { BudgetSummary } from '@/api/types'

interface BudgetCardProps {
  budget: BudgetSummary
}

export function BudgetCard({ budget }: BudgetCardProps) {
  const navigate = useNavigate()
  
  const isLocked = budget.status === BudgetStatus.LOCKED
  const balance = budget.totalIncome - budget.totalExpenses - budget.totalSavings

  const handleClick = () => {
    navigate(`/budgets/${budget.id}`)
  }

  return (
    <Card
      className="cursor-pointer hover:border-gray-300 hover:shadow-sm transition-all"
      onClick={handleClick}
    >
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <h3 className="font-semibold text-lg text-gray-900">
            {formatMonthYear(budget.month, budget.year)}
          </h3>
          <Badge
            variant={isLocked ? 'default' : 'secondary'}
            className="flex items-center gap-1"
          >
            {isLocked ? (
              <>
                <Lock className="w-3 h-3" />
                Locked
              </>
            ) : (
              <>
                <FileEdit className="w-3 h-3" />
                Draft
              </>
            )}
          </Badge>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Income</span>
            <span className="font-medium text-green-600">
              {formatCurrency(budget.totalIncome)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Expenses</span>
            <span className="font-medium text-red-600">
              {formatCurrency(budget.totalExpenses)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Savings</span>
            <span className="font-medium text-blue-600">
              {formatCurrency(budget.totalSavings)}
            </span>
          </div>
          <hr className="my-2" />
          <div className="flex justify-between">
            <span className="text-gray-700 font-medium">Balance</span>
            <span className={`font-semibold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(balance)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
```

**Create `src/components/budgets/BudgetGrid.tsx`:**

```typescript
import { CalendarDays } from 'lucide-react'
import { LoadingState, EmptyState, ErrorState } from '@/components/shared'
import { Button } from '@/components/ui/button'
import { BudgetCard } from './BudgetCard'
import type { BudgetSummary } from '@/api/types'

interface BudgetGridProps {
  budgets: BudgetSummary[]
  isLoading: boolean
  isError: boolean
  onRetry: () => void
  onCreateNew: () => void
}

// Sort budgets by year and month descending (newest first)
function sortBudgets(budgets: BudgetSummary[]): BudgetSummary[] {
  return [...budgets].sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year
    return b.month - a.month
  })
}

export function BudgetGrid({
  budgets,
  isLoading,
  isError,
  onRetry,
  onCreateNew,
}: BudgetGridProps) {
  if (isLoading) {
    return <LoadingState variant="cards" rows={6} />
  }

  if (isError) {
    return (
      <ErrorState
        title="Failed to load budgets"
        message="We couldn't load your budgets. Please try again."
        onRetry={onRetry}
      />
    )
  }

  if (budgets.length === 0) {
    return (
      <EmptyState
        icon={<CalendarDays className="w-12 h-12" />}
        title="No budgets yet"
        description="Create your first monthly budget to start tracking your income, expenses, and savings."
        action={
          <Button onClick={onCreateNew}>Create Your First Budget</Button>
        }
      />
    )
  }

  const sortedBudgets = sortBudgets(budgets)

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {sortedBudgets.map((budget) => (
        <BudgetCard key={budget.id} budget={budget} />
      ))}
    </div>
  )
}
```

**Create barrel export `src/components/budgets/index.ts`:**

```typescript
export { BudgetCard } from './BudgetCard'
export { BudgetGrid } from './BudgetGrid'
```

### Test File: `src/components/budgets/BudgetCard.test.tsx`

```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import { BudgetCard } from './BudgetCard'
import { BudgetStatus } from '@/api/types'
import type { BudgetSummary } from '@/api/types'

// Mock useNavigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

const mockDraftBudget: BudgetSummary = {
  id: '123',
  month: 3,
  year: 2025,
  status: BudgetStatus.DRAFT,
  totalIncome: 50000,
  totalExpenses: 35000,
  totalSavings: 10000,
  createdAt: '2025-03-01',
}

const mockLockedBudget: BudgetSummary = {
  ...mockDraftBudget,
  id: '456',
  status: BudgetStatus.LOCKED,
}

describe('BudgetCard', () => {
  beforeEach(() => {
    mockNavigate.mockClear()
  })

  it('renders month and year', () => {
    render(<BudgetCard budget={mockDraftBudget} />)
    
    expect(screen.getByText(/mars 2025/i)).toBeInTheDocument()
  })

  it('shows Draft badge for draft budgets', () => {
    render(<BudgetCard budget={mockDraftBudget} />)
    
    expect(screen.getByText('Draft')).toBeInTheDocument()
  })

  it('shows Locked badge for locked budgets', () => {
    render(<BudgetCard budget={mockLockedBudget} />)
    
    expect(screen.getByText('Locked')).toBeInTheDocument()
  })

  it('displays income formatted as SEK', () => {
    render(<BudgetCard budget={mockDraftBudget} />)
    
    expect(screen.getByText(/50 000,00 kr/)).toBeInTheDocument()
  })

  it('displays expenses formatted as SEK', () => {
    render(<BudgetCard budget={mockDraftBudget} />)
    
    expect(screen.getByText(/35 000,00 kr/)).toBeInTheDocument()
  })

  it('displays savings formatted as SEK', () => {
    render(<BudgetCard budget={mockDraftBudget} />)
    
    expect(screen.getByText(/10 000,00 kr/)).toBeInTheDocument()
  })

  it('calculates and displays balance', () => {
    render(<BudgetCard budget={mockDraftBudget} />)
    
    // Balance = 50000 - 35000 - 10000 = 5000
    expect(screen.getByText(/5 000,00 kr/)).toBeInTheDocument()
  })

  it('shows positive balance in green', () => {
    render(<BudgetCard budget={mockDraftBudget} />)
    
    // Find the balance row
    const balanceLabel = screen.getByText('Balance')
    const balanceRow = balanceLabel.closest('div')
    const balanceValue = balanceRow?.querySelector('.text-green-600')
    
    expect(balanceValue).toBeInTheDocument()
  })

  it('shows negative balance in red', () => {
    const negativeBudget = {
      ...mockDraftBudget,
      totalExpenses: 60000, // More than income
    }
    render(<BudgetCard budget={negativeBudget} />)
    
    // Balance would be negative
    const balanceLabel = screen.getByText('Balance')
    const balanceRow = balanceLabel.closest('div')
    const balanceValue = balanceRow?.querySelector('.text-red-600')
    
    expect(balanceValue).toBeInTheDocument()
  })

  it('navigates to budget detail on click', async () => {
    render(<BudgetCard budget={mockDraftBudget} />)
    
    await userEvent.click(screen.getByText(/mars 2025/i))
    
    expect(mockNavigate).toHaveBeenCalledWith('/budgets/123')
  })
})
```

### Test File: `src/components/budgets/BudgetGrid.test.tsx`

```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import { BudgetGrid } from './BudgetGrid'
import { BudgetStatus } from '@/api/types'
import type { BudgetSummary } from '@/api/types'

// Mock useNavigate for BudgetCard
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  }
})

const mockBudgets: BudgetSummary[] = [
  {
    id: '1',
    month: 1,
    year: 2025,
    status: BudgetStatus.LOCKED,
    totalIncome: 50000,
    totalExpenses: 35000,
    totalSavings: 10000,
    createdAt: '2025-01-01',
  },
  {
    id: '2',
    month: 3,
    year: 2025,
    status: BudgetStatus.DRAFT,
    totalIncome: 50000,
    totalExpenses: 30000,
    totalSavings: 15000,
    createdAt: '2025-03-01',
  },
  {
    id: '3',
    month: 12,
    year: 2024,
    status: BudgetStatus.LOCKED,
    totalIncome: 48000,
    totalExpenses: 32000,
    totalSavings: 10000,
    createdAt: '2024-12-01',
  },
]

const defaultProps = {
  budgets: mockBudgets,
  isLoading: false,
  isError: false,
  onRetry: vi.fn(),
  onCreateNew: vi.fn(),
}

describe('BudgetGrid', () => {
  it('renders loading state', () => {
    render(<BudgetGrid {...defaultProps} isLoading={true} budgets={[]} />)
    
    // Should show skeleton loading
    expect(screen.queryByText(/mars 2025/i)).not.toBeInTheDocument()
  })

  it('renders error state with retry button', async () => {
    const onRetry = vi.fn()
    render(<BudgetGrid {...defaultProps} isError={true} budgets={[]} onRetry={onRetry} />)
    
    expect(screen.getByText(/failed to load/i)).toBeInTheDocument()
    
    await userEvent.click(screen.getByRole('button', { name: /try again/i }))
    expect(onRetry).toHaveBeenCalled()
  })

  it('renders empty state when no budgets', () => {
    render(<BudgetGrid {...defaultProps} budgets={[]} />)
    
    expect(screen.getByText(/no budgets yet/i)).toBeInTheDocument()
  })

  it('renders empty state with create button', async () => {
    const onCreateNew = vi.fn()
    render(<BudgetGrid {...defaultProps} budgets={[]} onCreateNew={onCreateNew} />)
    
    await userEvent.click(screen.getByRole('button', { name: /create your first budget/i }))
    expect(onCreateNew).toHaveBeenCalled()
  })

  it('renders all budget cards', () => {
    render(<BudgetGrid {...defaultProps} />)
    
    expect(screen.getByText(/januari 2025/i)).toBeInTheDocument()
    expect(screen.getByText(/mars 2025/i)).toBeInTheDocument()
    expect(screen.getByText(/december 2024/i)).toBeInTheDocument()
  })

  it('sorts budgets by date descending (newest first)', () => {
    render(<BudgetGrid {...defaultProps} />)
    
    const cards = screen.getAllByRole('article') || document.querySelectorAll('[class*="Card"]')
    const headings = screen.getAllByRole('heading', { level: 3 })
    
    // March 2025 should come before January 2025, which should come before December 2024
    const texts = headings.map(h => h.textContent)
    expect(texts[0]).toMatch(/mars 2025/i)
    expect(texts[1]).toMatch(/januari 2025/i)
    expect(texts[2]).toMatch(/december 2024/i)
  })

  it('shows status badges', () => {
    render(<BudgetGrid {...defaultProps} />)
    
    expect(screen.getByText('Draft')).toBeInTheDocument()
    expect(screen.getAllByText('Locked')).toHaveLength(2)
  })
})
```

### Definition of Done

- [ ] All tests pass
- [ ] Grid displays budget cards
- [ ] Cards sorted by date descending
- [ ] Responsive grid layout works
- [ ] Loading, error, and empty states work
- [ ] Clicking card navigates to detail

---

## Story 4.3: Update Budgets Page with Grid

**As a** user  
**I want to** see the complete budgets page  
**So that** I can browse all my budgets

### Acceptance Criteria

- [ ] Page integrates BudgetGrid component
- [ ] Fetches budgets from API on mount
- [ ] Handles loading/error/empty states
- [ ] "New Budget" button works in both header and empty state

### Implementation

**Update `src/pages/BudgetsPage.tsx`:**

```typescript
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/shared'
import { BudgetGrid } from '@/components/budgets'
import { useBudgets } from '@/hooks'

export function BudgetsPage() {
  const navigate = useNavigate()
  const { data, isLoading, isError, refetch } = useBudgets()

  const handleCreateNew = () => {
    navigate('/budgets/new')
  }

  return (
    <div>
      <PageHeader
        title="Budgets"
        description="Manage your monthly budgets"
        action={
          <Button onClick={handleCreateNew}>
            <Plus className="w-4 h-4 mr-2" />
            New Budget
          </Button>
        }
      />

      <BudgetGrid
        budgets={data?.budgets ?? []}
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
        onCreateNew={handleCreateNew}
      />
    </div>
  )
}
```

### Updated Test File: `src/pages/BudgetsPage.test.tsx`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import { BudgetsPage } from './BudgetsPage'
import { server } from '@/test/mocks/server'
import { http, HttpResponse } from 'msw'
import { BudgetStatus } from '@/api/types'

// Mock useNavigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

const mockBudgetsResponse = {
  budgets: [
    {
      id: '1',
      month: 3,
      year: 2025,
      status: BudgetStatus.DRAFT,
      totalIncome: 50000,
      totalExpenses: 35000,
      totalSavings: 10000,
      createdAt: '2025-03-01',
    },
  ],
}

describe('BudgetsPage', () => {
  beforeEach(() => {
    mockNavigate.mockClear()
    server.use(
      http.get('/api/budgets', () => {
        return HttpResponse.json(mockBudgetsResponse)
      })
    )
  })

  it('renders page header with title', () => {
    render(<BudgetsPage />)
    
    expect(screen.getByRole('heading', { name: /budgets/i })).toBeInTheDocument()
  })

  it('renders new budget button', () => {
    render(<BudgetsPage />)
    
    expect(screen.getByRole('button', { name: /new budget/i })).toBeInTheDocument()
  })

  it('navigates to wizard when new budget button is clicked', async () => {
    render(<BudgetsPage />)
    
    await userEvent.click(screen.getByRole('button', { name: /new budget/i }))
    
    expect(mockNavigate).toHaveBeenCalledWith('/budgets/new')
  })

  it('displays budgets from API', async () => {
    render(<BudgetsPage />)
    
    await waitFor(() => {
      expect(screen.getByText(/mars 2025/i)).toBeInTheDocument()
    })
  })

  it('shows empty state when no budgets', async () => {
    server.use(
      http.get('/api/budgets', () => {
        return HttpResponse.json({ budgets: [] })
      })
    )

    render(<BudgetsPage />)
    
    await waitFor(() => {
      expect(screen.getByText(/no budgets yet/i)).toBeInTheDocument()
    })
  })

  it('shows error state on API failure', async () => {
    server.use(
      http.get('/api/budgets', () => {
        return HttpResponse.error()
      })
    )

    render(<BudgetsPage />)
    
    await waitFor(() => {
      expect(screen.getByText(/failed to load/i)).toBeInTheDocument()
    })
  })

  it('retries on error', async () => {
    let callCount = 0
    server.use(
      http.get('/api/budgets', () => {
        callCount++
        if (callCount === 1) {
          return HttpResponse.error()
        }
        return HttpResponse.json(mockBudgetsResponse)
      })
    )

    render(<BudgetsPage />)
    
    await waitFor(() => {
      expect(screen.getByText(/failed to load/i)).toBeInTheDocument()
    })

    await userEvent.click(screen.getByRole('button', { name: /try again/i }))

    await waitFor(() => {
      expect(screen.getByText(/mars 2025/i)).toBeInTheDocument()
    })
  })
})
```

### Definition of Done

- [ ] All tests pass
- [ ] Page fetches and displays budgets
- [ ] Navigation works from both header and empty state
- [ ] Error handling and retry work

---

## Epic 4 Complete File Structure

```
src/
├── components/
│   └── budgets/
│       ├── BudgetCard.tsx
│       ├── BudgetGrid.tsx
│       └── index.ts
└── pages/
    └── BudgetsPage.tsx
```

---

## Test Summary

| Component | Test File | Tests (approx) |
|-----------|-----------|----------------|
| BudgetsPage | BudgetsPage.test.tsx | 7 |
| BudgetCard | BudgetCard.test.tsx | 10 |
| BudgetGrid | BudgetGrid.test.tsx | 7 |

**Total: ~24 tests for Epic 4**

---

## MSW Handlers Update

The budgets handler should already exist from Epic 1 setup, but ensure it's in `src/test/mocks/handlers.ts`:

```typescript
// Budgets list
http.get('/api/budgets', () => {
  return HttpResponse.json({
    budgets: [],
  })
}),
```

For tests that need budgets, override the handler in the test file as shown above.

---

## Visual Design Notes

### Budget Card Layout

```
┌─────────────────────────────────┐
│ mars 2025              [Draft]  │
├─────────────────────────────────┤
│ Income           50 000,00 kr   │
│ Expenses         35 000,00 kr   │
│ Savings          10 000,00 kr   │
│ ─────────────────────────────── │
│ Balance           5 000,00 kr   │
└─────────────────────────────────┘
```

### Status Badge Colors

- **Draft**: Gray/secondary badge with edit icon
- **Locked**: Default/primary badge with lock icon

### Balance Colors

- **Positive balance**: Green (`text-green-600`)
- **Negative balance**: Red (`text-red-600`)
- **Zero balance**: Green (treated as positive)

---

## Responsive Grid Breakpoints

```css
/* Mobile (default): 1 column */
grid-cols-1

/* Tablet (md: 768px+): 2 columns */
md:grid-cols-2

/* Desktop (lg: 1024px+): 3 columns */
lg:grid-cols-3
```

---

## Next Steps

After completing Epic 4:

1. Run all tests: `npm test`
2. Test manually in browser
3. Verify grid responsiveness
4. Verify card click navigation
5. Proceed to Epic 5: Budget Wizard (most complex epic!)

---

## Progress Summary

| Epic | Stories | Tests |
|------|---------|-------|
| Epic 1: Infrastructure | 6 | ~50 |
| Epic 2: Accounts | 7 | ~46 |
| Epic 3: Recurring Expenses | 5 | ~42 |
| **Epic 4: Budget List** | **3** | **~24** |
| **Total** | **21** | **~162** |

---

*Last updated: December 2024*
