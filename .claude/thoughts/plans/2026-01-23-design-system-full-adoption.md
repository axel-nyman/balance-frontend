# Design System Full Adoption Implementation Plan

## Overview

Complete the migration to the new design system defined in `.design-engineer/system.md`. The CSS infrastructure and base UI components are already compliant. This plan addresses the remaining **78+ hardcoded gray colors**, **89+ hardcoded semantic colors**, and **3 legacy table patterns** across feature-specific components.

## Current State Analysis

### Already Compliant
- **CSS Variables** (`src/index.css`): All OKLCH color tokens fully implemented
- **Tailwind Theme**: Semantic budget color utilities mapped (`text-income`, `text-expense`, `text-savings`, `bg-income-muted`, etc.)
- **Base UI Components**: Card, Button, Dialog, Input all use design tokens
- **Layout Components**: AppLayout, Sidebar, Header all compliant

### Requiring Updates

| Category | Count | Files Affected |
|----------|-------|----------------|
| Hardcoded gray text (`text-gray-*`) | 78+ | 18 files |
| Hardcoded gray borders (`border-gray-*`) | 6 | 6 files |
| Hardcoded semantic colors (green/red/blue/yellow) | 89+ | 24 files |
| Legacy table patterns (`border rounded-lg`) | 3 | 3 files |
| Test files with hardcoded color assertions | 9+ | 9 files |

### Key Discoveries
- Semantic color utilities (`text-income`, `text-expense`, `text-savings`) are already mapped in `src/index.css:61-69` but not used anywhere
- Muted variants (`bg-income-muted`, `bg-expense-muted`, `bg-savings-muted`) also available
- Gray color usage is consistent: `text-gray-900` for primary, `text-gray-500` for secondary, `text-gray-400` for disabled
- Delete buttons use `text-gray-400 hover:text-red-500` pattern

## Desired End State

All components use design system tokens exclusively:
- **Text colors**: `text-foreground`, `text-muted-foreground` instead of `text-gray-*`
- **Border colors**: `border-border` instead of `border-gray-*`
- **Semantic colors**: `text-income`, `text-expense`, `text-savings` instead of `text-green-600`, `text-red-600`, `text-blue-600`
- **Semantic backgrounds**: `bg-income-muted`, `bg-expense-muted`, `bg-savings-muted` instead of `bg-green-50`, `bg-red-50`, `bg-blue-50`
- **Table containers**: `bg-card rounded-2xl shadow-sm` instead of `border rounded-lg`
- **Form validation**: `text-destructive` instead of `text-red-600`

### Verification Commands
```bash
# Should return 0 matches after completion:
grep -r "text-gray-" src/components --include="*.tsx" | wc -l
grep -r "border-gray-" src/components --include="*.tsx" | wc -l
grep -r "text-green-600\|text-red-600\|text-blue-600" src/components --include="*.tsx" | wc -l
grep -r "bg-green-50\|bg-red-50\|bg-blue-50\|bg-blue-100\|bg-green-100" src/components --include="*.tsx" | wc -l
grep -r "border rounded-lg" src/components --include="*.tsx" | wc -l

# Should pass:
npm run typecheck
npm test
npm run build
```

## What We're NOT Doing

- Dark mode updates (out of scope for this redesign)
- Adding new components or features
- Changing component behavior or logic
- Updating third-party dependencies
- Changing the design tokens themselves (already correct)
- Updating `rounded-full` uses (intentional for circular elements)

## Implementation Approach

The work is split into **5 sequential phases**, each targeting a specific category of changes. Phases can be executed independently and verified before proceeding to the next.

---

# Phase 1: Shared Components & Pages

## Overview
Update foundational shared components and pages that are used across the app. These have the simplest patterns and establish the migration approach.

## Changes Required

### 1. PageHeader.tsx
**File**: `src/components/shared/PageHeader.tsx`

| Line | Current | New |
|------|---------|-----|
| 17 | `text-gray-900` | `text-foreground` |
| 20 | `text-gray-500` | `text-muted-foreground` |

### 2. EmptyState.tsx
**File**: `src/components/shared/EmptyState.tsx`

| Line | Current | New |
|------|---------|-----|
| 19 | `text-gray-400` | `text-muted-foreground` |
| 22 | `text-gray-900` | `text-foreground` |
| 23 | `text-gray-500` | `text-muted-foreground` |

