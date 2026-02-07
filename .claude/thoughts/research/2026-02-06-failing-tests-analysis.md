---
date: 2026-02-06T07:17:00+01:00
researcher: Claude
git_commit: e4f581867a686328659f17835c86fe303d7d0620
branch: main
repository: balance-frontend
topic: "Failing tests analysis and connected code"
tags: [research, tests, collapse-animation, quick-add, wizard]
status: complete
last_updated: 2026-02-06
last_updated_by: Claude
---

# Research: Failing Tests Analysis

**Date**: 2026-02-06T07:17:00+01:00
**Researcher**: Claude
**Git Commit**: e4f581867a686328659f17835c86fe303d7d0620
**Branch**: main
**Repository**: balance-frontend

## Research Question

There are failing tests in the codebase. Research all code connected to these failures.

## Summary

Running `npm test` reveals **6 failing test files with 15 failed tests**:

| Test File | Failed | Total | Primary Issues |
|-----------|--------|-------|----------------|
| SavingsItemModal.test.tsx | 1 | 8 | API mock/async timing |
| StepSavings.test.tsx | 4 | 24 | "From last budget" display timing |
| StepExpenses.test.tsx | 4 | 25 | Quick Add collapse timing |
| WizardIntegration.test.tsx | 1 | 3 | React Query + act() warnings |
| EditBudgetItemModal.test.tsx | 2 | 17 | Quick Add collapse/expand |
| AccountSelect.test.tsx | 3 | 18 | Combobox async behavior |

The failures share a common theme: **animation timing and async state management** around the collapse/expand functionality.

## Detailed Findings

### 1. SavingsItemModal Component

**Files:**
- `src/components/budget-detail/SavingsItemModal.tsx`
- `src/components/budget-detail/SavingsItemModal.test.tsx`

**Failing Test:**
- "calls API to create savings" (line 67-97)

**Test Flow:**
1. Types "Emergency Fund" into name field
2. Types "5000" into amount field
3. Opens combobox via `getByRole('combobox', { name: /account/i })`
4. Clicks option "Checking" via `getByRole('option', { name: 'Checking' })`
5. Clicks Save button
6. Expects modal to close and API to receive correct payload

**Component Implementation:**
- Uses React Hook Form with Zod validation (`zodResolver(savingsItemSchema)`)
- Mutations: `useAddSavings(budgetId)` at line 28, `useUpdateSavings(budgetId)` at line 29
- AccountSelect updates form via `setValue('bankAccountId', accountId)` at line 131

**API Functions:**
- `addSavings()` at `src/api/budgets.ts:70-72`: POST to `/budgets/${budgetId}/savings`
- `updateSavings()` at `src/api/budgets.ts:74-76`: PUT to `/budgets/${budgetId}/savings/${savingsId}`

### 2. StepSavings Component

**Files:**
- `src/components/wizard/steps/StepSavings.tsx`
- `src/components/wizard/steps/StepSavings.test.tsx`

**Failing Tests:**
- "shows 'From last budget' section when previous budget exists" (line 336-378)
- "copies savings item when clicking add button" (line 380-428)
- "copied item is removed from available list after animation" (line 430-483)
- "filters out savings with deleted bank accounts" (line 498-545)

**Component Architecture:**
- Uses `useWizard()` context for state management (line 28)
- Uses `useLastBudget()` hook for fetching previous budget savings (line 30)
- Uses `useCopyAnimation()` hook for managing copy animation state (lines 32-37)

**"From Last Budget" Implementation:**

Desktop (lines 297-384):
```tsx
{validAvailableItems.length > 0 && (
  <TableRow> {/* Separator with "FROM LAST BUDGET" header */}
    <div className={cn(
      'grid overflow-hidden',
      isLastItemsCopying ? 'animate-collapse-row' : 'grid-rows-[1fr]'
    )}>
```

