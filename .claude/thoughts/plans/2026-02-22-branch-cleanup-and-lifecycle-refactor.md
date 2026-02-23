# Branch Cleanup & Lifecycle Refactor Implementation Plan

## Overview

Clean up the `design-system-evolution` branch before merge: fix 13 failing tests, refactor duplicated lifecycle logic, add lifecycle unit tests, fix inconsistencies (error fallback states, floating-point balance check, CSS naming), and apply minor cleanups.

## Current State Analysis

The branch has 15 commits (31 files changed) introducing Geist font, OKLCH colors, budget lifecycle state machines, and UI polish. The architecture is sound but tests weren't updated for new component behavior, and the lifecycle module has duplicated logic with no direct unit tests.

### Key Discoveries:
- `TodoItemRow` now uses `getDisplayName()` (line 16-24) which strips "Pay " prefix and extracts payee from backend names, and formats transfers as `"From → To"`
- `TodoItemRow` uses `formatCurrencySmart()` (0 decimals for whole numbers) instead of `formatCurrency` (always 2 decimals)
- `TodoItemRow` removed badge components entirely
- `Header.tsx` no longer renders "Balance" text — just a menu button
- `Sidebar.tsx` renders "Balance" text + logo image
- `deriveDetailLifecycleState` and `deriveCardLifecycleState` share identical locked-branch logic (~70%)
- Error fallback returns draft state types for locked budgets (misleading)
- `BalanceBar` uses `===` for balance check vs lifecycle's `isBudgetBalanced` (epsilon)

## Desired End State

After implementation:
- All tests pass (`npm test`)
- `budget-lifecycle.ts` has extracted shared helpers with no duplicated logic
- New `locked-error-fallback` state type replaces misleading draft fallbacks
- `locked-complete` state includes `expenseRate` alongside `savingsRate`
- `BalanceBar` uses `isBudgetBalanced` for floating-point-safe comparison
- CSS class renamed from `animate-strikethrough` to `transition-strikethrough`
- `renderHero()` container markup extracted (not repeated 5 times)
- Minor cleanups: consolidated imports, removed type assertion, extracted staleTime constant

### Verification:
- `npm test` — all tests pass
- `npm run build` — no type errors
- Manual: verify budget detail page and card grid render correctly

## What We're NOT Doing

- Currency formatting changes (Issue 4 — intentional context difference: card=compact, detail=full)
- Dark mode token updates (Issue 10 — dark mode is a non-goal)
- Padding unification (Issue 9 — both approaches produce identical visual result, skip for now)

## Implementation Approach

Four phases, ordered by dependency:
1. **Lifecycle refactoring** — Extract shared logic, add error fallback type, add expenseRate. This changes the API that components consume.
2. **Component updates** — Update BudgetSummary and BudgetCard for new lifecycle API, fix BalanceBar, apply minor cleanups.
3. **Test fixes** — Update all 13 failing tests to match new component output.
4. **Lifecycle unit tests** — Add comprehensive unit tests for the now-refactored lifecycle module.

---

## Phase 1: Lifecycle Refactoring

### Overview
Refactor `budget-lifecycle.ts` to extract shared locked-state logic, add `locked-error-fallback` type, and include `expenseRate` in `locked-complete`.

### Changes Required:

#### 1. `src/lib/budget-lifecycle.ts`

**Add `locked-error-fallback` to both union types:**

```typescript
export type DetailLifecycleState =
  | { type: 'draft-empty' }
  | { type: 'draft-building'; totals: BudgetTotals }
  | { type: 'draft-balanced'; totals: BudgetTotals }
  | { type: 'locked-in-progress'; totals: BudgetTotals; completed: number; total: number }
  | { type: 'locked-complete'; totals: BudgetTotals; savingsRate: number; expenseRate: number }
  | { type: 'locked-error-fallback'; totals: BudgetTotals }

export type CardLifecycleState =
  | { type: 'draft-unbalanced'; balance: number }
  | { type: 'draft-balanced'; balance: number }
  | { type: 'locked-in-progress'; completed: number; total: number }
  | { type: 'locked-complete'; savingsRate: number }
  | { type: 'locked-error-fallback'; balance: number }
```