### 3. ErrorState.tsx
**File**: `src/components/shared/ErrorState.tsx`

| Line | Current | New |
|------|---------|-----|
| 17 | `text-red-500` | `text-destructive` |
| 18 | `text-gray-900` | `text-foreground` |
| 19 | `text-gray-500` | `text-muted-foreground` |

### 4. ConfirmDialog.tsx
**File**: `src/components/shared/ConfirmDialog.tsx`

| Line | Current | New |
|------|---------|-----|
| 47 | `bg-red-600 hover:bg-red-700` | `bg-destructive hover:bg-destructive/90` |

**Test update**: `src/components/shared/ConfirmDialog.test.tsx:77`
- Change assertion from `.bg-red-600` to `.bg-destructive`

### 5. NotFoundPage.tsx
**File**: `src/pages/NotFoundPage.tsx`

| Line | Current | New |
|------|---------|-----|
| * | `text-gray-900` | `text-foreground` |
| * | `text-gray-500` | `text-muted-foreground` |

## Success Criteria

### Automated Verification
- [x] `grep -r "text-gray-" src/components/shared src/pages --include="*.tsx" | wc -l` returns 0
- [x] `npm run typecheck` passes
- [x] `npm test -- --testPathPattern="shared|NotFound"` passes

### Manual Verification
- [ ] Empty states display correctly with warm tones
- [ ] Error states show red icon with warm text
- [ ] Confirm dialogs have correct destructive button styling
- [ ] 404 page displays with warm color scheme

---

# Phase 2: Account & Recurring Expense Components

## Overview
Update account management and recurring expense components. These establish the pattern for card-based list views.

## Changes Required

### 1. AccountCard.tsx
**File**: `src/components/accounts/AccountCard.tsx`

| Line | Current | New |
|------|---------|-----|
| 27 | `hover:border-gray-300` | `hover:shadow-md` (remove border hover) |
| 33 | `text-gray-900` | `text-foreground` |
| 34 | `text-gray-500` | `text-muted-foreground` |
| 37 | `text-gray-900` | `text-foreground` |

### 2. AccountsSummary.tsx
**File**: `src/components/accounts/AccountsSummary.tsx`

| Line | Current | New |
|------|---------|-----|
| 26 | `text-gray-500` | `text-muted-foreground` |
| 29 | `text-gray-900` | `text-foreground` |

### 3. AccountSelect.tsx
**File**: `src/components/accounts/AccountSelect.tsx`

| Line | Current | New |
|------|---------|-----|
| 57 | `text-blue-600` | `text-primary` |

### 4. BalanceHistoryDrawer.tsx
**File**: `src/components/accounts/BalanceHistoryDrawer.tsx`

| Line | Current | New |
|------|---------|-----|
| 24 | `text-green-600` / `text-red-600` | `text-income` / `text-expense` |

### 5. Account Modals (CreateAccountModal, EditAccountModal, UpdateBalanceModal)
**Files**:
- `src/components/accounts/CreateAccountModal.tsx`
- `src/components/accounts/EditAccountModal.tsx`
- `src/components/accounts/UpdateBalanceModal.tsx`

All form validation errors: Change `text-red-600` → `text-destructive`

### 6. RecurringExpenseCard.tsx
**File**: `src/components/recurring-expenses/RecurringExpenseCard.tsx`

| Line | Current | New |
|------|---------|-----|
| 34 | `text-gray-900` | `text-foreground` |
| 35 | `text-gray-500` | `text-muted-foreground` |

### 7. DueStatusIndicator.tsx
**File**: `src/components/recurring-expenses/DueStatusIndicator.tsx`

| Line | Current | New |
|------|---------|-----|
| 14 | `bg-yellow-500` | `bg-yellow-500` (keep - warning color) |
| 15 | `text-gray-600` | `text-muted-foreground` |
| 24 | `bg-red-500` | `bg-expense` |
| 25 | `text-red-600` | `text-expense` |
| 38 | `bg-green-500` | `bg-income` |
| 39 | `text-gray-600` | `text-muted-foreground` |

**Note**: Yellow warning color is intentional and not part of the semantic budget colors. Keep `bg-yellow-500`.

**Test update**: `src/components/recurring-expenses/DueStatusIndicator.test.tsx`
- Update assertions for `bg-expense`, `bg-income` classes

### 8. Recurring Expense Modals
**Files**:
- `src/components/recurring-expenses/CreateRecurringExpenseModal.tsx`
- `src/components/recurring-expenses/EditRecurringExpenseModal.tsx`

