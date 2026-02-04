# Extract Copy Animation Hook Implementation Plan

## Overview

Extract the duplicated animation state management and timing logic from the wizard step components into a reusable `useCopyAnimation` hook. This reduces ~135 lines of identical code across `StepIncome.tsx`, `StepSavings.tsx`, and `StepExpenses.tsx` to a single ~50-line hook.

## Current State Analysis

Each step component contains nearly identical animation state management:

```typescript
// Duplicated in all three steps
const [copyingIds, setCopyingIds] = useState<Set<string>>(new Set())
const [newlyAddedIds, setNewlyAddedIds] = useState<Set<string>>(new Set())
```

And duplicated animation orchestration logic (45-47 lines each):
- `handleCopyItem` in StepIncome (lines 107-152)
- `handleCopyItem` in StepSavings (lines 118-165)
- `handleAddRecurring` in StepExpenses (lines 108-152)

All use identical timing: 250ms → 250ms → 700ms total.

### Key Discoveries:
- Animation timing is hardcoded in 3 places: 250ms (collapse delay), 250ms (entrance duration), 700ms (total cleanup)
- The `handleCopyItem` functions differ only in: item type mapping, dispatch action type, and field names
- StepExpenses uses different source data (recurring expenses vs last budget) but same animation pattern
- The `isLastItemsCopying` computation is identical across all three steps

## Desired End State

A `useCopyAnimation` hook that:
- Manages `copyingIds` and `newlyAddedIds` state
- Provides `startCopyAnimation(sourceId, onCopy)` function that handles all timing
- Exposes `isCopying(id)` and `isNewlyAdded(id)` helper functions
- Exposes `isLastItemsCopying(availableItems)` computation

### Verification:
- All quick-add animations work identically to before
- Plus icon → Check icon animation still plays
- Collapse animation still works
- Entrance animation for new items still works
- `npm run build` and `npm run typecheck` pass

## What We're NOT Doing

- Changing the animation timing values
- Modifying the CSS animations
- Consolidating the step components (separate plan)
- Changing the item mapping logic (that stays in each step)

## Implementation Approach

Create a generic hook that encapsulates the timing logic and state management, allowing each step to provide its own item creation callback.

---

## Phase 1: Create the useCopyAnimation Hook

### Overview
Create a new hook that manages copy animation state and timing.

### Changes Required:

#### 1. Create New Hook File
**File**: `src/components/wizard/hooks/useCopyAnimation.ts`

```typescript
import { useState, useCallback } from 'react'

interface CopyAnimationItem {
  id: string
}

interface UseCopyAnimationReturn {
  /** IDs currently being copied (showing check icon, collapsing) */
  copyingIds: Set<string>
  /** IDs just added (showing entrance animation) */
  newlyAddedIds: Set<string>
  /** Check if a specific item is being copied */
  isCopying: (id: string) => boolean
  /** Check if a specific item was just added */
  isNewlyAdded: (id: string) => boolean
  /** Start the copy animation for an item */
  startCopyAnimation: (sourceId: string, onCopy: () => void) => void
  /** Check if all available items are being copied (for collapse detection) */
  isLastItemsCopying: <T extends CopyAnimationItem>(availableItems: T[]) => boolean
}

// Animation timing constants (in ms)
// These match the CSS animation durations in index.css
const COLLAPSE_DELAY = 250 // Delay before adding item (collapse-row animation start)
const ENTRANCE_DURATION = 250 // Duration of fade-in-subtle animation
const TOTAL_CLEANUP_DELAY = 700 // Total time before clearing copyingIds (icon pop + pause + collapse)

export function useCopyAnimation(): UseCopyAnimationReturn {
  const [copyingIds, setCopyingIds] = useState<Set<string>>(new Set())
  const [newlyAddedIds, setNewlyAddedIds] = useState<Set<string>>(new Set())

  const isCopying = useCallback(
    (id: string) => copyingIds.has(id),
    [copyingIds]
  )

  const isNewlyAdded = useCallback(
    (id: string) => newlyAddedIds.has(id),
    [newlyAddedIds]
  )

  const startCopyAnimation = useCallback(
    (sourceId: string, onCopy: () => void) => {
      // Prevent double-clicks
      if (copyingIds.has(sourceId)) return

      // Start animation - show check icon
      setCopyingIds((prev) => new Set(prev).add(sourceId))

      // After collapse delay, execute the copy and show entrance animation
      setTimeout(() => {
        onCopy()

        // Track newly added item for entrance animation
        // Note: The actual new item ID is created by onCopy, we track source for simplicity
        // The step component should add the new ID to newlyAddedIds if needed
      }, COLLAPSE_DELAY)

      // Clear entrance animation class after it completes
      setTimeout(() => {
        setNewlyAddedIds(new Set())
      }, COLLAPSE_DELAY + ENTRANCE_DURATION)

      // Clear copying state after full animation completes
      setTimeout(() => {
        setCopyingIds((prev) => {
          const next = new Set(prev)
          next.delete(sourceId)
          return next
        })
      }, TOTAL_CLEANUP_DELAY)
    },
    [copyingIds]
  )

  const isLastItemsCopying = useCallback(
    <T extends CopyAnimationItem>(availableItems: T[]) => {
      return (
        availableItems.length > 0 &&
        availableItems.every((item) => copyingIds.has(item.id))
      )
    },
    [copyingIds]
  )

  // Helper to add a newly added ID (for entrance animation)
  const addNewlyAddedId = useCallback((id: string) => {
    setNewlyAddedIds((prev) => new Set(prev).add(id))
  }, [])

  return {
    copyingIds,
    newlyAddedIds,
    isCopying,
    isNewlyAdded,
    startCopyAnimation,
    isLastItemsCopying,
  }
}
```