**Extract shared helper `resolveLockedState`:**

```typescript
interface LockedResolution {
  isComplete: boolean
  savingsRate: number
  expenseRate: number
  completed: number
  total: number
}

function resolveLockedState(
  totals: BudgetTotals,
  todoSummary: TodoListSummary,
): LockedResolution {
  const isComplete =
    todoSummary.totalItems === 0 ||
    todoSummary.completedItems === todoSummary.totalItems

  const savingsRate = totals.income > 0
    ? Math.round((totals.savings / totals.income) * 100)
    : 0

  const expenseRate = totals.income > 0
    ? Math.round((totals.expenses / totals.income) * 100)
    : 0

  return {
    isComplete,
    savingsRate,
    expenseRate,
    completed: todoSummary.completedItems,
    total: todoSummary.totalItems,
  }
}
```

**Simplify `deriveDetailLifecycleState`:**

The locked branch becomes:
```typescript
// Locked — need todo data
if (!todoSummary) {
  if (todoError) {
    return { type: 'locked-error-fallback', totals }
  }
  return null // still loading
}

const resolved = resolveLockedState(totals, todoSummary)
if (resolved.isComplete) {
  return { type: 'locked-complete', totals, savingsRate: resolved.savingsRate, expenseRate: resolved.expenseRate }
}
return { type: 'locked-in-progress', totals, completed: resolved.completed, total: resolved.total }
```

**Simplify `deriveCardLifecycleState`:**

The locked branch becomes:
```typescript
// Locked — need todo data
if (!todoSummary) {
  if (todoError) {
    return { type: 'locked-error-fallback', balance: totals.balance }
  }
  return null // still loading
}

const resolved = resolveLockedState(totals, todoSummary)
if (resolved.isComplete) {
  return { type: 'locked-complete', savingsRate: resolved.savingsRate }
}
return { type: 'locked-in-progress', completed: resolved.completed, total: resolved.total }
```

**Export `TODO_STALE_TIME` constant:**

```typescript
/** Shared staleTime for todo queries — todos rarely change, 5 minutes is fine */
export const TODO_STALE_TIME = 5 * 60 * 1000
```

### Success Criteria:

#### Automated Verification:
- [x] `npm run build` passes (no type errors)
- [x] Existing BudgetCard and BudgetSummary tests still compile (they'll fail at runtime until Phase 2, but should type-check since we're adding types, not removing)

---

## Phase 2: Component Updates

### Overview
Update components to handle new lifecycle states, fix BalanceBar, extract renderHero container, and apply minor cleanups.

### Changes Required:

#### 1. `src/components/budget-detail/BudgetSummary.tsx`

**Fix BalanceBar floating-point check (line 27):**
```typescript
// Before:
const isBalanced = income > 0 && expenses + savings === income
// After:
const isBalanced = income > 0 && isBudgetBalanced(income - expenses - savings)
```
Add `isBudgetBalanced` to the imports from `@/lib/utils`.

**Add `locked-error-fallback` case to `renderContent()` switch:**
```typescript
case 'locked-error-fallback':
  return <DraftBuilding state={{ ...state, type: 'draft-building' } as any} />
```
Wait — this is hacky. Better: create a simple `LockedErrorFallback` renderer:
```typescript
function LockedErrorFallback({ state }: { state: Extract<DetailLifecycleState, { type: 'locked-error-fallback' }> }) {
  const { totals } = state
  return (
    <div className="space-y-3">
      <BalanceBar income={totals.income} expenses={totals.expenses} savings={totals.savings} subdued />
      <StatsRow income={totals.income} expenses={totals.expenses} savings={totals.savings} />
    </div>
  )
}
```
This shows the budget stats with a subdued bar but no misleading progress or balance info.

Add to `renderContent()`:
```typescript
case 'locked-error-fallback':
  return <LockedErrorFallback state={state} />
```

**Remove local percentage calculations from `LockedComplete` (lines 205-206):**
Replace with `expenseRate` from state:
```typescript
// Before:
const expensePercent = totals.income > 0 ? Math.round((totals.expenses / totals.income) * 100) : 0
const savingsPercent = totals.income > 0 ? Math.round((totals.savings / totals.income) * 100) : 0
// After:
const { totals, savingsRate, expenseRate } = state
```
Update references: `expensePercent` → `expenseRate`, `savingsPercent` → use `savingsRate` (already available from state) for the savings percentage display.

