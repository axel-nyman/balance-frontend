# Recurring Expense API Migration — Implementation Plan

## Overview

The backend has replaced the old timestamp-based due date model (`lastUsedDate`, `nextDueDate`, `isDue`) with a month-based model (`dueMonth`, `dueYear`, `dueDisplay`). This plan migrates the frontend to use the new fields across the recurring expenses page, budget wizard, and all tests.

## Current State Analysis

The `RecurringExpense` interface in `src/api/types.ts:84-95` has three fields that no longer exist in the API:
- `lastUsedDate: string | null` — removed
- `nextDueDate: string | null` — removed
- `isDue: boolean` — removed

These are consumed by:
- `DueStatusIndicator.tsx` — renders 3 visual states using all 3 old fields
- `RecurringExpenseRow.tsx:25-29` — passes old fields to DueStatusIndicator
- `RecurringExpenseCard.tsx:28-32` — passes old fields to DueStatusIndicator
- `RecurringExpensesList.tsx:26-45` — `sortExpenses()` uses `isDue`, `lastUsedDate`, `nextDueDate`
- `EditRecurringExpenseModal.tsx:93-102, 177-188` — shows "Last used" and "Next due" info
- `StepExpenses.tsx:73-87` — splits recurring expenses into "Due this month" / "Other recurring" using `isDue`
- `WizardItemCard.tsx:12, 54-57` — receives `isDue` boolean prop (no change needed, parent derives it)
- MSW handlers and 5 test files — mock data uses old fields

## Desired End State

After this plan is complete:
1. `RecurringExpense` type uses `dueMonth`, `dueYear`, `dueDisplay` instead of the 3 removed fields
2. Recurring expenses list page shows due status using `dueDisplay` and `dueMonth`/`dueYear` compared to current month
3. Budget wizard compares `dueMonth`/`dueYear` against the wizard's target month/year
4. All tests pass with updated mock data and assertions
5. `npm run build` succeeds with no type errors

### Key Discoveries:
- Wizard state already has `month` and `year` in `WizardState` (`src/components/wizard/types.ts:43-44`)
- `monthYearToNumber()` util exists at `src/lib/utils.ts:119` for chronological comparison
- `getCurrentMonthYear()` util exists at `src/lib/utils.ts:157` for getting current month/year
- `WizardItemCard` already receives a boolean `isDue` prop — parent computes it, no change needed to the card

## What We're NOT Doing

