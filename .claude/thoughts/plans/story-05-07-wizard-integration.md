# Story 5.7: Wizard Integration & Save Flow

**As a** user  
**I want to** save my complete budget  
**So that** it's persisted and I can view it later

### Acceptance Criteria

- [ ] Save button creates budget and all items via API
- [ ] Shows loading state during save
- [ ] Shows error if any step fails
- [ ] Navigates to budget detail on success
- [ ] If "Lock" checked, locks budget after creation
- [ ] Toast notification on success/failure

### Implementation

The save logic is already implemented in `WizardShell.tsx`. This story is about integration testing and ensuring the full flow works.

### Test File: `src/components/wizard/WizardShell.test.tsx`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import { WizardProvider } from './WizardContext'
import { WizardShell } from './WizardShell'
import { server } from '@/test/mocks/server'
import { http, HttpResponse } from 'msw'

// Mock useNavigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useBlocker: () => ({ state: 'unblocked', reset: vi.fn(), proceed: vi.fn() }),
  }
})

function renderWizard() {
  return render(
    <WizardProvider>
      <WizardShell />
    </WizardProvider>
  )
}

describe('WizardShell', () => {
  beforeEach(() => {
    mockNavigate.mockClear()
    server.use(
      http.get('/api/budgets', () => {
        return HttpResponse.json({ budgets: [] })
      }),
      http.get('/api/recurring-expenses', () => {
        return HttpResponse.json({ expenses: [] })
      }),
      http.get('/api/bank-accounts', () => {
        return HttpResponse.json({
          totalBalance: 10000,
          accountCount: 1,
          accounts: [{ id: '1', name: 'Savings', currentBalance: 10000 }]
        })
      })
    )
  })

  it('renders step indicator', () => {
    renderWizard()
    
    expect(screen.getByText(/step 1/i)).toBeInTheDocument()
  })

  it('starts on step 1 (month selection)', () => {
    renderWizard()
    
    expect(screen.getByText(/select month/i)).toBeInTheDocument()
  })

  it('shows Next button on step 1', () => {
    renderWizard()
    
    expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument()
  })

  it('hides Back button on step 1', () => {
    renderWizard()
    
    expect(screen.queryByRole('button', { name: /back/i })).not.toBeInTheDocument()
  })

  it('advances to step 2 when Next clicked with valid month', async () => {
    renderWizard()
    
    // Wait for month to be auto-selected
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /next/i })).not.toBeDisabled()
    })

    await userEvent.click(screen.getByRole('button', { name: /next/i }))
    
    expect(screen.getByText(/income/i)).toBeInTheDocument()
  })

  it('shows Back button on step 2', async () => {
    renderWizard()
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /next/i })).not.toBeDisabled()
    })

    await userEvent.click(screen.getByRole('button', { name: /next/i }))
    
    expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument()
  })

  it('goes back to step 1 when Back clicked', async () => {
    renderWizard()
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /next/i })).not.toBeDisabled()
    })

    await userEvent.click(screen.getByRole('button', { name: /next/i }))
    await userEvent.click(screen.getByRole('button', { name: /back/i }))
    
    expect(screen.getByText(/select month/i)).toBeInTheDocument()
  })

  it('disables Next on step 2 until income is added', async () => {
    renderWizard()
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /next/i })).not.toBeDisabled()
    })

    await userEvent.click(screen.getByRole('button', { name: /next/i }))
    
    // Now on step 2, Next should be disabled
    expect(screen.getByRole('button', { name: /next/i })).toBeDisabled()
  })

  it('enables Next on step 2 after adding income', async () => {
    renderWizard()
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /next/i })).not.toBeDisabled()
    })

    await userEvent.click(screen.getByRole('button', { name: /next/i }))
    
    // Add income
    await userEvent.click(screen.getByRole('button', { name: /add income/i }))
    await userEvent.type(screen.getByPlaceholderText(/salary/i), 'My Salary')
    await userEvent.type(screen.getByPlaceholderText('0'), '50000')
    
    expect(screen.getByRole('button', { name: /next/i })).not.toBeDisabled()
  })
})
```

### Integration Test File: `src/components/wizard/WizardIntegration.test.tsx`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import { WizardProvider } from './WizardContext'
import { WizardShell } from './WizardShell'
import { server } from '@/test/mocks/server'
import { http, HttpResponse } from 'msw'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useBlocker: () => ({ state: 'unblocked', reset: vi.fn(), proceed: vi.fn() }),
  }
})

describe('Wizard Integration', () => {
  beforeEach(() => {
    mockNavigate.mockClear()
    server.use(
      http.get('/api/budgets', () => {
        return HttpResponse.json({ budgets: [] })
      }),
      http.get('/api/recurring-expenses', () => {
        return HttpResponse.json({ expenses: [] })
      }),
      http.get('/api/bank-accounts', () => {
        return HttpResponse.json({
          totalBalance: 10000,
          accountCount: 1,
          accounts: [{ id: 'acc-1', name: 'Savings', currentBalance: 10000 }]
        })
      }),
      http.post('/api/budgets', () => {
        return HttpResponse.json({ id: 'new-budget-123' }, { status: 201 })
      }),
      http.post('/api/budgets/:id/income', () => {
        return HttpResponse.json({ id: 'income-1' }, { status: 201 })
      }),
      http.post('/api/budgets/:id/expenses', () => {
        return HttpResponse.json({ id: 'expense-1' }, { status: 201 })
      }),
      http.post('/api/budgets/:id/savings', () => {
        return HttpResponse.json({ id: 'savings-1' }, { status: 201 })
      })
    )
  })

  it('completes full wizard flow and saves budget', async () => {
    render(
      <WizardProvider>
        <WizardShell />
      </WizardProvider>
    )

    // Step 1: Month selection (auto-selected)
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /next/i })).not.toBeDisabled()
    })
    await userEvent.click(screen.getByRole('button', { name: /next/i }))

    // Step 2: Income
    await userEvent.click(screen.getByRole('button', { name: /add income/i }))
    await userEvent.type(screen.getByPlaceholderText(/salary/i), 'Salary')
    await userEvent.type(screen.getByPlaceholderText('0'), '50000')
    await userEvent.click(screen.getByRole('button', { name: /next/i }))

    // Step 3: Expenses (optional, skip)
    await userEvent.click(screen.getByRole('button', { name: /next/i }))

    // Step 4: Savings (optional, skip)
    await userEvent.click(screen.getByRole('button', { name: /next/i }))

    // Step 5: Review
    expect(screen.getByText(/review budget/i)).toBeInTheDocument()
    expect(screen.getByText('Salary')).toBeInTheDocument()
    expect(screen.getByText(/50 000,00 kr/)).toBeInTheDocument()

    // Save
    await userEvent.click(screen.getByRole('button', { name: /save budget/i }))

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/budgets/new-budget-123')
    })
  })

  it('shows error when budget creation fails', async () => {
    server.use(
      http.post('/api/budgets', () => {
        return HttpResponse.json(
          { error: 'Budget already exists for this month' },
          { status: 400 }
        )
      })
    )

    render(
      <WizardProvider>
        <WizardShell />
      </WizardProvider>
    )

    // Navigate to review step
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /next/i })).not.toBeDisabled()
    })
    await userEvent.click(screen.getByRole('button', { name: /next/i }))

    await userEvent.click(screen.getByRole('button', { name: /add income/i }))
    await userEvent.type(screen.getByPlaceholderText(/salary/i), 'Salary')
    await userEvent.type(screen.getByPlaceholderText('0'), '50000')
    await userEvent.click(screen.getByRole('button', { name: /next/i }))
    await userEvent.click(screen.getByRole('button', { name: /next/i }))
    await userEvent.click(screen.getByRole('button', { name: /next/i }))

    // Save
    await userEvent.click(screen.getByRole('button', { name: /save budget/i }))

    await waitFor(() => {
      expect(screen.getByText(/already exists/i)).toBeInTheDocument()
    })
  })
})
```

