# Story 4.1: Budgets Page Shell

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