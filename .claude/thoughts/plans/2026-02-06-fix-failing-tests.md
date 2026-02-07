# Fix Failing Tests Implementation Plan

## Overview

Fix 15 failing tests across 6 test files. The failures have **two distinct root causes**, both introduced by recent responsive layout work and component refactoring.

## Current State Analysis

Running `npm test` shows **15 failed tests / 439 passed** across 6 files:

| Test File | Failed | Root Causes |
|-----------|--------|-------------|
| StepIncome.test.tsx | 6 | Duplicate elements, combobox name, async timing |
| StepExpenses.test.tsx | 3 | Duplicate elements, combobox name, async timing |
| StepSavings.test.tsx | 3 | Duplicate elements, combobox name, async timing |
| SavingsItemModal.test.tsx | 1 | Combobox accessible name |
| IncomeItemModal.test.tsx | 1 | Combobox accessible name |
| ExpenseItemModal.test.tsx | 1 | Combobox accessible name |

### Key Discoveries:

1. **Duplicate elements from responsive layouts**: Wizard step components (StepIncome, StepExpenses, StepSavings) render **both** a desktop table (`hidden md:block`) and mobile card layout (`md:hidden`) simultaneously. In JSDOM tests, CSS media queries don't apply, so both are visible. Tests using `getByText()` fail with "Found multiple elements" errors.

2. **Combobox accessible name mismatch**: The `AccountSelect` component uses Radix `Select`, which renders a `<button role="combobox">`. The Label (`<Label htmlFor="bankAccountId">Account *</Label>`) is associated via `htmlFor` to an `id` that doesn't exist on the combobox trigger (Radix Select doesn't forward `id` to the trigger button). Tests query `getByRole('combobox', { name: /account/i })` which fails because the combobox has **Name ""** (empty accessible name).

3. **Async timing with "From last budget"**: Tests for the copy-from-last-budget feature wait for data from `useLastBudget()` which makes **two sequential React Query requests** (budget list then budget detail). Combined with the duplicate element issue, some `waitFor` assertions fail.

### Root Cause Breakdown by Test:

**Root Cause A: Duplicate elements (8 tests)**
- StepIncome: "shows empty state message when no items" - `getByText(/no income items yet/i)` finds 2 elements (desktop table cell + mobile card)
- StepIncome: "shows total income" - `getByText(/50 000,00 kr/)` finds 3 elements (table footer + mobile total + mobile summary)
- StepIncome: "shows 'From last budget' section" - `getByText(/from last budget/i)` finds 2 elements
- StepIncome: "copies item when plus button is clicked" - Timing + duplicate elements
- StepIncome: "removes copied item" - Timing + duplicate elements
- StepExpenses: "shows empty state message when no items" - `getByText(/no expenses yet/i)` finds 2 elements
- StepExpenses: "shows quick-add section" - `getByText(/quick add/i)` finds 2 elements (desktop + mobile)
- StepSavings: "shows empty state message when no items" - `getByText(/no savings planned/i)` finds 2 elements
- StepSavings: "shows copy from last budget" - `getByText(/from last budget/i)` finds 2 elements

**Root Cause B: Combobox accessible name (6 tests)**
- StepIncome: "allows selecting account for income item" - `getByRole('combobox')` may find multiple (desktop + mobile after adding item)
- StepExpenses: "allows selecting account for expense item" - Same issue
- StepSavings: "allows selecting account for savings item" - Same issue
- SavingsItemModal: "calls API to create savings" - `getByRole('combobox', { name: /account/i })` finds no match
- IncomeItemModal: "calls API to create income" - Same
- ExpenseItemModal: "calls API to create expense" - Same

## Desired End State

All 454 tests pass (`npm test` returns 0 failed). No changes to component behavior or UI rendering.

### Verification:
```bash
npm test
# Expected: 0 failed, 454 passed
```

## What We're NOT Doing

- NOT changing the responsive layout approach (hidden md:block / md:hidden is correct)
- NOT mocking `useIsMobile` or `matchMedia` in tests
- NOT adding `data-testid` attributes (prefer accessible queries)
- NOT changing the AccountSelect component's rendering
- NOT modifying animation timing or CSS
- NOT refactoring the CollapseWrapper or useCopyAnimation hook

## Implementation Approach

Fix the **tests** to work correctly with the component implementations. The components are rendering correctly; the tests need to account for:
1. Both responsive views being present in JSDOM
2. The Radix Select's accessible name not being linked to the Label

## Phase 1: Fix Combobox Accessible Name Tests

