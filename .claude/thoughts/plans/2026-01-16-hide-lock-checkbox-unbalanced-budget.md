# Hide Lock Checkbox for Unbalanced Budgets Implementation Plan

## Overview

When creating a budget in the wizard, the "Lock budget after saving" checkbox should only be visible when the budget is balanced (income - expenses - savings = 0). Additionally, the "Create Budget" button should display "Create Draft" when the budget is unbalanced, indicating that the budget will be saved as a draft that can be locked later.

## Current State Analysis

### Key Files:
- `src/components/wizard/steps/StepReview.tsx:153-166` - Lock checkbox (always visible)
- `src/components/wizard/WizardNavigation.tsx:49` - "Create Budget" button text (static)
- `src/components/wizard/WizardShell.tsx:136-139` - Passes `lockAfterSave` props to StepReview
- `src/lib/utils.ts:87-89` - `isBudgetBalanced()` function already exists

### Current Behavior:
1. The lock checkbox is always visible regardless of balance state
2. The button always says "Create Budget" (or "Creating..." when submitting)
3. Balance calculation already happens in StepReview using `calculateBudgetTotals()`
4. `balanceInfo.isBalanced` is already computed but only used for display styling

## Desired End State

After implementation:
1. The "Lock budget after saving" checkbox is **hidden** when `balance !== 0`
2. The "Lock budget after saving" checkbox is **visible** when `balance === 0`
3. The create button shows "Create Draft" when budget is unbalanced
4. The create button shows "Create Budget" when budget is balanced
5. Creating an unbalanced budget still works (saves as draft)
6. The `lockAfterSave` state should be reset to `false` if user makes budget unbalanced after checking the box

### Verification:
- Create a budget with income > expenses + savings → checkbox hidden, button says "Create Draft"
- Create a budget with income < expenses + savings → checkbox hidden, button says "Create Draft"
- Create a budget with income = expenses + savings → checkbox visible, button says "Create Budget"
- Toggle balance by editing amounts → checkbox and button text update dynamically

## What We're NOT Doing

- No backend changes (backend already validates balance before locking)
- No changes to the lock functionality itself
- No changes to the balance calculation logic
- No new API calls or validation

## Implementation Approach

The balance is already calculated in StepReview. We need to:
1. Lift the `isBalanced` state up to WizardShell so it can be passed to WizardNavigation
2. Pass `isBalanced` to WizardNavigation for button text
3. Pass `isBalanced` to StepReview for conditional checkbox rendering
4. Auto-uncheck `lockAfterSave` when budget becomes unbalanced

## Phase 1: Update WizardNavigation Component

### Overview
Add an `isBalanced` prop to control the button text.

### Changes Required:

#### 1. WizardNavigation.tsx
**File**: `src/components/wizard/WizardNavigation.tsx`
**Changes**: Add `isBalanced` prop and use it for button text

```tsx
interface WizardNavigationProps {
  currentStep: number
  canProceed: boolean
  isSubmitting?: boolean
  isBalanced?: boolean  // Add this
  onBack: () => void
  onNext: () => void
  onSave?: () => void
}

export function WizardNavigation({
  currentStep,
  canProceed,
  isSubmitting = false,
  isBalanced = true,  // Add this with default
  onBack,
  onNext,
  onSave,
}: WizardNavigationProps) {
```

And update the button text (around line 49):
```tsx
{isSubmitting ? 'Creating...' : isBalanced ? 'Create Budget' : 'Create Draft'}
```

### Success Criteria:

#### Automated Verification:
- [x] TypeScript compiles without errors: `npm run build`
- [x] Existing tests pass: `npm test`

#### Manual Verification:
- [ ] Button text changes based on `isBalanced` prop value

---

## Phase 2: Update StepReview Component

### Overview
Add `isBalanced` prop and conditionally render the lock checkbox.

### Changes Required:

#### 1. StepReview.tsx
**File**: `src/components/wizard/steps/StepReview.tsx`
**Changes**: Add `isBalanced` prop and wrap checkbox in conditional

Update interface (line 16-19):
```tsx
interface StepReviewProps {
  lockAfterSave: boolean
  onLockAfterSaveChange: (checked: boolean) => void
  isBalanced: boolean  // Add this
}
```

Update component signature (line 21):
```tsx
export function StepReview({ lockAfterSave, onLockAfterSaveChange, isBalanced }: StepReviewProps) {
```

