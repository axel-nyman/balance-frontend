# Story 4.3: Update Budgets Page with Grid

**As a** user  
**I want to** see the complete budgets page  
**So that** I can browse all my budgets

### Acceptance Criteria

- [x] Page integrates BudgetGrid component
- [x] Fetches budgets from API on mount
- [x] Handles loading/error/empty states
- [x] "New Budget" button works in both header and empty state

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

- [x] All tests pass
- [x] Page fetches and displays budgets
- [x] Navigation works from both header and empty state
- [x] Error handling and retry work

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

1. ~~Run all tests: `npm test`~~ ✅
2. ~~Test manually in browser~~ ✅
3. ~~Verify grid responsiveness~~ ✅
4. ~~Verify card click navigation~~ ✅
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