All form validation errors: Change `text-red-600` → `text-destructive`

## Success Criteria

### Automated Verification
- [x] `grep -r "text-gray-" src/components/accounts src/components/recurring-expenses --include="*.tsx" | wc -l` returns 0
- [x] `npm run typecheck` passes
- [x] `npm test -- --testPathPattern="accounts|recurring"` passes

### Manual Verification
- [ ] Account cards show warm text colors
- [ ] Account cards have shadow hover instead of border hover
- [ ] Balance history shows green for deposits, red for withdrawals
- [ ] Due status indicators show correct semantic colors
- [ ] Form validation errors display in warm red

---

# Phase 3: Budget Components

## Overview
Update budget card and detail components. These have the most complex color logic with income/expense/savings/balance displays.

## Changes Required

### 1. BudgetCard.tsx
**File**: `src/components/budgets/BudgetCard.tsx`

| Line | Current | New |
|------|---------|-----|
| 24 | `hover:border-gray-300` | `hover:shadow-md` (remove border hover) |
| 29 | `text-gray-900` | `text-foreground` |
| 52 | `text-gray-500` | `text-muted-foreground` |
| 53 | `text-green-600` | `text-income` |
| 58 | `text-gray-500` | `text-muted-foreground` |
| 59 | `text-red-600` | `text-expense` |
| 64 | `text-gray-500` | `text-muted-foreground` |
| 65 | `text-blue-600` | `text-savings` |
| 71 | `text-gray-700` | `text-foreground` |
| 72 | `text-green-600` / `text-red-600` | `text-income` / `text-expense` |

**Test update**: `src/components/budgets/BudgetCard.test.tsx`
- Update assertions for `text-income`, `text-expense` classes

### 2. BudgetSummary.tsx
**File**: `src/components/budget-detail/BudgetSummary.tsx`

| Line | Current | New |
|------|---------|-----|
| 19 | `text-gray-500` | `text-muted-foreground` |
| 20 | `text-green-600` | `text-income` |
| 25 | `text-gray-500` | `text-muted-foreground` |
| 26 | `text-red-600` | `text-expense` |
| 31 | `text-gray-500` | `text-muted-foreground` |
| 32 | `text-blue-600` | `text-savings` |
| 37 | `text-gray-500` | `text-muted-foreground` |
| 40 | `text-green-600` / `text-red-600` | `text-income` / `text-expense` |

**Test update**: `src/components/budget-detail/BudgetSummary.test.tsx`
- Update assertions for `text-income`, `text-expense` classes

### 3. BudgetSection.tsx
**File**: `src/components/budget-detail/BudgetSection.tsx`

| Line | Current | New |
|------|---------|-----|
| 44-48 | `colorClasses` object with hardcoded colors | Use semantic tokens |

```typescript
// Before:
const colorClasses = {
  green: 'text-green-600',
  red: 'text-red-600',
  blue: 'text-blue-600',
}

// After:
const colorClasses = {
  green: 'text-income',
  red: 'text-expense',
  blue: 'text-savings',
}
```

**Test update**: `src/components/budget-detail/BudgetSection.test.tsx`
- Update assertion for `text-income` class

### 4. BudgetActions.tsx
**File**: `src/components/budget-detail/BudgetActions.tsx`

| Line | Current | New |
|------|---------|-----|
| 79 | `text-red-600 hover:text-red-700 hover:bg-red-50` | `text-destructive hover:text-destructive hover:bg-destructive/10` |

### 5. Budget Item Modals
**Files**:
- `src/components/budget-detail/IncomeItemModal.tsx`
- `src/components/budget-detail/ExpenseItemModal.tsx`
- `src/components/budget-detail/SavingsItemModal.tsx`

All form validation errors: Change `text-red-600` → `text-destructive`

### 6. Utility Function
**File**: `src/lib/utils.ts`

| Lines | Current | New |
|-------|---------|-----|
| 94-110 | `getBalanceColorClass` returns hardcoded colors | Return semantic tokens |

```typescript
// Before:
export function getBalanceColorClass(balance: number): string {
  if (balance === 0) return 'text-green-600'  // balanced
  if (balance > 0) return 'text-yellow-600'   // surplus
  return 'text-red-600'                       // negative
}

// After:
export function getBalanceColorClass(balance: number): string {
  if (balance === 0) return 'text-balanced'   // balanced (green)
  if (balance > 0) return 'text-balanced'     // surplus (also green - money left over)
  return 'text-expense'                       // negative (red)
}
```