Wait — `savingsRate` is used in the summary message on line 232, and `savingsPercent` in the grid on line 228. They're the same value. So:
- Line 223: use `state.expenseRate` instead of `expensePercent`
- Line 228: use `state.savingsRate` instead of `savingsPercent`
- Remove lines 205-206 entirely
- Destructure `expenseRate` from state on line 204

**Consolidate duplicate imports (lines 4 and 8):**
```typescript
// Before:
import { formatCurrency, getMonthName } from '@/lib/utils'
// ... other imports ...
import { cn } from '@/lib/utils'

// After:
import { cn, formatCurrency, getMonthName, isBudgetBalanced } from '@/lib/utils'
```

**Use `TODO_STALE_TIME` constant (line 264):**
```typescript
import { deriveDetailLifecycleState, TODO_STALE_TIME } from '@/lib/budget-lifecycle'
// ...
const { data: todoData, isError: todoError } = useTodoList(budget.id, {
  enabled: isLocked,
  staleTime: TODO_STALE_TIME,
})
```

#### 2. `src/components/budgets/BudgetCard.tsx`

**Remove unnecessary type assertion (line 17):**
```typescript
// Before:
const isLocked: boolean = budget.status === ('LOCKED' as BudgetStatus)
// After:
const isLocked = budget.status === 'LOCKED'
```
Also remove `BudgetStatus` from the import if no longer used.

**Extract renderHero container wrapper (lines 30-81):**
```typescript
function renderHero() {
  function renderHeroContent() {
    if (state === null) {
      return (
        <>
          <span className="text-sm text-foreground font-medium">Todos</span>
          <div className="h-7 w-24 bg-muted animate-pulse rounded" />
        </>
      )
    }

    switch (state.type) {
      case 'draft-unbalanced':
        return (
          <>
            <span className="text-sm text-foreground font-medium">Balance</span>
            <span className={`text-xl tabular-nums font-semibold ${state.balance >= 0 ? 'text-income' : 'text-expense'}`}>
              {formatCurrencyCompact(state.balance)}
            </span>
          </>
        )
      case 'draft-balanced':
        return (
          <>
            <span className="text-sm text-foreground font-medium">Balance</span>
            <span className="text-xl tabular-nums font-semibold text-income">
              {formatCurrencyCompact(state.balance)}
            </span>
          </>
        )
      case 'locked-in-progress':
        return (
          <>
            <span className="text-sm text-foreground font-medium">Todos</span>
            <span className="text-xl font-semibold text-muted-foreground flex items-center gap-1.5">
              <ListChecks className="w-5 h-5" />
              {state.completed}/{state.total} done
            </span>
          </>
        )
      case 'locked-complete':
        return (
          <>
            <span className="text-sm text-foreground font-medium">Saved</span>
            <span className="text-xl tabular-nums font-semibold text-income flex items-center gap-1.5">
              <TrendingUp className="w-5 h-5" />
              {state.savingsRate}%
            </span>
          </>
        )
      case 'locked-error-fallback':
        return (
          <>
            <span className="text-sm text-foreground font-medium">Balance</span>
            <span className="text-xl tabular-nums font-semibold text-muted-foreground">
              {formatCurrencyCompact(state.balance)}
            </span>
          </>
        )
    }
  }

  return (
    <div className="flex justify-between items-baseline pt-3 mt-2 border-t border-border">
      {renderHeroContent()}
    </div>
  )
}
```

**Use `TODO_STALE_TIME` constant (line 21):**
```typescript
import { deriveCardLifecycleState, TODO_STALE_TIME } from '@/lib/budget-lifecycle'
// ...
staleTime: TODO_STALE_TIME,
```

#### 3. `src/index.css` — Rename `animate-strikethrough` to `transition-strikethrough`

Line 288:
```css
/* Before: */
.animate-strikethrough {
/* After: */
.transition-strikethrough {
```

#### 4. `src/components/todo/TodoItemRow.tsx` — Update class name references