Wrap checkbox section (lines 152-166) in conditional:
```tsx
{/* Lock option - only show when balanced */}
{isBalanced && (
  <>
    <div className="flex items-center space-x-2">
      <Checkbox
        id="lockAfterSave"
        checked={lockAfterSave}
        onCheckedChange={(checked) => onLockAfterSaveChange(checked === true)}
      />
      <Label htmlFor="lockAfterSave" className="text-sm font-normal cursor-pointer">
        Lock budget after saving
      </Label>
    </div>
    <p className="text-xs text-gray-500 -mt-4">
      Locking applies savings to account balances and creates a payment todo list.
      You can always lock later from the budget detail page.
    </p>
  </>
)}
```

Note: Remove the internal `balanceInfo` calculation since `isBalanced` will be passed as a prop. The balance display styling can still use the local calculation, or we can pass `balanceInfo` as well. For simplicity, keep the local calculation for display but use the prop for conditional rendering.

### Success Criteria:

#### Automated Verification:
- [x] TypeScript compiles without errors: `npm run build`
- [x] Existing tests pass: `npm test`

#### Manual Verification:
- [ ] Checkbox hidden when `isBalanced={false}`
- [ ] Checkbox visible when `isBalanced={true}`

---

## Phase 3: Update WizardShell Component

### Overview
Calculate `isBalanced` in WizardShell and pass it to both StepReview and WizardNavigation. Also reset `lockAfterSave` when budget becomes unbalanced.

### Changes Required:

#### 1. WizardShell.tsx
**File**: `src/components/wizard/WizardShell.tsx`
**Changes**: Import balance utilities, calculate isBalanced, pass to children, reset lockAfterSave

Add import (around line 8):
```tsx
import { calculateBudgetTotals, isBudgetBalanced } from '@/lib/utils'
```

Add balance calculation after line 21 (after `lockAfterSave` state):
```tsx
// Calculate if budget is balanced
const { balance } = calculateBudgetTotals(
  state.incomeItems,
  state.expenseItems,
  state.savingsItems
)
const isBalanced = isBudgetBalanced(balance)

// Reset lockAfterSave if budget becomes unbalanced
useEffect(() => {
  if (!isBalanced && lockAfterSave) {
    setLockAfterSave(false)
  }
}, [isBalanced, lockAfterSave])
```

Update StepReview props (around line 136-139):
```tsx
<StepReview
  lockAfterSave={lockAfterSave}
  onLockAfterSaveChange={setLockAfterSave}
  isBalanced={isBalanced}
/>
```

Update WizardNavigation props (around line 193-200):
```tsx
<WizardNavigation
  currentStep={state.currentStep}
  canProceed={isStepValid(state.currentStep)}
  isSubmitting={state.isSubmitting}
  isBalanced={isBalanced}
  onBack={handleBack}
  onNext={handleNext}
  onSave={handleSave}
/>
```

### Success Criteria:

#### Automated Verification:
- [x] TypeScript compiles without errors: `npm run build`
- [x] All tests pass: `npm test`
- [x] Linting passes: `npm run lint`

#### Manual Verification:
- [x] With balanced budget: checkbox visible, button says "Create Budget"
- [x] With unbalanced budget (positive balance): checkbox hidden, button says "Create Draft"
- [x] With unbalanced budget (negative balance): checkbox hidden, button says "Create Draft"
- [x] Checking lock checkbox then making budget unbalanced → checkbox disappears and unchecks
- [x] Creating draft budget works correctly

---

## Testing Strategy

### Unit Tests:
Update existing test files to cover new props:

1. **WizardNavigation.test.tsx**: Add tests for `isBalanced` prop affecting button text
2. **StepReview.test.tsx**: Add tests for checkbox visibility based on `isBalanced` prop

### Manual Testing Steps:
1. Start budget wizard, add income of 10,000 kr
2. Add expenses of 5,000 kr → verify checkbox hidden, button says "Create Draft"
3. Add savings of 5,000 kr → verify checkbox appears, button says "Create Budget"
4. Check the lock checkbox
5. Remove 1,000 kr from savings → verify checkbox disappears (and unchecks)
6. Add 1,000 kr back to savings → verify checkbox reappears (unchecked)
7. Create a draft budget (unbalanced) → verify it saves correctly
8. Create a locked budget (balanced with checkbox checked) → verify it locks correctly

## Performance Considerations

None - the balance calculation is already happening in StepReview, we're just moving/duplicating it to WizardShell. The calculation is O(n) where n is the number of items, which is negligible.

## References

- Balance calculation: `src/lib/utils.ts:65-89`
- Current checkbox implementation: `src/components/wizard/steps/StepReview.tsx:153-166`
- Current button implementation: `src/components/wizard/WizardNavigation.tsx:43-50`