### Overview
Fix 6 tests that can't find the AccountSelect combobox because the `<Label htmlFor="bankAccountId">` isn't connected to the Radix Select trigger. The fix is to add `aria-label` to the AccountSelect's trigger so tests can find it by accessible name.

### Changes Required:

#### 1. AccountSelect component - add aria-label forwarding
**File**: `src/components/accounts/AccountSelect.tsx`
**Changes**: Add an `aria-label` prop and forward it to `SelectTrigger`

```tsx
interface AccountSelectProps {
  value: string
  onValueChange: (accountId: string, accountName: string) => void
  placeholder?: string
  triggerClassName?: string
  label?: string  // NEW: accessible label for the trigger
}

export function AccountSelect({
  value,
  onValueChange,
  placeholder = 'Select account',
  triggerClassName,
  label,
}: AccountSelectProps) {
  // ...existing code...
  return (
    <>
      <Select value={value} onValueChange={handleValueChange}>
        <SelectTrigger className={triggerClassName} aria-label={label}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        {/* ...rest unchanged... */}
      </Select>
      {/* ...CreateAccountModal unchanged... */}
    </>
  )
}
```

#### 2. Update AccountSelect usages to pass label
**Files**: All files that use `<AccountSelect>` within a labeled form field

- `src/components/budget-detail/SavingsItemModal.tsx:129-133` - Add `label="Account"`
- `src/components/budget-detail/IncomeItemModal.tsx` - Add `label="Account"` (find the AccountSelect usage)
- `src/components/budget-detail/ExpenseItemModal.tsx` - Add `label="Account"` (find the AccountSelect usage)

The wizard step components (StepIncome, StepExpenses, StepSavings) use AccountSelect **without** a label context (inside table cells), so they don't need the `label` prop - tests for these use `getByRole('combobox')` without a name filter.

#### 3. Fix modal tests to use correct combobox query
**Files**:
- `src/components/budget-detail/SavingsItemModal.test.tsx:83`
- `src/components/budget-detail/IncomeItemModal.test.tsx:83`
- `src/components/budget-detail/ExpenseItemModal.test.tsx:100`

Change from:
```tsx
await userEvent.click(screen.getByRole('combobox', { name: /account/i }))
```

No change needed here if `aria-label="Account"` is added to the component. The query `getByRole('combobox', { name: /account/i })` will now find the trigger.

Also fix the `getByRole('option')` call - Radix Select uses `role="option"` for items, so this should work. But verify that the Select portal renders within the test DOM.

### Success Criteria:

#### Automated Verification:
- [x] These 6 tests pass: `npx vitest run src/components/budget-detail/SavingsItemModal.test.tsx src/components/budget-detail/IncomeItemModal.test.tsx src/components/budget-detail/ExpenseItemModal.test.tsx -t "calls API to create"`
- [x] These 3 wizard tests pass: `npx vitest run src/components/wizard/steps/StepIncome.test.tsx src/components/wizard/steps/StepExpenses.test.tsx src/components/wizard/steps/StepSavings.test.tsx -t "allows selecting account"`
- [x] TypeScript compiles: `npx tsc --noEmit`
- [x] No regressions in passing tests: `npm test`

#### Manual Verification:
- [ ] AccountSelect still works correctly in the UI (dropdown opens, selection works)

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.

---

## Phase 2: Fix Duplicate Element Tests

### Overview
Fix 8 tests that fail because `getByText()` finds the same text in both desktop and mobile responsive layouts. The fix is to use `getAllByText()` or scope queries to avoid ambiguity.

### Changes Required:

#### 1. StepIncome.test.tsx
**File**: `src/components/wizard/steps/StepIncome.test.tsx`

**Test "shows empty state message when no items" (line 44-48):**
```tsx
// Before:
expect(screen.getByText(/no income items yet/i)).toBeInTheDocument()
// After:
expect(screen.getAllByText(/no income items yet/i).length).toBeGreaterThanOrEqual(1)
```

**Test "shows total income" (line 97-107):**
```tsx
// Before:
await waitFor(() => {
  expect(screen.getByText(/50 000,00 kr/)).toBeInTheDocument()
})
// After:
await waitFor(() => {
  const amounts = screen.getAllByText(/50 000,00 kr/)
  expect(amounts.length).toBeGreaterThanOrEqual(1)
})
```