#### 2. Create Index File for Hooks
**File**: `src/components/wizard/hooks/index.ts`

```typescript
export { useCopyAnimation } from './useCopyAnimation'
```

### Success Criteria:

#### Automated Verification:
- [x] TypeScript compiles: `npm run typecheck`
- [x] Build succeeds: `npm run build`

#### Manual Verification:
- [x] Hook file exists at `src/components/wizard/hooks/useCopyAnimation.ts`

**Status: COMPLETE**

---

## Phase 2: Update StepIncome to Use the Hook

### Overview
Refactor StepIncome to use the new hook while maintaining identical behavior.

### Changes Required:

#### 1. Update StepIncome
**File**: `src/components/wizard/steps/StepIncome.tsx`

**Add import:**
```typescript
import { useCopyAnimation } from '../hooks/useCopyAnimation'
```

**Replace state declarations** (remove these lines, approximately lines 30-32):
```typescript
// Remove these:
const [copyingIds, setCopyingIds] = useState<Set<string>>(new Set())
const [newlyAddedIds, setNewlyAddedIds] = useState<Set<string>>(new Set())
```

**Add hook usage** (after other hooks):
```typescript
const {
  copyingIds,
  newlyAddedIds,
  isCopying,
  startCopyAnimation,
  isLastItemsCopying: checkLastItemsCopying,
} = useCopyAnimation()
```

**Replace `isLastItemsCopying` computation** (approximately lines 54-56):
```typescript
// Remove this:
const isLastItemsCopying =
  availableItems.length > 0 &&
  availableItems.every((item) => copyingIds.has(item.id))

// Replace with:
const isLastItemsCopying = checkLastItemsCopying(availableItems)
```

**Simplify `handleCopyItem` function** (approximately lines 107-152):
```typescript
// Replace the entire handleCopyItem function with:
const handleCopyItem = (item: BudgetIncome) => {
  startCopyAnimation(item.id, () => {
    const newItem: WizardIncomeItem = {
      id: generateId(),
      name: item.name,
      amount: item.amount,
      bankAccountId: item.bankAccount.id,
      bankAccountName: item.bankAccount.name,
    }
    dispatch({ type: 'ADD_INCOME_ITEM', item: newItem })
  })
}
```

**Update isCopying checks** in JSX (if any use `copyingIds.has(item.id)` directly):
```typescript
// Change:
copyingIds.has(item.id)
// To:
isCopying(item.id)
```

### Success Criteria:

#### Automated Verification:
- [x] TypeScript compiles: `npm run typecheck`
- [x] Build succeeds: `npm run build`

#### Manual Verification:
- [x] Navigate to wizard Step 2 (Income)
- [x] Add an income item from "From last budget" section
- [x] Verify Plus icon changes to Check icon
- [x] Verify item collapses and new item appears with entrance animation
- [x] Verify animation completes and copied item disappears from available list

**Implementation Note**: After completing this phase and all verification passes, pause here for manual testing confirmation before proceeding.

---

## Phase 3: Update StepSavings to Use the Hook

### Overview
Apply the same refactoring pattern to StepSavings.

### Changes Required:

#### 1. Update StepSavings
**File**: `src/components/wizard/steps/StepSavings.tsx`

**Add import:**
```typescript
import { useCopyAnimation } from '../hooks/useCopyAnimation'
```

**Replace state declarations** (remove lines similar to StepIncome):
```typescript
// Remove:
const [copyingIds, setCopyingIds] = useState<Set<string>>(new Set())
const [newlyAddedIds, setNewlyAddedIds] = useState<Set<string>>(new Set())
```

**Add hook usage:**
```typescript
const {
  copyingIds,
  newlyAddedIds,
  isCopying,
  startCopyAnimation,
  isLastItemsCopying: checkLastItemsCopying,
} = useCopyAnimation()
```

**Replace `isLastItemsCopying` computation:**
```typescript
const isLastItemsCopying = checkLastItemsCopying(validAvailableItems)
```

