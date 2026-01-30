# Table Hover Border Radius Fix - Implementation Plan

## Overview

Fix the visual issue where table row hover backgrounds have square corners that clip into the rounded corners of their container, creating an awkward visual effect when hovering over the first/last rows or headers.

## Current State Analysis

### The Problem

Tables are wrapped in containers with `rounded-2xl` (28px border radius), but when hovering over rows, the hover background color (`hover:bg-accent` or `hover:bg-muted/50`) extends as a rectangle to the full width of the table. Since there's no clipping, this rectangular hover background visually conflicts with the rounded corners of the outer container.

### Root Cause

The Table component (`src/components/ui/table.tsx:5-18`) wraps the `<table>` in a `<div>` with `overflow-x-auto` but no `overflow-hidden` and no border radius. The outer wrapper provides rounded corners, but the inner table content isn't clipped to those corners.

```tsx
// Current implementation
<div className="relative w-full overflow-x-auto">
  <table>...</table>
</div>
```

### Affected Locations

All tables in the app are affected:
- `src/components/accounts/AccountsList.tsx:66` - Bank accounts table
- `src/components/recurring-expenses/RecurringExpensesList.tsx:88` - Recurring expenses table
- `src/components/wizard/steps/StepIncome.tsx:153` - Budget wizard income step
- `src/components/wizard/steps/StepExpenses.tsx:336` - Budget wizard expenses step
- `src/components/wizard/steps/StepSavings.tsx:225` - Budget wizard savings step

## Desired End State

When hovering over any table row (including first/last rows and headers), the hover background color should be clipped to match the rounded corners of the table's container. The effect should be seamless - no visible gap or overflow at the corners.

### Verification

1. Navigate to Bank Accounts page → hover over first and last rows → hover background should have rounded corners matching the container
2. Navigate to Recurring Expenses page → same verification
3. Navigate to Budget Wizard (Income/Expenses/Savings steps) → hover over header row and last data row → corners should be rounded

## What We're NOT Doing

- Not changing the border radius values (keeping `rounded-2xl`)
- Not modifying individual row components
- Not changing hover colors
- Not adding horizontal scrolling support (not currently needed)

## Implementation Approach

Modify the base Table component to inherit the border radius from its parent and clip overflow. This is a single-line change that fixes all tables automatically.

## Phase 1: Fix Table Component

### Overview
Update the Table component's container div to inherit border radius and clip overflow.

### Changes Required:

#### 1. Table Component
**File**: `src/components/ui/table.tsx`
**Lines**: 7-10

**Current code:**
```tsx
<div
  data-slot="table-container"
  className="relative w-full overflow-x-auto"
>
```

**New code:**
```tsx
<div
  data-slot="table-container"
  className="relative w-full overflow-hidden rounded-[inherit]"
>
```

**Explanation:**
- `overflow-hidden` - Clips content (including hover backgrounds) to the container's bounds
- `rounded-[inherit]` - Inherits the border radius from the parent element (e.g., the `rounded-2xl` wrapper)
- Removes `overflow-x-auto` - Horizontal scrolling is not needed for any current tables

### Success Criteria:

#### Automated Verification:
- [ ] TypeScript compiles: `npm run build`
- [ ] Tests pass: `npm test`
- [ ] Linting passes: `npm run lint`

#### Manual Verification:
- [ ] Bank Accounts page: Hover first row → top corners are rounded
- [ ] Bank Accounts page: Hover last row → bottom corners are rounded
- [ ] Bank Accounts page: Hover header row → top corners are rounded
- [ ] Recurring Expenses page: Same verification as above
- [ ] Budget Wizard Income step: Hover header and footer rows → corners match container
- [ ] Budget Wizard Expenses step: Same verification
- [ ] Budget Wizard Savings step: Same verification
- [ ] Budget Detail page sections: Hover behavior is correct

**Implementation Note**: After completing this phase and all automated verification passes, pause for manual confirmation that the visual fix works correctly across all affected pages.

---

## Testing Strategy

### Unit Tests:
- Existing tests should continue to pass (no behavioral changes)

### Manual Testing Steps:
1. Start dev server: `npm run dev`
2. Navigate to `/accounts` - hover over each row, verify rounded corners on first/last
3. Navigate to `/recurring-expenses` - same verification
4. Navigate to `/budgets/new` - go through wizard steps, hover rows in each table
5. Navigate to an existing budget detail page - verify any table sections

## Performance Considerations

None - this is a CSS-only change with no runtime impact.

## Rollback Plan

If issues arise, revert the single line change in `src/components/ui/table.tsx` back to:
```tsx
className="relative w-full overflow-x-auto"
```

## References

- Research document: `.claude/thoughts/research/2026-01-29-table-border-radius-margins.md`
- Table component: `src/components/ui/table.tsx`