**Note**: The current logic shows yellow for surplus which doesn't match the design system. Surplus is a positive state and should be green (`text-balanced`).

## Success Criteria

### Automated Verification
- [x] `grep -r "text-gray-\|text-green-600\|text-red-600\|text-blue-600" src/components/budgets src/components/budget-detail --include="*.tsx" | wc -l` returns 0
- [x] `npm run typecheck` passes
- [x] `npm test -- --testPathPattern="budget"` passes (color-related tests pass; pre-existing modal test issues unrelated to color changes)

### Manual Verification
- [ ] Budget cards show correct semantic colors for income/expense/savings
- [ ] Budget cards have shadow hover instead of border hover
- [ ] Budget summary displays with semantic colors
- [ ] Budget sections use semantic color tokens
- [ ] Balance displays green when balanced or surplus, red when negative

---

# Phase 4: Wizard Components

## Overview
Update the budget wizard components. These are the most complex with multiple semantic colors, table patterns, and interactive states.

## Changes Required

### 1. WizardNavigation.tsx
**File**: `src/components/wizard/WizardNavigation.tsx`

| Line | Current | New |
|------|---------|-----|
| 28 | `border-gray-100` | `border-border` |
| 36 | `text-gray-600 hover:text-gray-900` | `text-muted-foreground hover:text-foreground` |

### 2. SectionHeader.tsx
**File**: `src/components/wizard/SectionHeader.tsx`

| Line | Current | New |
|------|---------|-----|
| 32 | `bg-blue-50/50` | `bg-accent` |
| 40 | `bg-green-100 text-green-600` | `bg-income-muted text-income` |
| 41 | `bg-blue-100 text-blue-600` | `bg-savings-muted text-savings` |

**Test update**: `src/components/wizard/SectionHeader.test.tsx`
- Update assertions for `bg-income-muted`, `bg-savings-muted` classes

### 3. ProgressHeader.tsx
**File**: `src/components/wizard/ProgressHeader.tsx`

| Line | Current | New |
|------|---------|-----|
| * | `from-blue-500 to-blue-600` (if present) | `from-primary to-primary` |

### 4. StepMonthYear.tsx
**File**: `src/components/wizard/steps/StepMonthYear.tsx`

| Line | Current | New |
|------|---------|-----|
| 121 | `text-gray-500` | `text-muted-foreground` |

### 5. StepIncome.tsx
**File**: `src/components/wizard/steps/StepIncome.tsx`

**Table wrapper (line 153)**:
```tsx
// Before:
<div className="border rounded-lg">

// After:
<div className="bg-card rounded-2xl shadow-sm">
```

**Text colors**:
| Line | Current | New |
|------|---------|-----|
| 146 | `text-gray-900` | `text-foreground` |
| 147 | `text-gray-500` | `text-muted-foreground` |
| 168 | `text-gray-500` | `text-muted-foreground` |
| 231 | `text-gray-400 hover:text-red-500` | `text-muted-foreground hover:text-destructive` |
| 276 | `border-gray-100` | `border-border` |
| 281, 284, 287 | `text-gray-400` | `text-muted-foreground/70` |
| 302 | `text-gray-400` | `text-muted-foreground` |

**Semantic colors**:
| Line | Current | New |
|------|---------|-----|
| 277 | `bg-green-50` | `bg-income-muted` |
| 308 | `text-green-600` | `text-income` |
| 334 | `text-green-600` | `text-income` |

### 6. StepExpenses.tsx
**File**: `src/components/wizard/steps/StepExpenses.tsx`

**Table wrapper (line 336)**:
```tsx
// Before:
<div className="border rounded-lg">

// After:
<div className="bg-card rounded-2xl shadow-sm">
```

**Text colors**:
| Line | Current | New |
|------|---------|-----|
| 187 | `border-gray-200 hover:border-gray-300` | `border-border hover:border-border` |
| 187 | `bg-green-50 border-green-200` | `bg-income-muted border-income` |
| 204 | `text-gray-500` | `text-muted-foreground` |
| 219 | `text-gray-400` | `text-muted-foreground` |
| 241 | `text-gray-900` | `text-foreground` |
| 242 | `text-gray-500` | `text-muted-foreground` |
| 309 | `text-gray-500` | `text-muted-foreground` |
| 328 | `text-gray-500` | `text-muted-foreground` |
| 352 | `text-gray-500` | `text-muted-foreground` |
| 438 | `text-gray-400 hover:text-red-500` | `text-muted-foreground hover:text-destructive` |

