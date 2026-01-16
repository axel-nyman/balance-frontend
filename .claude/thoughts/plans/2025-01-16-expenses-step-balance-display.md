# Expenses Step Balance Display Implementation Plan

## Overview

Add an income and remaining balance display to the expenses step of the budget creation wizard, similar to how the savings step shows a running balance summary. This helps users track their budget as they add expenses.

## Current State Analysis

- **Savings Step** (`StepSavings.tsx:38-51, 178-208`): Has a 4-column running balance display (Income, Expenses, Savings, Remaining) with color-coded amounts and a negative balance warning alert.
- **Expenses Step** (`StepExpenses.tsx`): Only shows total expenses in the table footer. No income display or remaining balance calculation.

### Key Discoveries:
- Balance calculation pattern from savings step: `StepSavings.tsx:39-51`
- Grid display pattern: `StepSavings.tsx:178-208`
- Negative balance alert pattern: `StepSavings.tsx:210-219`
- The `useWizard()` hook provides access to `state.incomeItems` from previous step
- `formatCurrency()` is already imported in `StepExpenses.tsx:27`

## Desired End State

- The expenses step displays a 2-column balance summary showing:
  - **Income**: Total from income step (green text)
  - **Remaining**: Income minus expenses (green if positive, red if negative)
- When remaining balance goes negative, a warning alert appears suggesting to reduce expenses
- The display appears above the "Quick Add from Recurring" card (when present) or above the expenses table

### Verification:
- Unit tests verify balance calculations and display
- Manual verification confirms correct rendering and color changes

## What We're NOT Doing

- Not showing a "Savings" column (savings are added in the next step)
- Not showing a separate "Expenses" column (already in table footer)
- Not changing the savings step implementation
- Not modifying the wizard context or reducer

## Implementation Approach

Single-file change to `StepExpenses.tsx` following the exact pattern from `StepSavings.tsx`. Add income calculation, remaining balance calculation, and render a 2-column grid with conditional warning alert.

## Phase 1: Add Balance Display to Expenses Step

### Overview
Add income total calculation and a 2-column balance display grid to the expenses step, with a warning alert when balance goes negative.

### Changes Required:

#### 1. StepExpenses Component
**File**: `src/components/wizard/steps/StepExpenses.tsx`

**Add import for AlertTriangle and Alert components (line ~2):**
```typescript
import { Plus, Trash2, Check, Repeat, AlertTriangle } from 'lucide-react'
```

**Add Alert import after Card import (line ~24):**
```typescript
import { Alert, AlertDescription } from '@/components/ui/alert'
```

**Add income calculation after accounts declaration (after line 38):**
```typescript
// Calculate totals for balance display
const totalIncome = state.incomeItems.reduce(
  (sum, item) => sum + (item.amount || 0),
  0
)
const remainingBalance = totalIncome - totalExpenses
```

Note: `totalExpenses` is already calculated at line 80-83.

**Add balance display grid after the header section (after line 244, before the quick-add card):**
```tsx
{/* Running balance display */}
<div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
  <div>
    <p className="text-xs text-gray-500 uppercase">Income</p>
    <p className="text-lg font-semibold text-green-600">
      {formatCurrency(totalIncome)}
    </p>
  </div>
  <div>
    <p className="text-xs text-gray-500 uppercase">Remaining</p>
    <p
      className={cn(
        'text-lg font-semibold',
        remainingBalance >= 0 ? 'text-green-600' : 'text-red-600'
      )}
    >
      {formatCurrency(remainingBalance)}
    </p>
  </div>
</div>

{remainingBalance < 0 && (
  <Alert variant="destructive">
    <AlertTriangle className="h-4 w-4" />
    <AlertDescription>
      Your planned expenses exceed your income by{' '}
      {formatCurrency(Math.abs(remainingBalance))}. Consider reducing your
      expenses.
    </AlertDescription>
  </Alert>
)}
```

#### 2. Update Tests
**File**: `src/components/wizard/steps/StepExpenses.test.tsx`

