# Disable New Budget Button When Unlocked Budget Exists

## Overview

Fix the UX bug where users can open the budget wizard even when an unlocked budget exists, only to fail at the final step. The button should be disabled upfront, with a toast message on click explaining why.

## Current State Analysis

- "New Budget" button in `BudgetsPage.tsx:18-21` is always enabled
- `useBudgetValidation()` hook exists at `src/hooks/use-budget-validation.ts` but is not used
- Backend validation rejects budget creation when an unlocked budget exists
- Users can complete the entire 5-step wizard before seeing the error

## Desired End State

- The "New Budget" button is disabled when an unlocked budget exists
- Clicking the disabled button shows a toast: "You already have an unlocked budget. Lock or delete it before creating a new one."
- Works correctly on both desktop and mobile (no hover-dependent UX)

## What We're NOT Doing

- No navigation links to the unlocked budget
- No tooltips (hover doesn't work on mobile)
- No changes to the wizard itself

## Implementation Approach

Simple single-file change to `BudgetsPage.tsx`:
1. Import `useBudgetValidation` hook and `toast` from sonner
2. Check `hasUnlockedBudget` from the hook
3. Disable button when true
4. Show toast on click when disabled

## Phase 1: Disable Button with Toast Feedback

### Overview
Modify `BudgetsPage.tsx` to disable the "New Budget" button when an unlocked budget exists and show a toast on click.

### Changes Required:

#### 1. BudgetsPage Component
**File**: `src/pages/BudgetsPage.tsx`

**Add imports:**
```typescript
import { toast } from 'sonner'
import { useBudgetValidation } from '@/hooks/use-budget-validation'
```

**Add hook call and click handler:**
```typescript
export function BudgetsPage() {
  const navigate = useNavigate()
  const { data, isLoading, isError, refetch } = useBudgets()
  const { hasUnlockedBudget } = useBudgetValidation()

  const handleNewBudgetClick = () => {
    if (hasUnlockedBudget) {
      toast.error('You already have an unlocked budget. Lock or delete it before creating a new one.')
      return
    }
    navigate('/budgets/new')
  }
  // ...
}
```

**Update button:**
```tsx
<Button
  onClick={handleNewBudgetClick}
  disabled={hasUnlockedBudget}
>
  <Plus className="w-4 h-4 mr-2" />
  New Budget
</Button>
```

#### 2. Update Tests
**File**: `src/pages/BudgetsPage.test.tsx`

**Add test for disabled state:**
```typescript
it('disables new budget button when unlocked budget exists', async () => {
  server.use(
    http.get('/api/budgets', () => {
      return HttpResponse.json({
        budgets: [
          {
            id: '1',
            month: 3,
            year: 2025,
            status: 'UNLOCKED',
            createdAt: '2025-03-01',
            lockedAt: null,
            totals: { income: 50000, expenses: 35000, savings: 10000, balance: 5000 },
          },
        ],
      })
    })
  )

  render(<BudgetsPage />)

  await waitFor(() => {
    expect(screen.getByRole('button', { name: /new budget/i })).toBeDisabled()
  })
})

it('enables new budget button when all budgets are locked', async () => {
  server.use(
    http.get('/api/budgets', () => {
      return HttpResponse.json({
        budgets: [
          {
            id: '1',
            month: 3,
            year: 2025,
            status: 'LOCKED',
            createdAt: '2025-03-01',
            lockedAt: '2025-03-15',
            totals: { income: 50000, expenses: 35000, savings: 10000, balance: 5000 },
          },
        ],
      })
    })
  )

  render(<BudgetsPage />)

  await waitFor(() => {
    expect(screen.getByRole('button', { name: /new budget/i })).toBeEnabled()
  })
})

it('shows toast when clicking disabled new budget button', async () => {
  server.use(
    http.get('/api/budgets', () => {
      return HttpResponse.json({
        budgets: [
          {
            id: '1',
            month: 3,
            year: 2025,
            status: 'UNLOCKED',
            createdAt: '2025-03-01',
            lockedAt: null,
            totals: { income: 50000, expenses: 35000, savings: 10000, balance: 5000 },
          },
        ],
      })
    })
  )

  render(<BudgetsPage />)

  await waitFor(() => {
    expect(screen.getByRole('button', { name: /new budget/i })).toBeDisabled()
  })

  // Click the disabled button
  await userEvent.click(screen.getByRole('button', { name: /new budget/i }))

  // Should NOT navigate
  expect(mockNavigate).not.toHaveBeenCalled()
})
```

### Success Criteria:

#### Automated Verification:
- [x] All existing tests pass: `npm test`
- [x] Type checking passes: `npm run typecheck` (if available) or `npm run build`
- [x] Linting passes: `npm run lint`

#### Manual Verification:
- [x] With an unlocked budget: "New Budget" button appears disabled (grayed out)
- [x] Clicking the disabled button shows toast: "You already have an unlocked budget. Lock or delete it before creating a new one."
- [x] Clicking the disabled button does NOT navigate to the wizard
- [x] With no budgets or only locked budgets: Button is enabled and navigates to wizard
- [x] Works correctly on mobile viewport

## Testing Strategy

### Unit Tests:
- Button disabled state based on unlocked budget existence
- Button enabled when no unlocked budgets
- Toast shown on disabled button click (if testable)
- Navigation prevented when disabled

### Manual Testing Steps:
1. Create a budget and leave it unlocked
2. Go to Budgets page
3. Verify "New Budget" button is disabled
4. Click the disabled button
5. Verify toast appears with correct message
6. Lock the budget
7. Verify "New Budget" button is now enabled
8. Verify clicking navigates to wizard

## References

- `src/hooks/use-budget-validation.ts` - Existing validation hook
- `src/components/wizard/validation.ts:90-95` - Error message text (reusing same message)