### Definition of Done

- [ ] All tests pass
- [ ] Full wizard flow works end-to-end
- [ ] Error handling works
- [ ] Navigation after save works

---

## Epic 5 Complete File Structure

```
src/
├── components/
│   └── wizard/
│       ├── index.ts
│       ├── types.ts
│       ├── wizardReducer.ts
│       ├── WizardContext.tsx
│       ├── WizardShell.tsx
│       ├── StepIndicator.tsx
│       ├── WizardNavigation.tsx
│       └── steps/
│           ├── StepMonthYear.tsx
│           ├── StepIncome.tsx
│           ├── StepExpenses.tsx
│           ├── StepSavings.tsx
│           └── StepReview.tsx
└── pages/
    └── BudgetWizardPage.tsx
```

### Barrel Export `src/components/wizard/index.ts`

```typescript
export { WizardProvider, useWizard } from './WizardContext'
export { WizardShell } from './WizardShell'
export { StepIndicator } from './StepIndicator'
export { WizardNavigation } from './WizardNavigation'
export * from './types'
```

---

## Test Summary

| Component | Test File | Tests (approx) |
|-----------|-----------|----------------|
| wizardReducer | wizardReducer.test.ts | 15 |
| StepIndicator | StepIndicator.test.tsx | 4 |
| WizardNavigation | WizardNavigation.test.tsx | 8 |
| StepMonthYear | StepMonthYear.test.tsx | 7 |
| StepIncome | StepIncome.test.tsx | 10 |
| StepExpenses | StepExpenses.test.tsx | 10 |
| StepSavings | StepSavings.test.tsx | 9 |
| StepReview | StepReview.test.tsx | 10 |
| WizardShell | WizardShell.test.tsx | 8 |
| Integration | WizardIntegration.test.tsx | 2 |

