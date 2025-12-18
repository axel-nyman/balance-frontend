# Story 6.2: Budget Summary Card

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