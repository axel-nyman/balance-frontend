# Budget Section Hover Clipping Fix - Implementation Plan

## Overview

Fix the visual issue where hover backgrounds in the `BudgetSection` component on the budget detail page aren't clipped to the rounded corners of the container, causing the same visual artifact that was recently fixed in the base Table component.

## Current State Analysis

The `BudgetSection` component (`src/components/budget-detail/BudgetSection.tsx`) uses a Collapsible pattern with a custom `<ul>/<li>` structure instead of the Table component. It has `rounded-2xl` on the outer Collapsible, but no `overflow-hidden` to clip hover backgrounds.

### The Problem

When hovering over list items inside `BudgetSection`:
- The `hover:bg-accent` fills the entire `<li>` as a rectangle
- Without `overflow-hidden` on the rounded parent, this rectangle extends to the edges
- Creates a visual conflict with the `rounded-2xl` corners of the container

### Current Structure (lines 50-138)

```tsx
<Collapsible className="bg-card rounded-2xl shadow-sm">  // No overflow-hidden!
  <CollapsibleTrigger asChild>
    <div className="... hover:bg-accent rounded-t-2xl">  // Explicit rounded-t
      ...
    </div>
  </CollapsibleTrigger>
  <CollapsibleContent>
    <div className="border-t border-border">
      <ul className="divide-y divide-border">
        <li className="... hover:bg-accent">  // No clipping, no rounded corners
          ...
        </li>
      </ul>
      <button className="... hover:bg-accent ... rounded-b-2xl">  // Explicit rounded-b
        ...
      </button>
    </div>
  </CollapsibleContent>
</Collapsible>
```

The trigger and add button have explicit `rounded-t-2xl` and `rounded-b-2xl` respectively, but middle list items have no rounding and aren't clipped.

## Desired End State

When hovering over any row in the BudgetSection (header, list items, or add button), the hover background should be clipped to match the rounded corners of the container. This matches the fix applied to the base Table component.

### Verification

1. Navigate to `/budgets/:id` (any budget detail page)
2. Hover over the Income/Expenses/Savings section headers → top corners rounded
3. Hover over individual items in the middle → no clipping artifact
4. Hover over the "Add" button at the bottom → bottom corners rounded
5. Hover over the first item when section has items → should clip to rounded corners if at top of content area
6. Hover over the last item → should clip to rounded corners

## What We're NOT Doing

- Not converting BudgetSection to use the Table component (keeping the list structure)
- Not changing padding values (already consistent at `px-4`)
- Not changing the visual design or colors

## Implementation Approach

Add `overflow-hidden` to the Collapsible root element. This single change will clip all child hover backgrounds to the rounded corners, matching the pattern used in the Table component fix.

## Phase 1: Add Overflow Clipping

### Overview
Add `overflow-hidden` to the BudgetSection's Collapsible container.

### Changes Required:

#### 1. BudgetSection Component
**File**: `src/components/budget-detail/BudgetSection.tsx`
**Line**: 51

**Current code:**
```tsx
<Collapsible open={isOpen} onOpenChange={setIsOpen} className="bg-card rounded-2xl shadow-sm">
```

**New code:**
```tsx
<Collapsible open={isOpen} onOpenChange={setIsOpen} className="overflow-hidden bg-card rounded-2xl shadow-sm">
```

### Success Criteria:

#### Automated Verification:
- [ ] TypeScript compiles: `npm run build`
- [ ] Tests pass: `npm test`
- [ ] Linting passes: `npm run lint`

#### Manual Verification:
- [ ] Budget detail page: Hover over section header → top corners are rounded
- [ ] Budget detail page: Hover over middle list items → no clipping artifact visible
- [ ] Budget detail page: Hover over "Add" button → bottom corners are rounded
- [ ] Budget detail page: Hover over first/last items → corners match container
- [ ] Collapsible animation still works correctly when opening/closing sections
- [ ] All three sections (Income, Expenses, Savings) behave consistently

**Implementation Note**: After completing this phase and all automated verification passes, pause for manual confirmation that the visual fix works correctly.

---

## Testing Strategy

### Unit Tests:
- Existing `BudgetSection.test.tsx` tests should continue to pass (no behavioral changes)

### Manual Testing Steps:
1. Start dev server: `npm run dev`
2. Navigate to `/budgets` and select any budget
3. On the budget detail page, test each section:
   - Hover over "Income" header
   - Hover over individual income items
   - Hover over "Add income" button
   - Repeat for Expenses and Savings sections
4. Toggle sections open/closed to verify animation still works
5. Test empty state: Create a budget with no items in a section, verify the empty state hover also clips correctly

## Performance Considerations

None - this is a CSS-only change with no runtime impact.

## Rollback Plan

If issues arise, revert the single class change in `src/components/budget-detail/BudgetSection.tsx` by removing `overflow-hidden` from the Collapsible className.

## References

- Table hover fix plan: `.claude/thoughts/plans/2026-01-30-table-hover-border-radius-fix.md`
- Table padding plan: `.claude/thoughts/plans/2026-01-30-table-header-padding.md`
- Research document: `.claude/thoughts/research/2026-01-29-table-border-radius-margins.md`
- BudgetSection component: `src/components/budget-detail/BudgetSection.tsx`
