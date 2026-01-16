# Fix Wizard Copy Items Horizontal Stacking Bug

## Overview

Fix a layout bug in the budget creation wizard where items from the previous budget (available for copying) are incorrectly stacked horizontally instead of vertically when there are multiple items.

## Current State Analysis

The bug occurs in both `StepIncome.tsx` and `StepSavings.tsx` components when rendering the "From last budget" items.

### Key Discoveries:

- **StepIncome.tsx:271-274** - The `<TableRow>` for available items has `className="contents"`
- **StepSavings.tsx:344-347** - Same issue with `className="contents"`

### Root Cause:

The CSS property `display: contents` causes the `<tr>` element to be removed from the layout tree. Its children (`<td>` elements) become direct children of the `<tbody>`. When multiple available items exist, their `<td>` cells all become siblings in the same implicit row, causing horizontal stacking.

```tsx
// Current (buggy) code:
<TableRow
  key={`available-${item.id}`}
  className="contents"  // <-- This is the problem
>
  <td colSpan={4} className="p-0">
    ...
  </td>
</TableRow>
```

## Desired End State

Items from the previous budget should stack vertically, each in its own table row, matching the visual design of the current budget items above them.

### Verification:
1. Open the budget wizard with a previous budget that has 2+ income items
2. The "From last budget" items should appear in a vertical list
3. Same verification for the savings step

## What We're NOT Doing

- No changes to the collapse animation logic
- No changes to the copy functionality
- No structural changes to the table layout

## Implementation Approach

Simply remove `className="contents"` from the TableRow components. The animation and styling will continue to work because:
1. The inner `<div>` elements already handle the collapse animation via `grid-rows-[1fr]` and `animate-collapse-row`
2. The `<td colSpan={4}>` spans the full width regardless of the `<tr>` display property

## Phase 1: Fix Layout Bug

### Overview
Remove the problematic `className="contents"` from both affected components.

### Changes Required:

#### 1. StepIncome.tsx
**File**: `src/components/wizard/steps/StepIncome.tsx`
**Line**: 271-274
**Changes**: Remove `className="contents"` from TableRow

```tsx
// Before:
<TableRow
  key={`available-${item.id}`}
  className="contents"
>

// After:
<TableRow
  key={`available-${item.id}`}
>
```

#### 2. StepSavings.tsx
**File**: `src/components/wizard/steps/StepSavings.tsx`
**Line**: 344-347
**Changes**: Remove `className="contents"` from TableRow

```tsx
// Before:
<TableRow
  key={`available-${item.id}`}
  className="contents"
>

// After:
<TableRow
  key={`available-${item.id}`}
>
```

### Success Criteria:

#### Automated Verification:
- [x] TypeScript compiles: `npm run build`
- [x] Tests pass: `npm test`
- [x] Linting passes: `npm run lint`

#### Manual Verification:
- [x] With a previous budget containing 2+ income items, items stack vertically in the Income step
- [x] With a previous budget containing 2+ savings items, items stack vertically in the Savings step
- [x] Copy animation still works (green highlight, checkmark, collapse)
- [x] No visual regressions in the wizard tables

## Testing Strategy

### Unit Tests:
- Existing tests should continue to pass
- No new tests needed as this is a CSS fix

### Manual Testing Steps:
1. Ensure there's a previous budget with multiple income items (2+)
2. Go to `/budgets/new`
3. On the Income step, verify "From last budget" items are vertically stacked
4. Click copy on one item - verify animation works
5. Repeat for Savings step

## References

- Bug location: `src/components/wizard/steps/StepIncome.tsx:273`
- Bug location: `src/components/wizard/steps/StepSavings.tsx:346`
- Table component: `src/components/ui/table.tsx`
