---
date: 2026-01-06T11:55:00+01:00
researcher: Claude
git_commit: a0457d23cd7ad83c5088ac20905bb25898cc011f
branch: main
repository: balance-frontend
topic: "Test Failures - Navigation Mock Module Mismatch"
tags: [research, testing, react-router, vitest, navigation]
status: complete
last_updated: 2026-01-06
last_updated_by: Claude
---

# Research: Test Failures - Navigation Mock Module Mismatch

**Date**: 2026-01-06T11:55:00+01:00
**Researcher**: Claude
**Git Commit**: a0457d23cd7ad83c5088ac20905bb25898cc011f
**Branch**: main
**Repository**: balance-frontend

## Research Question

Which tests fail in this codebase and why?

## Summary

**5 tests fail across 4 test files**, all related to navigation testing. The root cause is a **module name mismatch**: test files mock `react-router-dom` while component files import from `react-router`. Since the mock doesn't intercept the actual module being used, navigation functions aren't captured and assertions fail.

### Failing Tests

| Test File | Failing Test | Expected Call |
|-----------|--------------|---------------|
| `BudgetCard.test.tsx` | "navigates to budget detail on click" | `mockNavigate('/budgets/123')` |
| `BudgetsPage.test.tsx` | "navigates to wizard when new budget button is clicked" | `mockNavigate('/budgets/new')` |
| `BudgetDetailPage.test.tsx` | "navigates to todo list on View Todo List click" | `mockNavigate('/budgets/1/todo')` |
| `BudgetDetailPage.test.tsx` | "navigates to budgets on back button click" | `mockNavigate('/budgets')` |
| `WizardIntegration.test.tsx` | "completes full wizard flow and saves budget" | `mockNavigate('/budgets/new-budget-123')` |

## Detailed Findings

### Root Cause: Module Import Mismatch

#### Component Files (Source)

All components import from `react-router`:

```
src/pages/BudgetsPage.tsx:1         → import { useNavigate } from 'react-router'
src/pages/BudgetDetailPage.tsx:2    → import { useParams, useNavigate } from 'react-router'
src/components/budgets/BudgetCard.tsx:1    → import { useNavigate } from 'react-router'
src/components/budget-detail/BudgetActions.tsx:2 → import { useNavigate } from 'react-router'
src/components/wizard/WizardShell.tsx:2    → import { useNavigate } from 'react-router'
```

#### Test Files (Mocks)

All test files mock `react-router-dom` (wrong module):

```
src/pages/BudgetsPage.test.tsx:11           → vi.mock('react-router-dom', async () => {...})
src/components/budgets/BudgetCard.test.tsx:9       → vi.mock('react-router-dom', async () => {...})
src/components/wizard/WizardIntegration.test.tsx:10 → vi.mock('react-router-dom', async () => {...})
src/components/budget-detail/BudgetActions.test.tsx:9 → vi.mock('react-router-dom', async () => {...})
```

#### Why This Causes Failures

1. Vitest's `vi.mock('react-router-dom')` intercepts imports from `react-router-dom`
2. Components import from `react-router`, which is NOT intercepted
3. Components receive the real `useNavigate` from `react-router`
4. When navigation occurs, it calls the real function, not `mockNavigate`
5. Test assertions like `expect(mockNavigate).toHaveBeenCalledWith('/path')` fail

### Test Infrastructure

#### Mock Pattern Used (All Failing Tests)

```typescript
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})
```

#### Test Utilities (`src/test/test-utils.tsx`)

Provides two render patterns:
- `render()` - wraps in `BrowserRouter` for simple components
- `renderWithRoute()` - wraps in `MemoryRouter` with `Routes`/`Route` for components needing URL params

Both use `react-router` (correct), not `react-router-dom`.

### Navigation Implementation in Components

All failing components use the same pattern:

1. **BudgetCard** (`BudgetCard.tsx:13,18-20`)
   - Calls `navigate(\`/budgets/${budget.id}\`)` on card click

2. **BudgetsPage** (`BudgetsPage.tsx:9,18-21`)
   - Calls `navigate('/budgets/new')` on "New Budget" button click

