---
date: 2026-02-22T16:10:00+01:00
researcher: Claude
git_commit: 3d6c1f8ee75d42e439002fd17e1dfa013434c15c
branch: design-system-evolution
repository: balance-frontend
topic: "Branch review: inconsistencies, refactoring opportunities, and test failures"
tags: [research, branch-review, design-system, refactoring, tests]
status: complete
last_updated: 2026-02-22
last_updated_by: Claude
---

# Research: design-system-evolution Branch Review

**Date**: 2026-02-22T16:10:00+01:00
**Git Commit**: 3d6c1f8
**Branch**: design-system-evolution (15 commits, 31 files changed)

## Research Question
Analyze all changes in design-system-evolution vs main for inconsistencies, refactoring opportunities, and maintainability issues.

## Summary

The branch introduces a comprehensive design system overhaul: Geist font, OKLCH color palette, budget lifecycle state machines, and UI polish. The architecture is sound but there are **13 failing tests** (in 5 files) that weren't updated for the new component behavior, **duplicated lifecycle logic**, **inconsistent currency formatting**, and several smaller inconsistencies.

---

## Critical Issues

### 1. 13 Failing Tests in 5 Files

Tests not updated for the design system changes:

| File | Failures | Root Cause |
|------|----------|------------|
| `TodoItemRow.test.tsx` | 6 | Tests expect old layout (badges, `item.name` directly, "To: account" text). New component uses `getDisplayName()`, removed badges, restructured layout |
| `TodoItemList.test.tsx` | 4 | Looks for old text patterns ("Pay Netflix...", "To: Savings Account", "5 000,00 kr") that no longer render due to `getDisplayName()` and `formatCurrencySmart()` |
| `TodoListPage.test.tsx` | 1 | "shows todo items" fails because it depends on old TodoItem rendering |
| `Header.test.tsx` | 1 | Expects "Balance" title text, but it was removed from the header |
| `AppLayout.test.tsx` | 1 | Expects "Balance" in sidebar, but it now renders as an `<img>` + text (logo change) |

### 2. Duplicated Lifecycle Logic (`budget-lifecycle.ts`)

`deriveDetailLifecycleState` and `deriveCardLifecycleState` share ~70% of their logic:
- Identical locked-branch logic (todo loading, error fallback, isComplete check, savingsRate calculation)
- Identical `isComplete` definition: `todoSummary.totalItems === 0 || todoSummary.completedItems === todoSummary.totalItems`
- Identical `savingsRate` calculation: `Math.round((totals.savings / totals.income) * 100)`

**Refactoring opportunity**: Extract shared locked-state resolution into a helper, or use a single derive function with a `context: 'card' | 'detail'` parameter.

### 3. No Unit Tests for `budget-lifecycle.ts`

This is the core state machine for the app's most complex feature. The derive functions have 5-6 code paths each (draft states, locked states, loading, error) but zero direct unit tests. They're only indirectly tested through component tests that mock `useTodoList`.

---

## Inconsistencies

### 4. Currency Formatting Inconsistency

Three formatters exist, used inconsistently across components:

| Formatter | Decimals | Sign | Used In |
|-----------|----------|------|---------|
| `formatCurrency` | Always 2 | Preserves | BudgetSummary (detail), BudgetSection, AccountCard/Row, RecurringExpense |
| `formatCurrencyCompact` | Always 0 | Preserves | BudgetCard (grid) |
| `formatCurrencySmart` | 0 for whole, 2 otherwise | Always positive (`Math.abs`) | TodoItemRow |

**Inconsistency**: `BudgetSummary` (detail page) shows "50 000,00 kr" while `BudgetCard` (grid) shows "50 000 kr" for the same budget. The detail page's `StatsRow` uses `formatCurrency` (2 decimals) while the card uses `formatCurrencyCompact` (0 decimals).

Also: `formatCurrencySmart` silently drops the sign via `Math.abs`. The JSDoc says "Always positive" but this is a hidden behavior that could mask bugs if used in the wrong context.

### 5. Error Fallback State Naming Mismatch

In `budget-lifecycle.ts`, when a locked budget has a todo fetch error, both functions fall back to a *draft* state:
- Detail: returns `{ type: 'draft-building', totals }` for a locked budget
- Card: returns `{ type: 'draft-unbalanced', balance }` for a locked budget

This means a locked budget can render as "draft-building" — a state name that doesn't match reality. A dedicated `'locked-error-fallback'` type or `'locked-unknown'` would be clearer.

### 6. `isLoading` Destructured but Unused in BudgetSummary

`BudgetSummary.tsx:262` destructures `useTodoList` result but doesn't destructure `isLoading`:
```tsx
const { data: todoData, isError: todoError } = useTodoList(...)
```
The loading state is instead handled by `deriveDetailLifecycleState` returning `null`. This works but is implicit — the component relies on the absence of data rather than an explicit loading signal.

In contrast, `BudgetCard.tsx:19` does the same thing, consistent between the two. So this is consistent but worth noting as a pattern choice.

