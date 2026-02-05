# Unify Desktop Quick-Add Rendering Implementation Plan

## Overview

Refactor StepIncome and StepSavings to use `WizardItemCard` for desktop quick-add item rendering, matching the pattern already used in StepExpenses. This eliminates ~120 lines of duplicated manual table row rendering.

## Current State Analysis

### The Problem
StepExpenses uses `WizardItemCard` component via `renderQuickAddItem()`, while StepIncome and StepSavings manually render quick-add items as custom table rows with ~60 lines of inline JSX each.

### Current Implementation:

**StepExpenses (the clean pattern):**
- `StepExpenses.tsx:186-212` - `renderQuickAddItem()` function
- Uses `WizardItemCard variant="quick-add"` component
- Clean, declarative, ~25 lines

**StepIncome (manual rendering):**
- `StepIncome.tsx:244-308` - inline `.map()` with manual table row JSX
- ~65 lines of duplicated structure

**StepSavings (manual rendering):**
- `StepSavings.tsx:318-383` - nearly identical to StepIncome
- ~65 lines of duplicated structure

### Key Discoveries:
- StepIncome and StepSavings manual rendering is 95% identical (only grid column widths differ)
- The `WizardItemCard` quick-add variant renders as a standalone card, not a table row
- Mobile views already use `WizardItemCard` successfully for quick-add items
- To unify, we need to either:
  - A) Change desktop to use card layout (like StepExpenses does)
  - B) Add table row rendering capability to WizardItemCard

**Recommended approach: Option A** - Convert desktop quick-add sections to use card layout instead of table rows. This matches StepExpenses, enables full `WizardItemCard` reuse, and the visual difference is minimal (cards vs table rows for the "From last budget" section).

## Desired End State

StepIncome and StepSavings use `WizardItemCard` for desktop quick-add items, matching StepExpenses pattern. The "From last budget" section displays as cards instead of table rows.

### Verification:
- No inline table row rendering for quick-add items in StepIncome or StepSavings
- `renderQuickAddItem` helper function exists in both components
- Quick-add items render as cards with collapse animation
- Visual appearance is consistent with StepExpenses

## What We're NOT Doing

- Changing the main items table (only quick-add section)
- Modifying WizardItemCard component
- Changing mobile rendering (already uses cards)
- Extracting "From last budget" section header (separate plan)

## Implementation Approach

Replace the inline table row rendering with a `renderQuickAddItem` function that uses `WizardItemCard`, similar to StepExpenses. The quick-add section will render as cards below the main table.

## Phase 1: Refactor StepIncome Quick-Add Rendering

### Overview
Replace the manual table row rendering in StepIncome with WizardItemCard-based card rendering.

### Changes Required:

#### 1. Add renderQuickAddItem Helper Function
**File**: `src/components/wizard/steps/StepIncome.tsx`
**Add after line ~180** (near other helper functions)

```tsx
const renderQuickAddItem = (item: BudgetIncome) => {
  const isCopying = copyingIds.has(item.id)

  return (
    <div
      key={`available-${item.id}`}
      className={cn(
        'grid overflow-hidden rounded-xl shadow-card',
        isCopying ? 'animate-collapse-row' : 'grid-rows-[1fr]'
      )}
    >
      <div className="overflow-hidden min-h-0">
        <WizardItemCard
          variant="quick-add"
          name={item.name}
          amount={item.amount}
          bankAccountName={item.bankAccount.name}
          amountColorClass="text-income"
          onQuickAdd={() => handleCopyItem(item)}
          isCopying={isCopying}
        />
      </div>
    </div>
  )
}
```

#### 2. Replace Desktop Table Row Rendering
**File**: `src/components/wizard/steps/StepIncome.tsx`
**Lines**: ~222-308 (the separator row + availableItems.map section)

**Before (simplified):**
```tsx
{/* Inside TableBody, after main items */}
{/* Separator row */}
{availableItems.length > 0 && (
  <TableRow className="bg-muted hover:bg-muted">
    {/* ... separator content ... */}
  </TableRow>
)}
{/* Manual table row rendering for each item */}
{availableItems.map((item) => {
  const isCopying = copyingIds.has(item.id)
  return (
    <TableRow key={`available-${item.id}`}>
      <td colSpan={4} className="p-0">
        {/* ~50 lines of manual rendering */}
      </td>
    </TableRow>
  )
})}
```

**After:**
```tsx
{/* Inside TableBody, remove the separator row and availableItems.map */}
{/* (These will move outside the Table) */}
```

**Add after the closing `</Table>` tag (still inside the desktop `hidden md:block` div):**
```tsx
{/* From last budget section - quick-add cards */}
{availableItems.length > 0 && (
  <div
    className={cn(
      'grid overflow-hidden mt-4',
      isLastItemsCopying ? 'animate-collapse-row' : 'grid-rows-[1fr]'
    )}
  >
    <div className="overflow-hidden min-h-0 space-y-3">
      <div className="py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
        From last budget
      </div>
      <div className="space-y-2">
        {availableItems.map(renderQuickAddItem)}
      </div>
    </div>
  </div>
)}
```

### Success Criteria:

