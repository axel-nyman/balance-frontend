# Inline Copy Income Redesign - Implementation Plan

## Overview

Redesign the "copy from last budget" feature for the income section of the budget wizard. Instead of a modal-based selection flow, items from the last budget appear inline in the same table with a separator row. Users click a plus button to copy items, which animate into the active section above.

## Current State Analysis

### Existing Components
- `StepIncome.tsx` - Main income step component with table-based editing
- `CopyFromLastBudgetModal.tsx` - Modal for selecting items to copy (will be removed)
- `useLastBudget` hook - Fetches most recent budget with full details (keep as-is)

### Current Flow
1. "Copy from Last Budget" button appears if a previous budget exists
2. Button opens modal with checkbox selection
3. User selects items → clicks Copy → items added to wizard state

### Key Discoveries
- Animation patterns use Tailwind CSS transitions (no Framer Motion)
- Standard durations: 200ms for quick, 300ms for content transitions
- Grid-based collapse animations exist in `WizardShell.tsx:122-126`
- `useLastBudget` hook already fetches full budget details

## Desired End State

### Visual Design
```
┌──────────────────────────────────────────────────────────────────┐
│ Name                  │ Account        │ Amount      │ Actions   │
├──────────────────────────────────────────────────────────────────┤
│ [Salary            ]  │ [Checking ▼]   │     50 000  │  🗑️       │ ← Active items
│ [Freelance         ]  │ [Savings  ▼]   │      5 000  │  🗑️       │    (editable)
├──────────────────────────────────────────────────────────────────┤
│ From last budget                                                  │ ← Separator
├──────────────────────────────────────────────────────────────────┤
│ Side Project          │ Checking       │      2 000  │  ➕       │ ← Available items
│ Bonus                 │ Savings        │     10 000  │  ➕       │    (read-only, grey)
└──────────────────────────────────────────────────────────────────┘
```

### Animation Flow
1. User clicks ➕ on "Side Project" row
2. Plus icon animates to ✓ (200ms)
3. Row text color transitions grey → black (200ms)
4. Row height collapses to 0 (300ms) with opacity fade
5. New editable row appears at bottom of active section with slide-down animation
6. Item is now in wizard state and fully editable

### Verification
- [ ] Last budget income items appear inline below separator
- [ ] Items already in wizard state don't appear in "available" section
- [ ] Plus button animates to checkmark on click
- [ ] Text color transitions from grey to black
- [ ] Row animates out of "available" section
- [ ] New editable row appears in active section
- [ ] Modal and "Copy from Last Budget" button are removed
- [ ] `useLastBudget` hook is reused directly in StepIncome

## What We're NOT Doing

- No changes to the savings step (future work if this pattern works well)
- No undo/toggle functionality - once copied, use trash to remove
- No changes to `useLastBudget` hook
- No batch selection - items are copied one at a time

## Implementation Approach

Use Tailwind CSS transitions with staged animations. Track "copying" state per item to orchestrate the multi-step animation sequence. Leverage `useLastBudget` directly in StepIncome instead of through the modal.

## Phase 1: Refactor StepIncome to Use useLastBudget Directly

### Overview
Remove modal integration and add direct `useLastBudget` usage. Show available items inline.

### Changes Required:

#### 1. Update StepIncome.tsx imports and state
**File**: `src/components/wizard/steps/StepIncome.tsx`

Remove modal-related code and add animation state:

```typescript
// Remove these lines:
// import { useState } from 'react'
// import { CopyFromLastBudgetModal } from '../CopyFromLastBudgetModal'

// Update imports:
import { useState, useMemo } from 'react'
import { Plus, Trash2, Check } from 'lucide-react'
import { useLastBudget } from '@/hooks/use-last-budget'
import { cn } from '@/lib/utils'

// Inside component, remove:
// const [showCopyModal, setShowCopyModal] = useState(false)

// Add:
const { lastBudget, isLoading: isLoadingLastBudget } = useLastBudget()
const [copyingIds, setCopyingIds] = useState<Set<string>>(new Set())
```

#### 2. Compute available items
**File**: `src/components/wizard/steps/StepIncome.tsx`

Add memoized computation of items available for copying:

```typescript
// After the existing hooks, add:
const availableItems = useMemo(() => {
  if (!lastBudget) return []
  const existingNames = new Set(
    state.incomeItems.map((i) => i.name.toLowerCase())
  )
  return lastBudget.income.filter(
    (item) => !existingNames.has(item.name.toLowerCase())
  )
}, [lastBudget, state.incomeItems])
```

#### 3. Add copy handler with animation
**File**: `src/components/wizard/steps/StepIncome.tsx`

Replace `handleCopyFromLast` with animated single-item handler:

```typescript
const handleCopyItem = (item: BudgetIncome) => {
  // Start animation
  setCopyingIds((prev) => new Set(prev).add(item.id))

  // After animation completes, add to state and cleanup
  setTimeout(() => {
    dispatch({
      type: 'ADD_INCOME_ITEM',
      item: {
        id: generateId(),
        name: item.name,
        amount: item.amount,
        bankAccountId: item.bankAccount.id,
        bankAccountName: item.bankAccount.name,
      },
    })
    setCopyingIds((prev) => {
      const next = new Set(prev)
      next.delete(item.id)
      return next
    })
  }, 500) // Match total animation duration
}
```

#### 4. Remove modal JSX and button
**File**: `src/components/wizard/steps/StepIncome.tsx`

Remove the header button and modal component:

```diff
- {lastBudget && (
-   <Button
-     variant="outline"
-     size="sm"
-     onClick={() => setShowCopyModal(true)}
-   >
-     <Copy className="w-4 h-4 mr-2" />
-     Copy from Last Budget
-   </Button>
- )}

// And at the bottom, remove:
- <CopyFromLastBudgetModal
-   open={showCopyModal}
-   onOpenChange={setShowCopyModal}
-   itemType="income"
-   onCopy={handleCopyFromLast}
- />
```

### Success Criteria:

#### Automated Verification:
- [x] TypeScript compiles without errors: `npm run build`
- [x] Linting passes: `npm run lint`

#### Manual Verification:
- [ ] StepIncome renders without errors
- [ ] `useLastBudget` data is accessible in component
- [ ] No modal appears anymore

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation before proceeding to Phase 2.

---

## Phase 2: Add Inline Available Items Section

### Overview
Render the "From last budget" separator and available items in the table.

### Changes Required:

#### 1. Add separator row and available items to table body
**File**: `src/components/wizard/steps/StepIncome.tsx`

Insert after the existing income items map, before `</TableBody>`:

```tsx
{/* Separator row - only show if there are available items */}
{availableItems.length > 0 && (
  <TableRow className="bg-gray-50 hover:bg-gray-50">
    <TableCell
      colSpan={4}
      className="py-2 text-xs font-medium text-gray-500 uppercase tracking-wide"
    >
      From last budget
    </TableCell>
  </TableRow>
)}

{/* Available items from last budget */}
{availableItems.map((item) => {
  const isCopying = copyingIds.has(item.id)
  return (
    <TableRow
      key={`available-${item.id}`}
      className={cn(
        'transition-all duration-300',
        isCopying && 'opacity-0 h-0 overflow-hidden'
      )}
    >
      <TableCell className="text-gray-400">
        {item.name}
      </TableCell>
      <TableCell className="text-gray-400">
        {item.bankAccount.name}
      </TableCell>
      <TableCell className="text-right text-gray-400">
        {formatCurrency(item.amount)}
      </TableCell>
      <TableCell>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleCopyItem(item)}
          disabled={isCopying}
          aria-label="Add item"
        >
          <div className="relative w-4 h-4">
            <Plus
              className={cn(
                'w-4 h-4 text-gray-400 absolute inset-0 transition-all duration-200',
                isCopying && 'opacity-0 rotate-90 scale-0'
              )}
            />
            <Check
              className={cn(
                'w-4 h-4 text-green-600 absolute inset-0 transition-all duration-200',
                !isCopying && 'opacity-0 -rotate-90 scale-0'
              )}
            />
          </div>
        </Button>
      </TableCell>
    </TableRow>
  )
})}
```

#### 2. Update empty state condition
**File**: `src/components/wizard/steps/StepIncome.tsx`

The empty state should only show when there are no active items AND no available items:

```diff
- {state.incomeItems.length === 0 ? (
+ {state.incomeItems.length === 0 && availableItems.length === 0 ? (
```

### Success Criteria:

#### Automated Verification:
- [x] TypeScript compiles without errors: `npm run build`
- [x] Linting passes: `npm run lint`

#### Manual Verification:
- [ ] Separator row appears when last budget has income items
- [ ] Available items appear in grey text below separator
- [ ] Plus button is visible on each available row
- [ ] Items already in wizard state don't appear in available section

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation before proceeding to Phase 3.

---

## Phase 3: Implement Full Animation Sequence

### Overview
Polish the animation to include icon morphing, color transition, and row collapse/slide effects.

### Changes Required:

#### 1. Update row animation with proper sequencing
**File**: `src/components/wizard/steps/StepIncome.tsx`

Enhance the available items row with grid-based height animation:

```tsx
{availableItems.map((item) => {
  const isCopying = copyingIds.has(item.id)
  return (
    <TableRow
      key={`available-${item.id}`}
      className="contents" // Use contents to allow grid animation
    >
      <td colSpan={4} className="p-0">
        <div
          className={cn(
            'grid transition-[grid-template-rows,opacity] duration-300 ease-out',
            isCopying ? 'grid-rows-[0fr] opacity-0' : 'grid-rows-[1fr] opacity-100'
          )}
        >
          <div className="overflow-hidden">
            <div className="flex items-center px-4 py-3 border-b border-gray-100">
              <div className="flex-1 min-w-0 grid grid-cols-[35%_30%_1fr_50px] items-center gap-0">
                <span
                  className={cn(
                    'transition-colors duration-200',
                    isCopying ? 'text-gray-900' : 'text-gray-400'
                  )}
                >
                  {item.name}
                </span>
                <span
                  className={cn(
                    'transition-colors duration-200',
                    isCopying ? 'text-gray-900' : 'text-gray-400'
                  )}
                >
                  {item.bankAccount.name}
                </span>
                <span
                  className={cn(
                    'text-right transition-colors duration-200',
                    isCopying ? 'text-gray-900' : 'text-gray-400'
                  )}
                >
                  {formatCurrency(item.amount)}
                </span>
                <div className="flex justify-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopyItem(item)}
                    disabled={isCopying}
                    aria-label="Add item"
                    className="h-8 w-8 p-0"
                  >
                    <div className="relative w-4 h-4">
                      <Plus
                        className={cn(
                          'w-4 h-4 text-gray-400 hover:text-gray-600 absolute inset-0 transition-all duration-200',
                          isCopying && 'opacity-0 rotate-90 scale-0'
                        )}
                      />
                      <Check
                        className={cn(
                          'w-4 h-4 text-green-600 absolute inset-0 transition-all duration-200',
                          !isCopying && 'opacity-0 -rotate-90 scale-0'
                        )}
                      />
                    </div>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </td>
    </TableRow>
  )
})}
```

### Success Criteria:

#### Automated Verification:
- [x] TypeScript compiles without errors: `npm run build`
- [x] Linting passes: `npm run lint`

#### Manual Verification:
- [ ] Clicking plus icon shows smooth rotation to checkmark
- [ ] Text color transitions from grey to black before row collapses
- [ ] Row height smoothly animates to zero
- [ ] Row fades out as it collapses
- [ ] New item appears in the active section after animation
- [ ] Animation feels smooth and professional (no jank)

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation before proceeding to Phase 4.

---

## Phase 4: Cleanup and Remove Unused Code

### Overview
Remove the modal component and any unused imports/code.

### Changes Required:

#### 1. Delete CopyFromLastBudgetModal component
**File**: `src/components/wizard/CopyFromLastBudgetModal.tsx`

Delete this entire file as it's no longer used.

#### 2. Remove unused import from StepIncome
**File**: `src/components/wizard/steps/StepIncome.tsx`

Ensure the Copy icon import is removed if not used elsewhere:

```diff
- import { Plus, Trash2, Copy } from 'lucide-react'
+ import { Plus, Trash2, Check } from 'lucide-react'
```

#### 3. Clean up header section
**File**: `src/components/wizard/steps/StepIncome.tsx`

Simplify the header since the button is gone:

```tsx
<div className="flex justify-between items-start">
  <div>
    <h2 className="text-lg font-semibold text-gray-900 mb-1">Income</h2>
    <p className="text-sm text-gray-500">
      Add your expected income sources for this month.
    </p>
  </div>
</div>
```

#### 4. Remove unused variables
**File**: `src/components/wizard/steps/StepIncome.tsx`

Remove the `lastBudget` variable from `useBudgets` since we now use `useLastBudget`:

```diff
- const { data: budgetsData } = useBudgets()
- // ... sorting code ...
- const lastBudget = sortedBudgets[0]
```

Also remove the unused `handleCopyFromLast` function (already replaced by `handleCopyItem`).

### Success Criteria:

#### Automated Verification:
- [x] TypeScript compiles without errors: `npm run build`
- [x] Linting passes: `npm run lint`
- [x] No unused variable warnings

#### Manual Verification:
- [x] `CopyFromLastBudgetModal.tsx` file no longer exists
- [ ] No modal appears in the UI
- [ ] All functionality still works correctly

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation before completing the task.

---

## Testing Strategy

### Manual Testing Steps:
1. Create a budget with 2-3 income items
2. Start creating a new budget
3. Navigate to Income step
4. Verify separator row shows "From last budget"
5. Verify available items appear in grey below separator
6. Click plus on an item - verify animation sequence
7. Verify item appears in active section as editable
8. Verify item disappears from available section
9. Add another item manually - verify it doesn't appear in available
10. Delete a copied item - verify it reappears in available section

### Edge Cases:
- No previous budgets → separator and available section don't appear
- Previous budget has no income → separator doesn't appear
- All previous items already added → separator disappears
- Rapid clicking → only one copy action should process

## Performance Considerations

- `useMemo` for `availableItems` prevents unnecessary recalculations
- CSS transitions are GPU-accelerated
- Single item copy instead of batch reduces complexity

## References

- Original research: `.claude/thoughts/research/2025-12-30-copy-from-last-budget-income.md`
- Animation patterns: `src/components/wizard/WizardShell.tsx:122-126` (grid-based collapse)
- `useLastBudget` hook: `src/hooks/use-last-budget.ts`