Mobile (lines 429-466):
```tsx
{validAvailableItems.length > 0 && (
  <div className={cn(
    'grid overflow-hidden',
    isLastItemsCopying ? 'animate-collapse-row' : 'grid-rows-[1fr]'
  )}>
    <div className="py-2 text-xs ...">FROM LAST BUDGET</div>
    {validAvailableItems.map((item) => (
      <CollapseWrapper isCollapsing={copyingIds.has(item.id)} withSpacing>
        <WizardItemCard variant="quick-add" ... />
      </CollapseWrapper>
    ))}
```

**Animation Flow:**
1. User clicks Plus button → `handleCopyItem(item)` called (line 119-136)
2. `startCopyAnimation(sourceId, callback)` begins
3. Immediately: Add to `copyingIds` → check icon pops, collapse starts
4. After 250ms: Callback fires → new item added to wizard state
5. After 500ms: Remove from `copyingIds` → item removed from available list

**Test Expectations (line 374-377):**
```tsx
await waitFor(() => {
  expect(screen.getByText(/from last budget/i)).toBeInTheDocument()
  expect(screen.getByText('Emergency Fund')).toBeInTheDocument()
})
```

### 3. StepExpenses Component

**Files:**
- `src/components/wizard/steps/StepExpenses.tsx`
- `src/components/wizard/steps/StepExpenses.test.tsx`

**Failing Tests:**
- "shows quick add panel when recurring expenses exist" (line 168-187)
- "adds recurring expense when clicking quick add button" (line 225-248)
- "removes item from quick add list after adding" (line 250-278)
- "shows 'all added' message when all recurring expenses are added" (line 286-311)

**Quick Add Section Structure (lines 256-300):**
```tsx
<div className={cn(
  'grid overflow-hidden',
  isLastItemsCopying ? 'animate-collapse-row' : 'grid-rows-[1fr]'
)}>
  <div className="overflow-hidden min-h-0 space-y-4 pb-1">
    {dueExpenses.length > 0 && (
      <div>
        <div className="flex justify-between">
          <span>DUE THIS MONTH</span>
          <Button>Add All ({count})</Button>
        </div>
        {dueExpenses.map((exp, index) =>
          renderQuickAddItem(exp, index > 0)
        )}
      </div>
    )}
    {otherExpenses.length > 0 && (
      <div>
        <span>Other recurring</span>
        {otherExpenses.map((exp, index) =>
          renderQuickAddItem(exp, index > 0)
        )}
      </div>
    )}
  </div>
</div>
```

**renderQuickAddItem Function (lines 187-210):**
```tsx
const renderQuickAddItem = (recurring: RecurringExpense, withSpacing = true) => {
  const isCopying = copyingIds.has(recurring.id)
  return (
    <CollapseWrapper
      key={recurring.id}
      isCollapsing={isCopying}
      withSpacing={withSpacing}
      className="rounded-xl shadow-card"
    >
      <WizardItemCard
        variant="quick-add"
        onQuickAdd={() => handleAddRecurring(recurring)}
        isCopying={isCopying}
        ...
      />
    </CollapseWrapper>
  )
}
```

**All Added Message (lines 302-307):**
```tsx
{recurringExpenses.length > 0 && availableRecurring.length === 0 && (
  <p className="text-sm text-muted-foreground text-center py-4 animate-fade-in-subtle">
    All recurring expenses have been added.
  </p>
)}
```

### 4. WizardIntegration Tests

**File:**
- `src/components/wizard/WizardIntegration.test.tsx`

**Failing Test:**
- "completes full wizard flow and saves budget" (line 76-145)

**Test Flow:**
1. Render WizardProvider + WizardShell
2. Step 1: Wait for Continue button enabled, click Continue
3. Step 2: Add income item via `addIncomeItem('Salary', '50000')` helper
4. Wait for Continue enabled, click Continue
5. Steps 3-4: Click Continue (expenses/savings optional)
6. Step 5: Verify review content, click "Create Draft"
7. Wait for `mockNavigate` to be called with `/budgets/new-budget-123`