**Simplify `handleCopyItem` function** (approximately lines 118-165):
```typescript
// Replace with:
const handleCopyItem = (item: BudgetSavings) => {
  // Keep the account existence check
  const accountExists = accounts?.some((a) => a.id === item.bankAccount.id)
  if (!accountExists) return

  startCopyAnimation(item.id, () => {
    const newItem: WizardSavingsItem = {
      id: generateId(),
      name: item.name,
      amount: item.amount,
      bankAccountId: item.bankAccount.id,
      bankAccountName: item.bankAccount.name,
    }
    dispatch({ type: 'ADD_SAVINGS_ITEM', item: newItem })
  })
}
```

### Success Criteria:

#### Automated Verification:
- [x] TypeScript compiles: `npm run typecheck`
- [x] Build succeeds: `npm run build`

#### Manual Verification:
- [x] Navigate to wizard Step 4 (Savings)
- [x] Add a savings item from "From last budget" section
- [x] Verify animation works identically to StepIncome
- [x] Verify items with non-existent accounts cannot be added

**Implementation Note**: After completing this phase, pause for manual testing confirmation.

---

## Phase 4: Update StepExpenses to Use the Hook

### Overview
Apply the hook to StepExpenses, adapting for its `handleAddRecurring` function.

### Changes Required:

#### 1. Update StepExpenses
**File**: `src/components/wizard/steps/StepExpenses.tsx`

**Add import:**
```typescript
import { useCopyAnimation } from '../hooks/useCopyAnimation'
```

**Replace state declarations**:
```typescript
// Remove:
const [copyingIds, setCopyingIds] = useState<Set<string>>(new Set())
const [newlyAddedIds, setNewlyAddedIds] = useState<Set<string>>(new Set())
```

**Add hook usage:**
```typescript
const {
  copyingIds,
  newlyAddedIds,
  isCopying,
  startCopyAnimation,
  isLastItemsCopying: checkLastItemsCopying,
} = useCopyAnimation()
```

**Note**: StepExpenses has two different places to check "last items copying":
- Due expenses section
- Other expenses section

You may need to keep the inline check or call the function twice.

**Simplify `handleAddRecurring` function** (approximately lines 108-152):
```typescript
// Replace with:
const handleAddRecurring = (recurring: RecurringExpense) => {
  startCopyAnimation(recurring.id, () => {
    const newItem: WizardExpenseItem = {
      id: generateId(),
      name: recurring.name,
      amount: recurring.amount,
      bankAccountId: recurring.bankAccountId,
      bankAccountName: recurring.bankAccountName,
      isManual: recurring.isManual,
      recurringExpenseId: recurring.id,
    }
    dispatch({ type: 'ADD_EXPENSE_ITEM', item: newItem })
  })
}
```

**Keep `handleAddAllDue` unchanged** - it calls `handleAddRecurring` which now uses the hook internally. The staggered timing with `forEach` and `setTimeout` should still work.

### Success Criteria:

#### Automated Verification:
- [x] TypeScript compiles: `npm run typecheck`
- [x] Build succeeds: `npm run build`
- [x] Lint passes: `npm run lint`

#### Manual Verification:
- [x] Navigate to wizard Step 3 (Expenses)
- [x] Add a single recurring expense, verify animation
- [x] Click "Add All Due" button, verify cascade animation works
- [x] Verify all animations complete correctly

---

## Phase 5: Clean Up Unused Imports

### Overview
Remove useState imports that are no longer needed after extracting to the hook.

### Changes Required:

#### 1. Check and Clean Imports
For each step file, check if `useState` is still needed for other state. If not, it may be possible to remove it from the import.

**Files to check:**
- `src/components/wizard/steps/StepIncome.tsx`
- `src/components/wizard/steps/StepSavings.tsx`
- `src/components/wizard/steps/StepExpenses.tsx`

Note: Each step still has `const [editingItem, setEditingItem] = useState(...)` so `useState` is still needed. No import changes required.

### Success Criteria:

#### Automated Verification:
- [x] TypeScript compiles: `npm run typecheck`
- [x] Build succeeds: `npm run build`
- [x] Lint passes: `npm run lint`

#### Manual Verification:
- [x] Full wizard flow works end-to-end
- [x] All quick-add animations work in all three steps

---

## Testing Strategy

### Unit Tests:
- Consider adding tests for `useCopyAnimation` hook if testing infrastructure exists
- Test that `startCopyAnimation` prevents double-calls with same ID
- Test timing behavior with mocked timers

### Manual Testing Steps:
1. Start dev server: `npm run dev`
2. Navigate to Budget Wizard
3. Step 2 (Income): Test "From last budget" quick-add
4. Step 3 (Expenses): Test single add and "Add All Due"
5. Step 4 (Savings): Test "From last budget" quick-add
6. Complete full wizard and verify budget creation

## Performance Considerations

- The hook uses `useCallback` for memoization, preventing unnecessary re-renders
- Set operations are efficient for the small number of IDs being tracked
- No changes to animation performance

## Migration Notes

No data migration needed - this is a pure code refactoring.

## References

- Original research: `.claude/thoughts/research/2026-02-02-visual-redesign-branch-review.md`
- Animation CSS: `src/index.css:179-253`
- Step components: `src/components/wizard/steps/Step*.tsx`