Lines 57 and 65: replace `animate-strikethrough` with `transition-strikethrough`.

### Success Criteria:

#### Automated Verification:
- [x] `npm run build` passes (no type errors)
- [x] App renders correctly: `npm run dev` and visually check budget detail + card grid

#### Manual Verification:
- [x] Budget detail page renders all 5 lifecycle states correctly (plus error fallback)
- [x] Budget card grid renders all states correctly
- [x] LockedComplete shows expense/savings percentages from lifecycle state
- [x] Todo item strikethrough animation still works after CSS rename

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.

---

## Phase 3: Fix Failing Tests

### Overview
Update 5 test files (13 assertions) to match new component behavior.

### Changes Required:

#### 1. `src/components/todo/TodoItemRow.test.tsx`

**"renders item name" (line 42-46):**
Currently expects `'Pay Rent'`. The component's `getDisplayName()` strips "Pay " prefix, so mock item `name: 'Pay Rent'` renders as `'Rent'`.
```typescript
// Before:
expect(screen.getByText('Pay Rent')).toBeInTheDocument()
// After:
expect(screen.getByText('Rent')).toBeInTheDocument()
```

**"renders item amount" (line 48-52):**
`formatCurrencySmart(8000)` returns `'8 000 kr'` (0 decimals for whole numbers).
```typescript
// Before:
expect(screen.getByText(/8 000,00 kr/)).toBeInTheDocument()
// After:
expect(screen.getByText(/8 000 kr/)).toBeInTheDocument()
```

**"applies strikethrough to completed items" (line 68-73):**
Test expects to find `'Transfer to Savings'` text. Now renders `'Main Account → Savings Account'`.
```typescript
// Before:
const name = screen.getByText('Transfer to Savings')
// After:
const name = screen.getByText('Main Account → Savings Account')
```

**"shows Payment badge" (line 75-79) — DELETE:**
Badges were removed entirely from the component. Remove this test.

**"shows Transfer badge" (line 81-85) — DELETE:**
Badges were removed entirely. Remove this test.

**"shows destination account for transfer items" (line 87-91):**
Transfer now shows `"Main Account → Savings Account"` via `getDisplayName()`. The destination is part of the display name, not a separate "To: " element.
```typescript
// Before:
expect(screen.getByText(/to: savings account/i)).toBeInTheDocument()
// After:
expect(screen.getByText(/Main Account → Savings Account/)).toBeInTheDocument()
```

#### 2. `src/components/todo/TodoItemList.test.tsx`

**"renders payment items under Payments section" (line 43-49):**
`getDisplayName()` strips "Pay " prefix. `name: 'Pay Rent'` → `'Rent'`, `name: 'Pay Insurance'` → `'Insurance'`.
```typescript
// Before:
expect(screen.getByText('Pay Rent')).toBeInTheDocument()
expect(screen.getByText('Pay Insurance')).toBeInTheDocument()
// After:
expect(screen.getByText('Rent')).toBeInTheDocument()
expect(screen.getByText('Insurance')).toBeInTheDocument()
```

**"renders transfer items under Transfers section" (line 51-56):**
`name: 'Transfer to Savings'` is a TRANSFER type, so `getDisplayName()` returns `"Main Account → Savings Account"`.
```typescript
// Before:
expect(screen.getByText('Transfer to Savings')).toBeInTheDocument()
// After:
expect(screen.getByText('Main Account → Savings Account')).toBeInTheDocument()
```

**"shows destination account for transfer items" (line 58-62):**
```typescript
// Before:
expect(screen.getByText(/to: savings account/i)).toBeInTheDocument()
// After:
expect(screen.getByText(/Main Account → Savings Account/)).toBeInTheDocument()
```

**"shows amounts for all items" (line 64-70):**
`formatCurrencySmart` returns 0 decimals for whole numbers.
```typescript
// Before:
expect(screen.getByText(/8 000,00 kr/)).toBeInTheDocument()
expect(screen.getByText(/500,00 kr/)).toBeInTheDocument()
expect(screen.getByText(/5 000,00 kr/)).toBeInTheDocument()
// After:
expect(screen.getByText(/8 000 kr/)).toBeInTheDocument()
expect(screen.getByText(/500 kr/)).toBeInTheDocument()
expect(screen.getByText(/5 000 kr/)).toBeInTheDocument()
```