### 7. Duplicated `useTodoList` Call Pattern

Both `BudgetCard.tsx:19-21` and `BudgetSummary.tsx:262-265` have identical `useTodoList` call patterns:
```tsx
const { data: todoData, isError: todoError } = useTodoList(budget.id, {
  enabled: isLocked,
  staleTime: 5 * 60 * 1000,
})
```
The `staleTime: 5 * 60 * 1000` magic number is repeated. Could be a constant.

### 8. `BalanceBar` Uses `===` for Balance Check Instead of `isBudgetBalanced`

In `BudgetSummary.tsx:27`:
```tsx
const isBalanced = income > 0 && expenses + savings === income
```
But `budget-lifecycle.ts:26` uses:
```tsx
isBudgetBalanced(totals.balance) // Math.abs(balance) < 0.01
```
These could diverge for floating-point amounts. The `BalanceBar` uses strict equality while the lifecycle uses epsilon comparison.

### 9. Inline `pl-6 pr-6` Pattern vs `px-6`

Table inset padding uses `first:pl-6 last:pr-6` in `table.tsx` and `pl-6 pr-4` / `pl-4 pr-6` in row components. But `BudgetSection.tsx` uses `px-6` uniformly. The intent (24px horizontal inset aligned with card padding) is the same but implemented differently across components.

### 10. Dark Mode Tokens Not Updated

The `.dark` block in `index.css:158-177` still has the old shadcn defaults. The new OKLCH color system (positive/negative/info/warning) is only defined in `:root`. Dark mode (even though marked as non-goal) has stale tokens that would produce broken colors if ever enabled.

### 11. `BudgetCard` Type Assertion

`BudgetCard.tsx:17`:
```tsx
const isLocked: boolean = budget.status === ('LOCKED' as BudgetStatus)
```
The `as BudgetStatus` cast is unnecessary — `budget.status` is already typed as `BudgetStatus`, so `=== 'LOCKED'` would work directly. This was pre-existing but worth cleaning up.

---

## Minor Observations

### 12. `renderHero()` in BudgetCard Has Repeated Container Markup

All 4 branches of the switch statement in `BudgetCard.tsx:41-79` render the identical outer `<div>` wrapper:
```tsx
<div className="flex justify-between items-baseline pt-3 mt-2 border-t border-border">
```
This could be extracted to wrap the switch result.

### 13. `animate-strikethrough` Is a CSS Utility, Not an Animation

The class `animate-strikethrough` in `index.css:288-291` only sets `transition` properties — it's not actually an animation (no `@keyframes`). The `animate-` prefix suggests a keyframe animation per the naming convention of the other utilities in the file (`animate-pop-check`, `animate-fade-in-subtle`, etc.).

### 14. Two `cn` Imports in BudgetSummary

`BudgetSummary.tsx` imports from `@/lib/utils` twice:
```tsx
import { formatCurrency, getMonthName } from '@/lib/utils'  // line 4
import { cn } from '@/lib/utils'                             // line 8
```
Could be a single import statement.

### 15. `LockedComplete` Has Local Percentage Calculations That Duplicate Lifecycle Logic

`BudgetSummary.tsx:205-206` calculates `expensePercent` and `savingsPercent` locally, while `savingsRate` already comes from the lifecycle state. If more percentage calculations are needed in the future, they should probably live in the lifecycle derivation.

---

## Architecture Assessment

### What Works Well

- **Lifecycle state machine** (`budget-lifecycle.ts`): Clean discriminated union types, exhaustive switch statements in renderers, null for loading state
- **Component decomposition** in BudgetSummary: Each stage has its own renderer function, clear separation
- **Consistent design tokens**: OKLCH primitives → semantic tokens → component usage is well-layered
- **Test coverage for new behavior**: BudgetCard and BudgetSummary tests were thoroughly rewritten for lifecycle states

### Refactoring Priority

1. **Fix 13 failing tests** — Tests that weren't updated for the redesign
2. **Extract shared lifecycle logic** — DRY up the two derive functions
3. **Add unit tests for budget-lifecycle.ts** — Critical business logic with no direct tests
4. **Standardize currency formatting** — Decide on a consistent approach for detail vs card
5. **Fix BalanceBar floating-point check** — Use `isBudgetBalanced` instead of `===`

## Code References

- `src/lib/budget-lifecycle.ts` — New lifecycle state machine (87 lines)
- `src/lib/utils.ts:26-46` — New `formatCurrencyCompact` and `formatCurrencySmart`
- `src/components/budget-detail/BudgetSummary.tsx` — Redesigned with 5-stage lifecycle (297 lines)
- `src/components/budgets/BudgetCard.tsx` — Redesigned with 4-stage lifecycle (135 lines)
- `src/components/todo/TodoItemRow.tsx` — Redesigned with `getDisplayName()` and compact layout
- `src/hooks/use-todo.ts:6` — Extended with options parameter
- `src/index.css:76-156` — OKLCH color system and Geist font
- `src/components/layout/Sidebar.tsx` — Logo, soft-float shadow, active state redesign