**act() Warning Sources:**

1. **React Query on mount**: Multiple queries fire when wizard renders:
   - StepMonthYear (line 73): `useBudgets()` query
   - StepIncome (line 28): `useAccounts()` query
   - StepIncome (line 29): `useLastBudget()` - fires TWO queries

2. **useEffect dispatches in StepMonthYear**:
   - Lines 79-88: Sets default month/year
   - Lines 91-101: Checks if budget exists

3. **Radix Select interactions**: The `addIncomeItem` helper interacts with Select dropdown which uses portals and internal state.

### 5. EditBudgetItemModal Component

**File:**
- `src/components/budget-detail/EditBudgetItemModal.test.tsx`

**Failing Tests:**
- "shows quick add recurring expense options"
- Tests related to expanding collapse section

**Note:** The "quick-add recurring expense" functionality in budget detail pages follows a similar collapse pattern to wizard steps.

### 6. AccountSelect Component

**File:**
- `src/components/accounts/AccountSelect.test.tsx`

**Failing Tests:**
- Related to combobox async behavior and dropdown interactions

## CollapseWrapper Component

**File:** `src/components/wizard/CollapseWrapper.tsx`

**Implementation:**
```tsx
export function CollapseWrapper({
  isCollapsing,
  withSpacing = false,
  className,
  children,
}: CollapseWrapperProps) {
  const animationClass = isCollapsing
    ? withSpacing
      ? 'animate-collapse-row-with-spacing'
      : 'animate-collapse-row'
    : 'grid-rows-[1fr]'

  return (
    <div className={cn(
      'grid overflow-hidden',
      animationClass,
      withSpacing && !isCollapsing && 'mt-3',
      className
    )}>
      <div className="overflow-hidden min-h-0">
        {children}
      </div>
    </div>
  )
}
```

**Key Logic:**
- When `isCollapsing=true` + `withSpacing=true`: Uses `animate-collapse-row-with-spacing`
- When `isCollapsing=true` + `withSpacing=false`: Uses `animate-collapse-row`
- When `isCollapsing=false`: Uses `grid-rows-[1fr]` (expanded)
- Only applies `mt-3` when NOT collapsing AND withSpacing is true

## CSS Animations

**File:** `src/index.css`

**collapse-row (lines 220-241):**
```css
@keyframes collapse-row {
  0% {
    grid-template-rows: 1fr;
    opacity: 1;
  }
  100% {
    grid-template-rows: 0fr;
    opacity: 0;
  }
}

.animate-collapse-row {
  animation: collapse-row 250ms ease-out 250ms forwards;
}
```

**collapse-row-with-spacing (lines 243-258):**
```css
@keyframes collapse-row-with-spacing {
  0% {
    grid-template-rows: 1fr;
    opacity: 1;
    margin-top: 0.75rem;
  }
  100% {
    grid-template-rows: 0fr;
    opacity: 0;
    margin-top: 0;
  }
}

.animate-collapse-row-with-spacing {
  animation: collapse-row-with-spacing 250ms ease-out 250ms forwards;
}
```

**Timing:**
- **250ms delay** before animation starts
- **250ms duration** for the collapse
- **Total: 500ms** from trigger to completion

## Animation Timing Constants

**File:** `src/components/wizard/constants/animations.ts`

```typescript
export const POP_CHECK_DURATION = 200        // Check icon bounce
export const COLLAPSE_DURATION = 250         // CSS collapse animation
export const COLLAPSE_DELAY = 250            // Delay before collapse
export const ENTRANCE_DURATION = 250         // Fade-in for new item
export const COPY_ACTION_DELAY = 250         // When to execute copy
export const ENTRANCE_CLEANUP_DELAY = 500    // 250 + 250
export const TOTAL_ANIMATION_DURATION = 500  // 250 + 250
export const CASCADE_STAGGER_DELAY = 100     // "Add All" stagger
```

