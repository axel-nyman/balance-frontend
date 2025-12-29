# Story 4.2: Budget Grid

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

- [x] All tests pass
- [x] Grid displays budget cards
- [x] Cards sorted by date descending
- [x] Responsive grid layout works
- [x] Loading, error, and empty states work
- [x] Clicking card navigates to detail

---