**Add helper to set up wizard state with income (similar to StepSavings.test.tsx):**
```typescript
import { useEffect } from 'react'
import { WizardProvider, useWizard } from '../WizardContext'

// Helper to set up wizard state with income
function WizardWithIncome({ children }: { children: React.ReactNode }) {
  const { dispatch } = useWizard()

  useEffect(() => {
    dispatch({
      type: 'SET_INCOME_ITEMS',
      items: [
        {
          id: '1',
          name: 'Salary',
          amount: 50000,
          bankAccountId: 'acc-1',
          bankAccountName: 'Checking',
        },
      ],
    })
  }, [dispatch])

  return <>{children}</>
}

function renderWithWizard(withIncome = false) {
  if (withIncome) {
    return render(
      <WizardProvider>
        <WizardWithIncome>
          <StepExpenses />
        </WizardWithIncome>
      </WizardProvider>
    )
  }
  return render(
    <WizardProvider>
      <StepExpenses />
    </WizardProvider>
  )
}
```

**Update existing renderWithWizard calls** to use the new function signature (simple find-replace).

**Add new tests:**
```typescript
it('shows running balance summary', async () => {
  renderWithWizard(true)

  await waitFor(() => {
    expect(screen.getByText('Income')).toBeInTheDocument()
    expect(screen.getByText('Remaining')).toBeInTheDocument()
  })
})

it('displays income from previous step', async () => {
  renderWithWizard(true)

  await waitFor(() => {
    expect(screen.getByText(/50 000,00 kr/)).toBeInTheDocument()
  })
})

it('calculates remaining balance correctly', async () => {
  renderWithWizard(true)

  // Add expense
  await userEvent.click(screen.getByRole('button', { name: /add expense/i }))
  const amountInput = screen.getByPlaceholderText('0')
  await userEvent.type(amountInput, '20000')

  // Income 50000 - Expenses 20000 = 30000 remaining
  await waitFor(() => {
    expect(screen.getByText(/30 000,00 kr/)).toBeInTheDocument()
  })
})

it('shows warning when expenses exceed income', async () => {
  renderWithWizard(true)

  await userEvent.click(screen.getByRole('button', { name: /add expense/i }))

  const amountInput = screen.getByPlaceholderText('0')
  await userEvent.type(amountInput, '60000')

  await waitFor(() => {
    expect(screen.getByText(/exceed/i)).toBeInTheDocument()
  })
})

it('shows remaining in red when negative', async () => {
  renderWithWizard(true)

  await userEvent.click(screen.getByRole('button', { name: /add expense/i }))

  const amountInput = screen.getByPlaceholderText('0')
  await userEvent.type(amountInput, '60000')

  await waitFor(() => {
    // Find the remaining balance element by looking for the formatted negative amount
    const remainingText = screen.getByText(/-10 000,00 kr/)
    expect(remainingText).toHaveClass('text-red-600')
  })
})
```

### Success Criteria:

#### Automated Verification:
- [x] All existing tests pass: `npm test`
- [x] New tests pass for balance display functionality
- [x] Type checking passes: `npm run build`
- [x] Linting passes: `npm run lint`

#### Manual Verification:
- [x] Navigate to budget wizard, go to expenses step
- [x] Balance display shows at top with Income and Remaining columns
- [x] Income shows total from income step in green
- [x] Remaining updates as expenses are added/removed
- [x] Remaining turns red when it goes negative
- [x] Warning alert appears when remaining is negative
- [x] Works correctly on mobile viewport (columns stack appropriately with grid-cols-2)

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation.

---

## Testing Strategy

### Unit Tests:
- Balance summary renders with correct labels
- Income displays correctly from wizard state
- Remaining balance calculates correctly (income - expenses)
- Warning alert appears when remaining < 0
- Remaining text color changes based on positive/negative value

### Manual Testing Steps:
1. Start budget creation wizard
2. Add income items in step 2 (e.g., 50,000 kr)
3. Proceed to step 3 (Expenses)
4. Verify income shows as 50,000 kr in green
5. Verify remaining shows as 50,000 kr in green
6. Add an expense of 30,000 kr
7. Verify remaining updates to 20,000 kr (still green)
8. Add another expense of 25,000 kr
9. Verify remaining shows -5,000 kr in red
10. Verify warning alert appears about exceeding income
11. Remove an expense
12. Verify remaining recalculates and warning disappears if positive
13. Test on mobile viewport

## Performance Considerations

None - calculations are simple reduces on small arrays, identical to existing savings step implementation.

## References

- Reference implementation: `src/components/wizard/steps/StepSavings.tsx:38-51, 178-219`
- Target file: `src/components/wizard/steps/StepExpenses.tsx`
- Test patterns: `src/components/wizard/steps/StepSavings.test.tsx:11-60, 113-132, 283-301`