#### Automated Verification:
- [x] No linting errors: `npm run lint`
- [x] Type checking passes: `npm run typecheck`
- [x] Build succeeds: `npm run build`

#### Manual Verification:
- [ ] Open wizard on desktop, navigate to Income step
- [ ] "From last budget" section displays below the main table as cards
- [ ] Click quick-add button on an item - check animation plays
- [ ] Item collapses after animation completes
- [ ] When all items copied, section header collapses

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation that the Income step works correctly before proceeding to Savings.

---

## Phase 2: Refactor StepSavings Quick-Add Rendering

### Overview
Apply the same pattern to StepSavings.

### Changes Required:

#### 1. Add renderQuickAddItem Helper Function
**File**: `src/components/wizard/steps/StepSavings.tsx`
**Add after line ~200** (near other helper functions)

```tsx
const renderQuickAddItem = (item: BudgetSavings) => {
  const isCopying = copyingIds.has(item.id)

  return (
    <div
      key={`available-${item.id}`}
      className={cn(
        'grid overflow-hidden rounded-xl shadow-card',
        isCopying ? 'animate-collapse-row' : 'grid-rows-[1fr]'
      )}
    >
      <div className="overflow-hidden min-h-0">
        <WizardItemCard
          variant="quick-add"
          name={item.name}
          amount={item.amount}
          bankAccountName={item.bankAccount.name}
          amountColorClass="text-savings"
          onQuickAdd={() => handleCopyItem(item)}
          isCopying={isCopying}
        />
      </div>
    </div>
  )
}
```

#### 2. Replace Desktop Table Row Rendering
**File**: `src/components/wizard/steps/StepSavings.tsx`
**Lines**: ~296-383 (the separator row + validAvailableItems.map section)

Same transformation as StepIncome:
1. Remove separator row and `validAvailableItems.map` from inside `TableBody`
2. Add the card-based "From last budget" section after the `</Table>` tag

```tsx
{/* From last budget section - quick-add cards */}
{validAvailableItems.length > 0 && (
  <div
    className={cn(
      'grid overflow-hidden mt-4',
      isLastItemsCopying ? 'animate-collapse-row' : 'grid-rows-[1fr]'
    )}
  >
    <div className="overflow-hidden min-h-0 space-y-3">
      <div className="py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
        From last budget
      </div>
      <div className="space-y-2">
        {validAvailableItems.map(renderQuickAddItem)}
      </div>
    </div>
  </div>
)}
```

### Success Criteria:

#### Automated Verification:
- [ ] No linting errors: `npm run lint`
- [ ] Type checking passes: `npm run typecheck`
- [ ] Build succeeds: `npm run build`

#### Manual Verification:
- [ ] Open wizard on desktop, navigate to Savings step
- [ ] "From last budget" section displays below the main table as cards
- [ ] Click quick-add button on an item - check animation plays
- [ ] Item collapses after animation completes
- [ ] When all items copied, section header collapses

---

## Testing Strategy

### Automated Tests:
- Existing tests should pass (behavior unchanged, only visual structure)

### Manual Testing Steps:
1. Open budget wizard on desktop viewport (>768px)
2. **Income step:**
   - Verify "From last budget" section shows as cards below table
   - Add a quick-add item, verify animation sequence (check icon, then collapse)
   - Add all items, verify section collapses
3. **Savings step:**
   - Same verification as Income step
4. **Expenses step:**
   - Verify it still works the same (no changes made)
5. **Mobile viewport:**
   - Verify all three steps still work correctly (unchanged)

## Visual Comparison

### Before (StepIncome/StepSavings desktop):
```
┌─────────────────────────────────────────────┐
│ Name          │ Account    │ Amount │  ⚙   │  <- Table
├─────────────────────────────────────────────┤
│ Salary        │ Checking   │ 30,000 │  ⚙   │
├─────────────────────────────────────────────┤
│        FROM LAST BUDGET (separator row)     │  <- Inside table
├─────────────────────────────────────────────┤
│ Bonus         │ Checking   │  5,000 │  +   │  <- Table row
└─────────────────────────────────────────────┘
```

### After (matches StepExpenses pattern):
```
┌─────────────────────────────────────────────┐
│ Name          │ Account    │ Amount │  ⚙   │  <- Table
├─────────────────────────────────────────────┤
│ Salary        │ Checking   │ 30,000 │  ⚙   │
└─────────────────────────────────────────────┘

FROM LAST BUDGET                                  <- Section header
┌─────────────────────────────────────────────┐
│ Bonus                          5,000 kr   + │  <- Card
└─────────────────────────────────────────────┘
```

## Performance Considerations

None - same number of DOM elements, same animations. Minor reduction in inline JSX complexity.

## Migration Notes

This is a visual change for desktop quick-add sections. Users will see cards instead of table rows for "From last budget" items. This matches the mobile experience and StepExpenses desktop experience.

## References

- Research document: `.claude/thoughts/research/2026-02-04-visual-redesign-branch-quality-review.md`
- StepExpenses pattern: `src/components/wizard/steps/StepExpenses.tsx:186-212`
- WizardItemCard component: `src/components/wizard/WizardItemCard.tsx`