**Test "shows 'From last budget' section" (line 119-151):**
```tsx
// Before:
await waitFor(() => {
  expect(screen.getByText(/from last budget/i)).toBeInTheDocument()
})
expect(screen.getByText('Salary')).toBeInTheDocument()
// After:
await waitFor(() => {
  expect(screen.getAllByText(/from last budget/i).length).toBeGreaterThanOrEqual(1)
})
expect(screen.getAllByText('Salary').length).toBeGreaterThanOrEqual(1)
```

**Test "copies item when plus button is clicked" (line 159-197):**
```tsx
// Before:
await waitFor(() => {
  expect(screen.getByText('Salary')).toBeInTheDocument()
})
const addButton = screen.getByRole('button', { name: /add item/i })
// After:
await waitFor(() => {
  expect(screen.getAllByText('Salary').length).toBeGreaterThanOrEqual(1)
})
const addButtons = screen.getAllByRole('button', { name: /add item/i })
await userEvent.click(addButtons[0])
```

**Test "removes copied item" (line 199-242):**
```tsx
// Before:
await waitFor(() => {
  expect(screen.getByText('Salary')).toBeInTheDocument()
  expect(screen.getByText('Side gig')).toBeInTheDocument()
})
const addButtons = screen.getAllByRole('button', { name: /add item/i })
// After:
await waitFor(() => {
  expect(screen.getAllByText('Salary').length).toBeGreaterThanOrEqual(1)
  expect(screen.getAllByText('Side gig').length).toBeGreaterThanOrEqual(1)
})
const addButtons = screen.getAllByRole('button', { name: /add item/i })
```

#### 2. StepExpenses.test.tsx
**File**: `src/components/wizard/steps/StepExpenses.test.tsx`

**Test "shows empty state message when no items" (line 77-81):**
```tsx
// Before:
expect(screen.getByText(/no expenses yet/i)).toBeInTheDocument()
// After:
expect(screen.getAllByText(/no expenses yet/i).length).toBeGreaterThanOrEqual(1)
```

**Test "shows quick-add section when recurring expenses exist" (line 168-187):**
```tsx
// Before:
await waitFor(() => {
  expect(screen.getByText(/quick add/i)).toBeInTheDocument()
  expect(screen.getByText('Rent')).toBeInTheDocument()
  expect(screen.getByText('Netflix')).toBeInTheDocument()
})
// After:
await waitFor(() => {
  expect(screen.getAllByText(/quick add/i).length).toBeGreaterThanOrEqual(1)
  expect(screen.getAllByText('Rent').length).toBeGreaterThanOrEqual(1)
  expect(screen.getAllByText('Netflix').length).toBeGreaterThanOrEqual(1)
})
```

#### 3. StepSavings.test.tsx
**File**: `src/components/wizard/steps/StepSavings.test.tsx`

**Test "shows empty state message when no items" (line 105-111):**
```tsx
// Before:
await waitFor(() => {
  expect(screen.getByText(/no savings planned/i)).toBeInTheDocument()
})
// After:
await waitFor(() => {
  expect(screen.getAllByText(/no savings planned/i).length).toBeGreaterThanOrEqual(1)
})
```

**Test "shows copy from last budget" (line 336-378):**
```tsx
// Before:
await waitFor(() => {
  expect(screen.getByText(/from last budget/i)).toBeInTheDocument()
  expect(screen.getByText('Emergency Fund')).toBeInTheDocument()
})
// After:
await waitFor(() => {
  expect(screen.getAllByText(/from last budget/i).length).toBeGreaterThanOrEqual(1)
  expect(screen.getAllByText('Emergency Fund').length).toBeGreaterThanOrEqual(1)
})
```

### Success Criteria:

#### Automated Verification:
- [x] All 454 tests pass: `npm test`
- [x] TypeScript compiles: `npx tsc --noEmit`

#### Manual Verification:
- [ ] None needed (test-only changes)

---

## Testing Strategy

### Automated Tests:
- Run full test suite after each phase: `npm test`
- Run specific failing files to verify fixes: `npx vitest run [file] --reporter=verbose`

### Risk Assessment:
- **Low risk**: All changes are in test files and one component's accessibility attribute
- **No behavior changes**: Components render identically
- **No regression risk**: Using `getAllByText` is strictly more permissive than `getByText`

## References

- Research: `.claude/thoughts/research/2026-02-06-failing-tests-analysis.md`
- AccountSelect component: `src/components/accounts/AccountSelect.tsx`
- Radix Select: Uses `@radix-ui/react-select` which renders trigger as `<button role="combobox">`
- Responsive pattern: `hidden md:block` (desktop) + `md:hidden` (mobile) in wizard steps