3. **BudgetDetailPage** (`BudgetDetailPage.tsx:47,205-211`)
   - Calls `navigate(\`/budgets/${id}/todo\`)` on "View Todo List" button click

4. **BudgetActions** (`BudgetActions.tsx:16,51`)
   - Calls `navigate('/budgets')` after budget deletion

5. **WizardShell** (`WizardShell.tsx:19,85`)
   - Calls `navigate(\`/budgets/${budgetId}\`)` after budget creation

### Test Output Analysis

All failures show the same pattern - `mockNavigate` was expected to be called but wasn't:

```
AssertionError: expected "mockNavigate" to be called with arguments: [ '/budgets/123' ]
Received:
Number of calls: 0
```

## Code References

### Test Files with Mocks
- `src/pages/BudgetsPage.test.tsx:11` - `vi.mock('react-router-dom')`
- `src/components/budgets/BudgetCard.test.tsx:9` - `vi.mock('react-router-dom')`
- `src/pages/BudgetDetailPage.test.tsx:9` - `vi.mock('react-router-dom')`
- `src/components/wizard/WizardIntegration.test.tsx:10` - `vi.mock('react-router-dom')`

### Component Navigation Implementations
- `src/components/budgets/BudgetCard.tsx:13` - `useNavigate()` hook
- `src/pages/BudgetsPage.tsx:9` - `useNavigate()` hook
- `src/pages/BudgetDetailPage.tsx:47` - `useNavigate()` hook
- `src/components/budget-detail/BudgetActions.tsx:16` - `useNavigate()` hook
- `src/components/wizard/WizardShell.tsx:19` - `useNavigate()` hook

### Test Utilities
- `src/test/test-utils.tsx:3` - imports from `react-router` (correct)
- `src/test/test-utils.tsx:40-63` - `renderWithRoute()` helper

## Architecture Documentation

### Current Test Patterns

1. **Module Mock Pattern**: Tests use `vi.mock('react-router-dom')` at module level
2. **Wrapper Pattern**: Test utilities use `BrowserRouter` or `MemoryRouter` from `react-router`
3. **Navigation Testing**: Tests simulate clicks and assert on mock function calls

### React Router Package Usage

The codebase has standardized on `react-router` (React Router v7):
- All source files use `react-router`
- Test utilities use `react-router`
- Only test mocks reference `react-router-dom` (the bug)

## Historical Context (from thoughts/)

### Prior Research
- `.claude/thoughts/research/2026-01-04-ci-test-failures-router-context.md` - Previous research on CI test failures identified router context issues but focused on different failing tests (TodoListPage, App.test.tsx)

### Existing Implementation Plan
- `.claude/thoughts/plans/2026-01-06-fix-ci-router-context-failures.md` - Implementation plan to fix router context issues. **Phase 1 (standardizing source imports) appears completed. Phase 2 (fixing test mocks) is NOT completed.**

## Open Questions

1. Should test mocks be changed from `react-router-dom` to `react-router`?
2. Alternatively, should a different testing approach be used that doesn't require mocking `useNavigate`?
3. Are there other test files with the same mock mismatch that pass by coincidence?

## Additional Findings

### Tests with Same Mock Pattern That Pass

Some tests use the same incorrect mock but pass because they don't assert on navigation:

- `BudgetActions.test.tsx` - mocks `react-router-dom` but doesn't test navigation assertions (focuses on delete modal behavior)
- `BudgetGrid.test.tsx` - mocks `react-router-dom` but only tests rendering
- `WizardShell.test.tsx` - mocks both `useNavigate` and `useBlocker`, tests wizard step navigation not route navigation

### Console Warnings During Tests

Tests also produce `act(...)` warnings for Select component updates, unrelated to the navigation failures:

```
An update to SelectItem inside a test was not wrapped in act(...).
```

These affect:
- `IncomeItemModal.test.tsx`
- `ExpenseItemModal.test.tsx`
- `SavingsItemModal.test.tsx`
- `WizardIntegration.test.tsx`