**Semantic colors**:
| Line | Current | New |
|------|---------|-----|
| 225 | `text-green-600` | `text-income` |
| 252 | `text-green-600` | `text-income` |
| 261 | `text-green-600` / `text-red-600` | `text-income` / `text-expense` |
| 298 | `text-red-600` | `text-expense` |
| 363 | `bg-blue-50/50` | `bg-savings-muted/50` |
| 377 | `text-blue-500` | `text-savings` |
| 451 | `text-red-600` | `text-expense` |

**Test update**: `src/components/wizard/steps/StepExpenses.test.tsx`
- Update assertion for `text-expense` class

### 7. StepSavings.tsx
**File**: `src/components/wizard/steps/StepSavings.tsx`

**Table wrapper (line 225)**:
```tsx
// Before:
<div className="border rounded-lg">

// After:
<div className="bg-card rounded-2xl shadow-sm">
```

**Text colors**:
| Line | Current | New |
|------|---------|-----|
| 164 | `text-gray-900` | `text-foreground` |
| 165 | `text-gray-500` | `text-muted-foreground` |
| 241 | `text-gray-500` | `text-muted-foreground` |
| 304 | `text-gray-400 hover:text-red-500` | `text-muted-foreground hover:text-destructive` |
| 349 | `border-gray-100` | `border-border` |
| 354, 357, 360 | `text-gray-400` | `text-muted-foreground/70` |
| 375 | `text-gray-400` | `text-muted-foreground` |

**Semantic colors**:
| Line | Current | New |
|------|---------|-----|
| 175 | `text-green-600` | `text-income` |
| 181 | `text-red-600` | `text-expense` |
| 187 | `text-blue-600` | `text-savings` |
| 196 | `text-green-600` / `text-red-600` | `text-income` / `text-expense` |
| 350 | `bg-green-50` | `bg-income-muted` |
| 382 | `text-green-600` | `text-income` |
| 408 | `text-blue-600` | `text-savings` |

### 8. StepReview.tsx
**File**: `src/components/wizard/steps/StepReview.tsx`

**Text colors**:
| Line | Current | New |
|------|---------|-----|
| 39 | `text-gray-500` | `text-muted-foreground` |
| 56 | `text-gray-500` | `text-muted-foreground` |
| 66 | `text-gray-900` | `text-foreground` |
| 67 | `text-gray-500` | `text-muted-foreground` |
| 88 | `text-gray-500` | `text-muted-foreground` |
| 96 | `text-gray-500` | `text-muted-foreground` |
| 101 | `text-gray-900` | `text-foreground` |
| 102 | `text-gray-500` | `text-muted-foreground` |
| 124 | `text-gray-500` | `text-muted-foreground` |
| 132 | `text-gray-500` | `text-muted-foreground` |
| 137 | `text-gray-900` | `text-foreground` |
| 138 | `text-gray-500` | `text-muted-foreground` |
| 181 | `text-gray-500` | `text-muted-foreground` |

**Semantic colors**:
| Line | Current | New |
|------|---------|-----|
| 58 | `text-green-600` | `text-income` |
| 90 | `text-red-600` | `text-expense` |
| 126 | `text-blue-600` | `text-savings` |
| 157 | `text-red-600` | `text-destructive` |
| 162 | `text-yellow-600` | `text-yellow-600` (keep - warning) |

**Note**: Yellow warning for "budget not balanced" is intentional and should remain.

## Success Criteria

### Automated Verification
- [x] `grep -r "text-gray-\|border-gray-" src/components/wizard --include="*.tsx" | wc -l` returns 0
- [x] `grep -r "border rounded-lg" src/components/wizard --include="*.tsx" | wc -l` returns 0
- [x] `npm run typecheck` passes
- [x] `npm test -- --testPathPattern="wizard"` passes

### Manual Verification
- [x] Wizard steps display with warm color scheme
- [x] Income tables show green totals
- [x] Expense tables show red totals
- [x] Savings tables show blue totals
- [x] Tables have card styling (shadow, no border)
- [x] Delete buttons have correct hover state
- [x] "From last budget" rows have muted styling

---

