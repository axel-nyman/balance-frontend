# Story 6.1: Budget Detail Page Shell

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
  status: 'UNLOCKED',
  createdAt: '2025-03-01T00:00:00Z',
  lockedAt: null,
  income: [
    { id: 'i1', name: 'Salary', amount: 50000, bankAccount: { id: 'acc-1', name: 'Main Account' } }
  ],
  expenses: [
    { id: 'e1', name: 'Rent', amount: 8000, bankAccount: { id: 'acc-1', name: 'Main Account' }, recurringExpenseId: null, deductedAt: null, isManual: false }
  ],
  savings: [],
  totals: {
    income: 50000,
    expenses: 8000,
    savings: 0,
    balance: 42000,
  },
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