#### 3. `src/pages/TodoListPage.test.tsx`

**"shows todo items" (line 101-108):**
```typescript
// Before:
expect(screen.getByText('Pay Rent')).toBeInTheDocument()
expect(screen.getByText(/transfer to savings/i)).toBeInTheDocument()
// After:
expect(screen.getByText('Rent')).toBeInTheDocument()
expect(screen.getByText(/Main Account → Savings Account/)).toBeInTheDocument()
```

#### 4. `src/components/layout/Header.test.tsx`

**"renders app title" (line 7-11) — DELETE:**
Header no longer renders "Balance" text. It's just a mobile menu button now.

#### 5. `src/components/layout/AppLayout.test.tsx`

**"renders sidebar with app title" (line 7-12):**
"Balance" now appears only once (in Sidebar), not twice (was in Sidebar + Header).
```typescript
// Before:
expect(screen.getAllByText('Balance')).toHaveLength(2)
// After:
expect(screen.getByText('Balance')).toBeInTheDocument()
```

### Success Criteria:

#### Automated Verification:
- [x] `npm test` — all tests pass (474/474)
- [x] No test failures

---

## Phase 4: Lifecycle Unit Tests

### Overview
Add comprehensive unit tests for `budget-lifecycle.ts` — the core state machine with 6 code paths per derive function.

### Changes Required:

#### 1. Create `src/lib/budget-lifecycle.test.ts`

Test both derive functions exhaustively:

```typescript
import { describe, it, expect } from 'vitest'
import {
  deriveDetailLifecycleState,
  deriveCardLifecycleState,
} from './budget-lifecycle'
import type { BudgetTotals, TodoListSummary } from '@/api/types'

// ---- Test helpers ----

const baseTotals: BudgetTotals = {
  income: 50000,
  expenses: 35000,
  savings: 15000,
  balance: 0,
}

const unbalancedTotals: BudgetTotals = {
  income: 50000,
  expenses: 30000,
  savings: 10000,
  balance: 10000,
}

const zeroTotals: BudgetTotals = {
  income: 0,
  expenses: 0,
  savings: 0,
  balance: 0,
}

const completeSummary: TodoListSummary = {
  totalItems: 5,
  completedItems: 5,
  pendingItems: 0,
}

const inProgressSummary: TodoListSummary = {
  totalItems: 5,
  completedItems: 3,
  pendingItems: 2,
}

const emptySummary: TodoListSummary = {
  totalItems: 0,
  completedItems: 0,
  pendingItems: 0,
}

// ---- Detail Lifecycle ----

describe('deriveDetailLifecycleState', () => {
  describe('draft states', () => {
    it('returns draft-empty when unlocked with no items', () => {
      const result = deriveDetailLifecycleState(zeroTotals, false, false, undefined, false)
      expect(result).toEqual({ type: 'draft-empty' })
    })

    it('returns draft-building when unlocked and unbalanced', () => {
      const result = deriveDetailLifecycleState(unbalancedTotals, false, true, undefined, false)
      expect(result).toEqual({ type: 'draft-building', totals: unbalancedTotals })
    })

    it('returns draft-balanced when unlocked and balanced', () => {
      const result = deriveDetailLifecycleState(baseTotals, false, true, undefined, false)
      expect(result).toEqual({ type: 'draft-balanced', totals: baseTotals })
    })

    it('treats near-zero balance as balanced (epsilon)', () => {
      const almostBalanced = { ...baseTotals, balance: 0.005 }
      const result = deriveDetailLifecycleState(almostBalanced, false, true, undefined, false)
      expect(result?.type).toBe('draft-balanced')
    })
  })

  describe('locked states', () => {
    it('returns null when loading (no summary, no error)', () => {
      const result = deriveDetailLifecycleState(baseTotals, true, true, undefined, false)
      expect(result).toBeNull()
    })

    it('returns locked-error-fallback on todo fetch error', () => {
      const result = deriveDetailLifecycleState(baseTotals, true, true, undefined, true)
      expect(result).toEqual({ type: 'locked-error-fallback', totals: baseTotals })
    })

    it('returns locked-in-progress when todos incomplete', () => {
      const result = deriveDetailLifecycleState(baseTotals, true, true, inProgressSummary, false)
      expect(result).toEqual({
        type: 'locked-in-progress',
        totals: baseTotals,
        completed: 3,
        total: 5,
      })
    })

    it('returns locked-complete when all todos done', () => {
      const result = deriveDetailLifecycleState(baseTotals, true, true, completeSummary, false)
      expect(result).toEqual({
        type: 'locked-complete',
        totals: baseTotals,
        savingsRate: 30,
        expenseRate: 70,
      })
    })

    it('returns locked-complete when todo list is empty', () => {
      const result = deriveDetailLifecycleState(baseTotals, true, true, emptySummary, false)
      expect(result?.type).toBe('locked-complete')
    })

    it('handles zero income gracefully (0% rates)', () => {
      const result = deriveDetailLifecycleState(zeroTotals, true, false, completeSummary, false)
      expect(result).toMatchObject({ savingsRate: 0, expenseRate: 0 })
    })
  })
})

// ---- Card Lifecycle ----

describe('deriveCardLifecycleState', () => {
  describe('draft states', () => {
    it('returns draft-balanced when unlocked and balanced', () => {
      const result = deriveCardLifecycleState(baseTotals, false, undefined, false)
      expect(result).toEqual({ type: 'draft-balanced', balance: 0 })
    })

    it('returns draft-unbalanced when unlocked and unbalanced', () => {
      const result = deriveCardLifecycleState(unbalancedTotals, false, undefined, false)
      expect(result).toEqual({ type: 'draft-unbalanced', balance: 10000 })
    })
  })

  describe('locked states', () => {
    it('returns null when loading', () => {
      const result = deriveCardLifecycleState(baseTotals, true, undefined, false)
      expect(result).toBeNull()
    })

    it('returns locked-error-fallback on error', () => {
      const result = deriveCardLifecycleState(baseTotals, true, undefined, true)
      expect(result).toEqual({ type: 'locked-error-fallback', balance: 0 })
    })

    it('returns locked-in-progress with counts', () => {
      const result = deriveCardLifecycleState(baseTotals, true, inProgressSummary, false)
      expect(result).toEqual({ type: 'locked-in-progress', completed: 3, total: 5 })
    })

    it('returns locked-complete with savings rate', () => {
      const result = deriveCardLifecycleState(baseTotals, true, completeSummary, false)
      expect(result).toEqual({ type: 'locked-complete', savingsRate: 30 })
    })
  })
})
```

### Success Criteria:

#### Automated Verification:
- [x] `npm test` — all tests pass including new lifecycle tests (490/490)
- [x] Full test suite green: `npm test -- --run`

---

## Testing Strategy

### Unit Tests:
- `budget-lifecycle.test.ts` — exhaustive state derivation (Phase 4)
- Existing component tests updated to match new rendering (Phase 3)

### Edge Cases to Cover:
- Floating-point balance near zero (epsilon comparison)
- Zero income (division by zero in rate calculations)
- Empty todo list (totalItems === 0 treated as complete)
- Todo fetch error for locked budgets

### Manual Testing Steps:
1. Create a draft budget with no items → see "Start building" empty state
2. Add income/expenses → see balance bar and stats
3. Balance the budget → see "Budget balanced" confirmation
4. Lock the budget → see todo progress bar
5. Complete all todos → see "All done" celebration with percentages
6. Verify budget card grid shows matching states
7. Check strikethrough animation on todo items still works

## Performance Considerations

No performance impact. The `resolveLockedState` helper adds one function call indirection — negligible. The `TODO_STALE_TIME` constant is a static value.

## References

- Research document: `.claude/thoughts/research/2026-02-22-design-system-evolution-branch-review.md`
- Lifecycle module: `src/lib/budget-lifecycle.ts`
- Budget detail: `src/components/budget-detail/BudgetSummary.tsx`
- Budget card: `src/components/budgets/BudgetCard.tsx`
- Todo row: `src/components/todo/TodoItemRow.tsx`
- CSS utilities: `src/index.css:288-291`