## useCopyAnimation Hook

**File:** `src/components/wizard/hooks/useCopyAnimation.ts`

**State Management:**
- `copyingIds: Set<string>` - IDs currently showing check icon and collapsing
- `newlyAddedIds: Set<string>` - IDs just added showing entrance fade

**Animation Sequence (lines 50-86):**
```typescript
const startCopyAnimation = (sourceId: string, onCopy: (newId: string) => void) => {
  if (copyingIds.has(sourceId)) return  // Prevent double-clicks

  // T+0ms: Start animation
  setCopyingIds(prev => new Set(prev).add(sourceId))

  // T+250ms: Execute copy action
  setTimeout(() => {
    const newId = generateId()
    setNewlyAddedIds(prev => new Set(prev).add(newId))
    onCopy(newId)
  }, COPY_ACTION_DELAY)

  // T+500ms: Clean up entrance animation
  setTimeout(() => {
    setNewlyAddedIds(prev => { /*remove newId*/ })
  }, ENTRANCE_CLEANUP_DELAY)

  // T+500ms: Clean up copying state
  setTimeout(() => {
    setCopyingIds(prev => { /*remove sourceId*/ })
  }, TOTAL_ANIMATION_DURATION)
}
```

## Code References

- `src/components/budget-detail/SavingsItemModal.tsx:28-29` - Mutation hooks
- `src/components/budget-detail/SavingsItemModal.tsx:131` - AccountSelect setValue
- `src/components/wizard/steps/StepSavings.tsx:32-37` - useCopyAnimation setup
- `src/components/wizard/steps/StepSavings.tsx:119-136` - handleCopyItem
- `src/components/wizard/steps/StepSavings.tsx:297-316` - From last budget separator
- `src/components/wizard/steps/StepExpenses.tsx:187-210` - renderQuickAddItem
- `src/components/wizard/steps/StepExpenses.tsx:256-300` - Quick add section
- `src/components/wizard/CollapseWrapper.tsx:27-54` - Collapse component
- `src/components/wizard/hooks/useCopyAnimation.ts:50-86` - Animation sequence
- `src/components/wizard/constants/animations.ts:14-43` - Timing constants
- `src/index.css:220-258` - CSS keyframe animations

## Architecture Documentation

### Collapse Animation Pattern

The codebase uses a CSS Grid-based collapse system:

1. **Outer wrapper**: `grid overflow-hidden` with animation class
2. **Inner wrapper**: `overflow-hidden min-h-0` enables grid collapse
3. **Animation**: `grid-template-rows: 1fr → 0fr` with opacity fade

### State-Driven Animations

- Boolean state (`isCollapsing`, `isCopying`) controls animation classes
- No CSS transitions on classes - uses `@keyframes` with `forwards` fill mode
- JavaScript timeouts synchronized with CSS timing constants

### Two Animation Variants

1. **Without spacing**: `animate-collapse-row` - just collapses content
2. **With spacing**: `animate-collapse-row-with-spacing` - also animates margin-top from 0.75rem to 0

## Historical Context (from thoughts/)

No existing research documents directly address these test failures. Related documents:
- `.claude/thoughts/plans/collapse-animation-gap-bug.md` - Previous research on collapse animation issues

## Related Research

- Previous commit `e4f5818` mentions "animate margin during quick-add collapse for smooth transitions"
- This suggests recent work on the collapse animation system that may have introduced timing changes

## Open Questions

1. Are the test timeouts (1000ms) sufficient for the 500ms animation duration?
2. Should tests use fake timers to control animation timing?
3. Is React Testing Library's `waitFor` polling interval (50ms default) causing race conditions?
4. Are Radix UI components' internal state updates causing act() warnings?
5. Should MSW response timing be explicitly controlled in tests?
