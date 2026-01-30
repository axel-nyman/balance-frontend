# Table Header Padding Adjustment Plan

## Overview

Increase horizontal padding on table headers from `px-2` (8px) to `px-4` (16px) to provide better visual spacing when tables are contained in rounded containers (`rounded-2xl` = 28px border radius).

## Current State Analysis

The base `TableHead` component has `px-2` (8px) horizontal padding:

```tsx
// src/components/ui/table.tsx:66-77
function TableHead({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        "text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap ...",
        className
      )}
      {...props}
    />
  )
}
```

With 28px rounded corners, 8px padding puts header text uncomfortably close to the curved edges.

**Affected tables (all use `rounded-2xl` containers):**
- `src/components/accounts/AccountsList.tsx:66`
- `src/components/recurring-expenses/RecurringExpensesList.tsx:88`
- `src/components/wizard/steps/StepIncome.tsx:153`
- `src/components/wizard/steps/StepExpenses.tsx`
- `src/components/wizard/steps/StepSavings.tsx`

## Desired End State

- Table headers have `px-4` (16px) horizontal padding
- Header text has comfortable breathing room from rounded corners
- Consistent with custom row components which already use `px-4 py-3`

## What We're NOT Doing

- Not adding variant props or complex conditional styling
- Not changing vertical padding or height

## Implementation Approach

Single-line change to the `TableHead` component in the base UI table file.

## Phase 1: Update TableHead Padding

### Overview
Change the horizontal padding on `TableHead` from `px-2` to `px-4`.

### Changes Required:

#### 1. Update TableHead component
**File**: `src/components/ui/table.tsx`
**Line**: 71
**Change**: Replace `px-2` with `px-4`

```tsx
// Before
"text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap ..."

// After
"text-foreground h-10 px-4 text-left align-middle font-medium whitespace-nowrap ..."
```

### Success Criteria:

#### Automated Verification:
- [x] TypeScript compiles without errors: `npm run build`
- [x] Linting passes: `npm run lint`

#### Manual Verification:
- [x] Accounts page: "Name" header has comfortable spacing from left edge
- [x] Recurring Expenses page: headers align well with rounded corners
- [x] Budget Wizard (Income step): header spacing looks balanced
- [x] Budget Wizard (Expenses step): header spacing looks balanced
- [x] Budget Wizard (Savings step): header spacing looks balanced
- [x] No horizontal scrollbar appears unexpectedly on any table

**Note:** During implementation, we also updated `TableCell` from `p-2` to `px-4 py-2` to maintain consistent horizontal padding between headers and cells.

---

## Testing Strategy

### Manual Testing Steps:
1. Navigate to `/accounts` - verify header spacing in table
2. Navigate to `/recurring-expenses` - verify header spacing
3. Navigate to `/budgets/new` and proceed through wizard steps
4. On each step with a table, verify header text is not cramped against corners
5. Check that tables still fit within their containers (no overflow issues)

## References

- Research document: `.claude/thoughts/research/2026-01-29-table-border-radius-margins.md`
- Border radius variables: `src/index.css:21-28`