- No changes to budget detail page (it uses `BudgetExpense` type, not `RecurringExpense`)
- No changes to `WizardItemCard.tsx` (it already receives computed `isDue` boolean)
- No changes to `CreateRecurringExpenseModal.tsx` (doesn't use due fields)
- No changes to wizard state/reducer/context
- No new utility functions — existing `getCurrentMonthYear()` and `monthYearToNumber()` suffice
- No localization of `dueDisplay` — using the API value as-is

## Implementation Approach

Single phase — all changes are tightly coupled (type change cascades everywhere). The changes are mechanical and low-risk.

## Phase 1: Full Migration

### Overview
Update the type definition, all consuming components, sort logic, and all tests in one pass.

### Changes Required:

#### 1. Type Definition
**File**: `src/api/types.ts`
**Lines**: 84-95

Replace the three removed fields with the three new fields:

```typescript
export interface RecurringExpense {
  id: string
  name: string
  amount: number
  recurrenceInterval: RecurrenceInterval
  isManual: boolean
  bankAccount: BankAccountSummary | null
  dueMonth: number | null
  dueYear: number | null
  dueDisplay: string | null
  createdAt: string
}
```

#### 2. DueStatusIndicator Component
**File**: `src/components/recurring-expenses/DueStatusIndicator.tsx`

Change props to accept the new fields. The component keeps its 3 visual states:
1. **Never used** (yellow) — `dueMonth === null`
2. **Due now** (red) — `dueMonth`/`dueYear` matches current calendar month
3. **Future** (green + `dueDisplay` text) — everything else

```typescript
import { getCurrentMonthYear } from '@/lib/utils'

interface DueStatusIndicatorProps {
  dueMonth: number | null
  dueYear: number | null
  dueDisplay: string | null
}

export function DueStatusIndicator({ dueMonth, dueYear, dueDisplay }: DueStatusIndicatorProps) {
  // Never used
  if (dueMonth === null) {
    return (
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-warning" aria-hidden="true" />
        <span className="text-sm text-muted-foreground">Never used</span>
      </div>
    )
  }

  // Due now — matches current calendar month
  const { month: currentMonth, year: currentYear } = getCurrentMonthYear()
  if (dueMonth === currentMonth && dueYear === currentYear) {
    return (
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-expense" aria-hidden="true" />
        <span className="text-sm font-medium text-expense">Due now</span>
      </div>
    )
  }

  // Future due date
  if (dueDisplay) {
    return (
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-income" aria-hidden="true" />
        <span className="text-sm text-muted-foreground">{dueDisplay}</span>
      </div>
    )
  }

  return null
}
```

Note: Remove the `formatMonthYear` import since we use `dueDisplay` directly.

#### 3. RecurringExpenseRow — Prop Passing
**File**: `src/components/recurring-expenses/RecurringExpenseRow.tsx`
**Lines**: 25-29

Update the DueStatusIndicator props:

```typescript
<DueStatusIndicator
  dueMonth={expense.dueMonth}
  dueYear={expense.dueYear}
  dueDisplay={expense.dueDisplay}
/>
```

#### 4. RecurringExpenseCard — Prop Passing
**File**: `src/components/recurring-expenses/RecurringExpenseCard.tsx`
**Lines**: 28-32

Same update:

```typescript
<DueStatusIndicator
  dueMonth={expense.dueMonth}
  dueYear={expense.dueYear}
  dueDisplay={expense.dueDisplay}
/>
```

#### 5. RecurringExpensesList — Sort Logic
**File**: `src/components/recurring-expenses/RecurringExpensesList.tsx`
**Lines**: 26-45

Rewrite `sortExpenses()` using the new fields. Due status is determined by comparing to current month:

```typescript
import { getCurrentMonthYear, monthYearToNumber } from '@/lib/utils'

function sortExpenses(expenses: RecurringExpense[]): RecurringExpense[] {
  const { month: currentMonth, year: currentYear } = getCurrentMonthYear()

  return [...expenses].sort((a, b) => {
    const aIsDue = a.dueMonth === currentMonth && a.dueYear === currentYear
    const bIsDue = b.dueMonth === currentMonth && b.dueYear === currentYear

    // Never used items (yellow) come after due items but before not-due items
    const aScore = aIsDue ? 0 : a.dueMonth === null ? 1 : 2
    const bScore = bIsDue ? 0 : b.dueMonth === null ? 1 : 2

    if (aScore !== bScore) return aScore - bScore

    // Within same category, sort by due month/year
    if (a.dueMonth != null && a.dueYear != null && b.dueMonth != null && b.dueYear != null) {
      return monthYearToNumber(a.dueMonth, a.dueYear) - monthYearToNumber(b.dueMonth, b.dueYear)
    }

    // Items without due month come last
    if (a.dueMonth == null) return 1
    if (b.dueMonth == null) return -1

    return 0
  })
}
```

Add imports: `getCurrentMonthYear`, `monthYearToNumber` from `@/lib/utils`.

#### 6. EditRecurringExpenseModal — Info Display
**File**: `src/components/recurring-expenses/EditRecurringExpenseModal.tsx`

**6a. Remove `getNextDueDisplay()` function** (lines 93-102).

Replace with simpler logic: if `dueDisplay` exists, show it; if `dueMonth === null`, show "Never used".

**6b. Update the read-only info section** (lines 176-188).

Remove the "Last used" row entirely. Simplify "Next due":

```typescript
{/* Read-only info */}
<div className="p-3 bg-muted rounded-xl space-y-1 text-sm">
  <div className="flex justify-between">
    <span className="text-muted-foreground">Next due:</span>
    <span className="text-foreground">
      {expense?.dueDisplay ?? 'Never used'}
    </span>
  </div>
</div>
```

**6c. Remove unused imports**: `formatDate` and `formatMonthYear` from `@/lib/utils` (keep only if used elsewhere in the file — `formatMonthYear` is only used in `getNextDueDisplay` which is being removed, `formatDate` is only used for `lastUsedDate` which is being removed).

#### 7. StepExpenses — Budget-Relative Due Check
**File**: `src/components/wizard/steps/StepExpenses.tsx`
**Lines**: 73-87

Replace `isDue` with a comparison against the wizard's target month/year. The wizard state already has `state.month` and `state.year`.

**7a. Update the sort and filter logic** (lines 73-87):

```typescript
// Filter and sort recurring expenses: due first, then by name
const availableRecurring = useMemo(() => {
  return recurringExpenses
    .filter(
      (exp) =>
        !addedRecurringExpenseIds.has(exp.id) || copyingIds.has(exp.id)
    )
    .sort((a, b) => {
      const aIsDue = a.dueMonth === state.month && a.dueYear === state.year
      const bIsDue = b.dueMonth === state.month && b.dueYear === state.year
      if (aIsDue !== bIsDue) return aIsDue ? -1 : 1
      return a.name.localeCompare(b.name)
    })
}, [recurringExpenses, addedRecurringExpenseIds, copyingIds, state.month, state.year])

// Separate into due and not due
const dueExpenses = availableRecurring.filter(
  (exp) => exp.dueMonth === state.month && exp.dueYear === state.year
)
const otherExpenses = availableRecurring.filter(
  (exp) => !(exp.dueMonth === state.month && exp.dueYear === state.year)
)
```

**7b. Update `renderQuickAddItem`** (line 202):

The `isDue` prop passed to `WizardItemCard` must be computed:

```typescript
<WizardItemCard
  variant="quick-add"
  name={recurring.name}
  amount={recurring.amount}
  bankAccountName={recurring.bankAccount?.name ?? ''}
  isDue={recurring.dueMonth === state.month && recurring.dueYear === state.year}
  isManual={recurring.isManual}
  amountColorClass="text-expense"
  onQuickAdd={() => handleAddRecurring(recurring)}
  isCopying={isCopying}
/>
```

#### 8. MSW Mock Handler
**File**: `src/test/mocks/handlers.ts`
**Line**: 40

Update mock recurring expense data:

```typescript
{ id: '1', name: 'Rent', amount: 8000, recurrenceInterval: 'MONTHLY', isManual: true, bankAccount: { id: '1', name: 'Checking' }, dueMonth: 2, dueYear: 2026, dueDisplay: 'February', createdAt: '2025-01-01T00:00:00Z' },
```

#### 9. Test Files — Mock Data Updates

**9a. `DueStatusIndicator.test.tsx`**

Update all test cases to use new props:

- "Never used": `dueMonth={null} dueYear={null} dueDisplay={null}`
- "Due now": `dueMonth={currentMonth} dueYear={currentYear} dueDisplay="February"` (use `getCurrentMonthYear()` to get dynamic values)
- "Not due yet": `dueMonth={6} dueYear={2025} dueDisplay="June 2025"`

The "not due yet" test currently asserts `screen.getByText(/juni 2025/i)` which used Swedish locale via `formatMonthYear`. With `dueDisplay` from the API (English), change assertion to match the `dueDisplay` value: `screen.getByText('June 2025')`.

**9b. `RecurringExpensesList.test.tsx`**

Update `mockExpenses` array (lines 8-44):

```typescript
const mockExpenses: RecurringExpense[] = [
  {
    id: '1',
    name: 'Rent',
    amount: 8000,
    recurrenceInterval: 'MONTHLY',
    isManual: true,
    bankAccount: { id: '1', name: 'Checking' },
    dueMonth: <currentMonth>,
    dueYear: <currentYear>,
    dueDisplay: '<current month name>',
    createdAt: '2025-01-01',
  },
  {
    id: '2',
    name: 'Car Insurance',
    amount: 3000,
    recurrenceInterval: 'BIANNUALLY',
    isManual: false,
    bankAccount: null,
    dueMonth: 7,
    dueYear: 2025,
    dueDisplay: 'July 2025',
    createdAt: '2025-01-01',
  },
  {
    id: '3',
    name: 'New Subscription',
    amount: 100,
    recurrenceInterval: 'MONTHLY',
    isManual: false,
    bankAccount: null,
    dueMonth: null,
    dueYear: null,
    dueDisplay: null,
    createdAt: '2025-01-01',
  },
]
```

Use `getCurrentMonthYear()` to make the "due now" expense dynamically match the current month, so the test doesn't break over time.

**9c. `EditRecurringExpenseModal.test.tsx`**

Update `mockExpense` (lines 9-20):

```typescript
const mockExpense: RecurringExpense = {
  id: '123',
  name: 'Rent',
  amount: 8000,
  recurrenceInterval: 'MONTHLY',
  isManual: true,
  bankAccount: null,
  dueMonth: 3,
  dueYear: 2025,
  dueDisplay: 'March 2025',
  createdAt: '2025-01-01',
}
```

Update test assertions:
- Remove test "shows last used and next due dates" — "Last used" row no longer exists. Replace with a test that checks for "Next due" only.
- Remove test "shows 'Never' for last used when null" — no longer applicable.
- Update test "shows 'Never used' for next due when never used": use `dueMonth: null, dueYear: null, dueDisplay: null`.
- Update test "shows 'Due now' when expense is due": this test (`line 169-174`) currently sets `isDue: true`. Replace with `dueMonth: <currentMonth>, dueYear: <currentYear>, dueDisplay: '<month name>'` and assert "Due now" text (because DueStatusIndicator will show "Due now" via the edit modal's `getNextDueDisplay()` equivalent). **However**, the edit modal shows `dueDisplay` directly, not the DueStatusIndicator. So "Due now" won't appear in the modal — it will show `dueDisplay` value. Update this test to check for the `dueDisplay` value instead, or check for "Next due:" label with the display value.

**9d. `DeleteRecurringExpenseDialog.test.tsx`**

Update `mockExpense` (lines 9-20):

```typescript
const mockExpense: RecurringExpense = {
  id: '123',
  name: 'Netflix',
  amount: 169,
  recurrenceInterval: 'MONTHLY',
  isManual: false,
  bankAccount: null,
  dueMonth: 3,
  dueYear: 2025,
  dueDisplay: 'March 2025',
  createdAt: '2025-01-01',
}
```

No assertion changes needed — this dialog only displays the expense name, not due fields.

**9e. `StepExpenses.test.tsx`**

Update all inline mock recurring expense data in `server.use()` calls throughout the file (lines 169-404). Replace `isDue`, `lastUsedDate`, `nextDueDate` with `dueMonth`, `dueYear`, `dueDisplay`.

For the "due" tests to work, the mock data must have `dueMonth`/`dueYear` matching the wizard's target month. Since the wizard starts with `month: null, year: null`, we need to either:
- Set the wizard month/year before testing due behavior, OR
- Use `null` month/year and accept that nothing is "due" when month isn't set

The simplest approach: update the `WizardWithIncome` helper to also set month/year, or create a separate helper. For tests that check "due this month" / "other recurring" grouping, the wizard needs a target month set.

Add a new helper `WizardWithMonthAndIncome` that dispatches `SET_MONTH_YEAR` with a known month (e.g., month=2, year=2026), then set mock recurring expenses with `dueMonth: 2, dueYear: 2026` to be "due".

Update these specific tests:
- "shows quick-add section when recurring expenses exist" (line 168): set one expense with matching month, one without
- "shows 'Due' badge on due recurring expenses" (line 189): set matching dueMonth/dueYear
- "groups due expenses separately from other recurring" (line 386): set one matching, one not matching

### Success Criteria:

#### Automated Verification:
- [x] TypeScript compilation passes: `npx tsc --noEmit`
- [x] All tests pass: `npm test`
- [x] Build succeeds: `npm run build`

#### Manual Verification:
- [x] Recurring expenses list page shows correct due status indicators (never used / due now / future month)
- [x] Edit modal shows "Next due" with `dueDisplay` value, no "Last used" row
- [x] Budget wizard groups recurring expenses correctly into "Due this month" / "Other recurring" based on the wizard's target month
- [x] Quick-add cards show "Due" badge for expenses matching the wizard's target month

## Testing Strategy

### Unit Tests:
- DueStatusIndicator: 3 states (never used, due now, future) with correct colored dots
- RecurringExpensesList: sorting with new fields, due items first
- EditRecurringExpenseModal: shows dueDisplay, handles null case
- StepExpenses: due/other grouping based on wizard month/year

### Edge Cases:
- `dueMonth` is null (never used) — shows "Never used" in all contexts
- `dueMonth`/`dueYear` present but `dueDisplay` is null (shouldn't happen per API, but handle gracefully)
- Wizard month/year not yet set (null) — no expenses should match as "due"

## References

- Research doc: `.claude/thoughts/research/2026-02-15-recurring-expense-api-migration.md`
- API change notes: `.claude/thoughts/notes/2026-02-15-recurring-expense-api-changes.md`
