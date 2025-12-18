# Story 3.1: Recurring Expenses Page Shell

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