**Total: ~83 tests for Epic 5**

---

## MSW Handlers Update

Add these handlers to `src/test/mocks/handlers.ts`:

```typescript
// Budget detail (for copy from last)
http.get('/api/budgets/:id', ({ params }) => {
  return HttpResponse.json({
    id: params.id,
    month: 1,
    year: 2025,
    status: 'DRAFT',
    incomeItems: [],
    expenseItems: [],
    savingsItems: [],
  })
}),

// Create budget
http.post('/api/budgets', async ({ request }) => {
  const body = await request.json()
  return HttpResponse.json({
    id: crypto.randomUUID(),
    ...body,
    status: 'DRAFT',
  }, { status: 201 })
}),

// Add income
http.post('/api/budgets/:id/income', async ({ request }) => {
  const body = await request.json()
  return HttpResponse.json({
    id: crypto.randomUUID(),
    ...body,
  }, { status: 201 })
}),

// Add expense
http.post('/api/budgets/:id/expenses', async ({ request }) => {
  const body = await request.json()
  return HttpResponse.json({
    id: crypto.randomUUID(),
    ...body,
  }, { status: 201 })
}),

// Add savings
http.post('/api/budgets/:id/savings', async ({ request }) => {
  const body = await request.json()
  return HttpResponse.json({
    id: crypto.randomUUID(),
    ...body,
  }, { status: 201 })
}),

// Lock budget
http.post('/api/budgets/:id/lock', () => {
  return HttpResponse.json({ status: 'LOCKED' })
}),
```

---

## Next Steps

After completing Epic 5:

1. Run all tests: `npm test`
2. Test full wizard flow manually
3. Verify "Copy from Last Budget" works
4. Verify quick-add from recurring works
5. Proceed to Epic 6: Budget Detail

---

## Progress Summary

| Epic | Stories | Tests |
|------|---------|-------|
| Epic 1: Infrastructure | 6 | ~50 |
| Epic 2: Accounts | 7 | ~46 |
| Epic 3: Recurring Expenses | 5 | ~42 |
| Epic 4: Budget List | 3 | ~24 |
| **Epic 5: Budget Wizard** | **7** | **~83** |
| **Total** | **28** | **~245** |

---

*Last updated: December 2024*