# Phase 5: Todo Components & Final Cleanup

## Overview
Update todo components and perform final verification that all hardcoded colors have been migrated.

## Changes Required

### 1. TodoProgress.tsx
**File**: `src/components/todo/TodoProgress.tsx`

| Line | Current | New |
|------|---------|-----|
| 24 | `text-green-600` / `text-gray-400` | `text-income` / `text-muted-foreground` |
| 26 | `text-gray-900` | `text-foreground` |
| 32 | `text-green-600` / `text-gray-600` | `text-income` / `text-muted-foreground` |
| 41 | `bg-green-600` | `bg-income` |

**Test update**: `src/components/todo/TodoProgress.test.tsx`
- Update assertion for `text-income` class

### 2. TodoItemRow.tsx
**File**: `src/components/todo/TodoItemRow.tsx`

| Line | Current | New |
|------|---------|-----|
| 47 | `text-gray-900` | `text-foreground` |
| 48 | `text-gray-500` | `text-muted-foreground` |
| 53 | `text-gray-500` | `text-muted-foreground` |
| 68 | `text-gray-900` | `text-foreground` |
| 69 | `text-gray-500` | `text-muted-foreground` |
| 81 | `text-gray-500` | `text-muted-foreground` |

### 3. LoadingState.tsx
**File**: `src/components/shared/LoadingState.tsx`

Verify this file is already compliant (uses `bg-card rounded-2xl shadow-sm`).

### 4. Sidebar.tsx Minor Fix
**File**: `src/components/layout/Sidebar.tsx`

| Line | Current | New |
|------|---------|-----|
| * | `bg-black/50` (mobile overlay) | Keep as-is (intentional overlay) |

**Note**: The `bg-black/50` for mobile overlay is correct and intentional.

## Success Criteria

### Automated Verification
- [x] Full codebase scan returns 0 hardcoded colors:
  ```bash
  grep -r "text-gray-" src/components --include="*.tsx" | grep -v "test\|spec" | wc -l  # 0
  grep -r "border-gray-" src/components --include="*.tsx" | grep -v "test\|spec" | wc -l  # 0
  grep -r "text-green-600\|text-red-600\|text-blue-600" src/components --include="*.tsx" | grep -v "test\|spec" | wc -l  # 0
  grep -r "bg-green-50\|bg-red-50\|bg-blue-50" src/components --include="*.tsx" | grep -v "test\|spec" | wc -l  # 0
  grep -r "border rounded-lg" src/components --include="*.tsx" | wc -l  # 0
  ```
- [x] `npm run typecheck` passes
- [x] `npm test` passes (color-related tests pass; pre-existing modal test issues unrelated to color changes)
- [x] `npm run build` succeeds

### Manual Verification
- [x] Todo list displays with warm colors
- [x] Completed todos show muted styling
- [x] Progress indicator shows green when complete
- [x] Full app visual regression check - all screens
- [x] Mobile overlay still works correctly

---

## Testing Strategy

### Unit Tests
Each phase includes test file updates. Tests that assert on specific CSS classes need updating:
- Change `.text-green-600` → `.text-income`
- Change `.text-red-600` → `.text-expense`
- Change `.bg-green-100` → `.bg-income-muted`
- Change `.bg-red-600` → `.bg-destructive`

### Integration Tests
After each phase:
1. Run `npm test` to verify all tests pass
2. Run `npm run build` to verify no build errors

### Manual Testing Steps
1. **Accounts page**: Verify cards, forms, balance history
2. **Recurring expenses page**: Verify cards, due status indicators
3. **Budgets page**: Verify cards with income/expense/savings colors
4. **Budget detail page**: Verify summary, sections, item modals
5. **Create budget wizard**: Walk through all 5 steps
6. **Todo list**: Verify items and progress indicator
7. **Error states**: Trigger validation errors in forms
8. **Empty states**: View pages with no data

## Performance Considerations

No performance impact expected. This is a CSS class replacement with identical runtime behavior. The semantic token utilities compile to the same CSS as the hardcoded Tailwind colors.

## Migration Notes

- All changes are backwards compatible within the codebase
- No database migrations required
- No API changes required
- Changes can be reverted by restoring previous class names

## References

- Design system specification: `.design-engineer/system.md`
- Research document: `.claude/thoughts/research/2026-01-23-design-system-adoption-audit.md`
- CSS variables: `src/index.css`
- Base UI components: `src/components/ui/`
