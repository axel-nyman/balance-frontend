---
date: 2026-01-04T14:30:00+01:00
researcher: Claude
git_commit: a0457d23cd7ad83c5088ac20905bb25898cc011f
branch: main
repository: balance-frontend
topic: "CI Test Failures - Router Context Issues"
tags: [research, testing, ci, react-router, vitest]
status: complete
last_updated: 2026-01-04
last_updated_by: Claude
---

# Research: CI Test Failures - Router Context Issues

**Date**: 2026-01-04T14:30:00+01:00
**Researcher**: Claude
**Git Commit**: a0457d23cd7ad83c5088ac20905bb25898cc011f
**Branch**: main
**Repository**: balance-frontend

## Research Question

When pushing to main, the CI testing results in errors that don't occur locally. What is causing these test failures in GitHub Actions?

## Summary

The CI test failures are caused by **React Router context not being available** to nested components during test execution. Three test files fail with 11 total test failures:

1. **`src/pages/TodoListPage.test.tsx`** - 6 tests fail
2. **`src/pages/BudgetDetailPage.test.tsx`** - 4 tests fail
3. **`src/App.test.tsx`** - 1 test fails

The root cause is that while these tests wrap components in `MemoryRouter`, the router context is returning `null` when accessed by nested components. This manifests as two distinct errors:
- `useNavigate() may be used only in the context of a <Router> component`
- `Cannot destructure property 'basename' of 'React10.useContext(...)' as it is null`

## Detailed Findings

### Failing Test Files

#### 1. TodoListPage.test.tsx

**Location**: `src/pages/TodoListPage.test.tsx`

**Error**:
```
TypeError: Cannot destructure property 'basename' of 'React10.useContext(...)' as it is null.
❯ LinkWithRef node_modules/react-router/dist/development/chunk-JMJ3UQ3L.mjs:9860:11
```

**Test Setup (lines 58-76)**:
- Creates custom `renderWithRouter` helper
- Wraps in `QueryClientProvider` with fresh `QueryClient`
- Wraps in `MemoryRouter` with `initialEntries={['/budgets/${budgetId}/todo']}`
- Sets up `Routes` and `Route` for path `/budgets/:id/todo`

**Analysis**: The test structure appears correct. The `TodoListPage` component uses `<Link>` components which require router context. Despite the `MemoryRouter` wrapper, the `Link` component receives `null` from `useContext()`.

#### 2. BudgetDetailPage.test.tsx

**Location**: `src/pages/BudgetDetailPage.test.tsx`

**Error**:
```
Error: useNavigate() may be used only in the context of a <Router> component.
❯ BudgetActions src/components/budget-detail/BudgetActions.tsx:16:20
```

**Test Setup (lines 50-68)**:
- Creates custom `renderWithRouter` helper
- Wraps in `QueryClientProvider` with fresh `QueryClient`
- Wraps in `MemoryRouter` with `initialEntries={['/budgets/${budgetId}']}`
- Sets up `Routes` and `Route` for path `/budgets/:id`

**Additional Setup (lines 10-18)**:
- Mocks `useNavigate` via `vi.mock('react-router', ...)`
- Uses `vi.importActual` to preserve other exports

**Analysis**: The test mocks `useNavigate` at the module level, but the error originates from `BudgetActions` component (a child of `BudgetDetailPage`). The mock may not be applying to all modules that import `useNavigate`, or the router context itself is not being provided correctly.

#### 3. App.test.tsx

**Location**: `src/App.test.tsx`

**Error**:
```
Error: useNavigate() may be used only in the context of a <Router> component.
❯ BudgetsPage src/pages/BudgetsPage.tsx:9:20
```

**Test Setup (lines 19-32)**:
- Creates test `QueryClient` via factory function
- Wraps in `QueryClientProvider`
- Wraps in `MemoryRouter` with `initialEntries={['/']}`
- Sets up routes for redirect test

**Analysis**: The test wraps in `MemoryRouter` but `BudgetsPage` (which uses `useNavigate()` at line 9) still fails. This indicates the router context is not reaching the component.

### Test Infrastructure

#### Test Utils (`src/test/test-utils.tsx`)

The project has a shared test utilities file that provides:
- Custom `render` function wrapping in `QueryClientProvider` and `BrowserRouter`
- Factory function `createTestQueryClient()` for fresh query clients
- Re-exports all Testing Library utilities

**Key observation**: The test-utils use `BrowserRouter`, but the failing tests use `MemoryRouter` with custom wrappers instead.

#### Test Setup (`src/test/setup.ts`)

Global test setup includes:
- MSW server lifecycle management
- Browser API mocks (IntersectionObserver, ResizeObserver, etc.)
- Cleanup after each test

#### Working vs Failing Tests Pattern

**Tests that PASS** use:
- `@/test/test-utils` with `BrowserRouter` wrapper
- Components that don't require route parameters
- Example: `AccountsPage.test.tsx`, `Sidebar.test.tsx`, `ErrorState.test.tsx`

**Tests that FAIL** use:
- Custom `renderWithRouter` helpers with `MemoryRouter`
- Components requiring route parameters (`useParams()`)
- Components with nested routing dependencies

### Potential Root Causes

#### 1. Module Resolution Differences (Most Likely)

In CI environments, module resolution can differ from local development:
- CI uses `npm ci` which strictly follows `package-lock.json`
- Different ESM/CJS resolution paths
- React Router v7 uses chunked ESM builds (`chunk-JMJ3UQ3L.mjs`)

The error `React10.useContext(...)` suggests multiple React instances may be loaded, causing context to not propagate correctly.

#### 2. vi.mock() Hoisting Issues

The `vi.mock('react-router', ...)` in `BudgetDetailPage.test.tsx`:
- May not apply to all transitive imports of `useNavigate`
- Mock hoisting behavior differs between environments
- `vi.importActual` may resolve differently in CI

#### 3. Test Isolation

CI runs with stricter test isolation:
- Fresh module cache for each test file
- No HMR or watch mode caching
- Different test execution order

### Test Results Summary from CI Log

```
src/pages/TodoListPage.test.tsx      (6 tests | 6 failed)
src/pages/BudgetDetailPage.test.tsx  (6 tests | 4 failed)
src/App.test.tsx                     (2 tests | 1 failed)

Failed Tests: 11
```

Plus 4 "Unhandled Errors" (uncaught exceptions from router context issues).

## Code References

- `src/pages/TodoListPage.test.tsx:58-76` - renderWithRouter helper
- `src/pages/BudgetDetailPage.test.tsx:50-68` - renderWithRouter helper
- `src/pages/BudgetDetailPage.test.tsx:10-18` - vi.mock for useNavigate
- `src/App.test.tsx:19-32` - App routing test
- `src/test/test-utils.tsx:1-44` - Shared test utilities with BrowserRouter
- `src/components/budget-detail/BudgetActions.tsx:16` - useNavigate() call
- `src/pages/BudgetsPage.tsx:9` - useNavigate() call

## Architecture Documentation

### Current Test Wrapper Patterns

1. **BrowserRouter pattern** (test-utils.tsx): Works for most component tests
2. **MemoryRouter pattern** (custom): Used for tests needing route params, but fails in CI

### Component Dependencies on Router

Components that use routing hooks:
- `BudgetsPage` - uses `useNavigate()`
- `BudgetDetailPage` - uses `useParams()`
- `BudgetActions` - uses `useNavigate()`
- `TodoListPage` - uses `useParams()` and `<Link>`

## Historical Context

Previous research in `.claude/thoughts/research/2025-12-25-testing-infrastructure.md` documents the testing setup but predates these CI failures.

## Related Research

- `.claude/thoughts/research/2026-01-03-github-actions-cicd.md` - CI/CD setup documentation

## Open Questions

1. Why does `MemoryRouter` context not reach nested components in CI?
2. Are there multiple React instances being loaded in CI?
3. Should failing tests use the shared `test-utils.tsx` pattern instead?
4. Is the `vi.mock('react-router', ...)` pattern causing module resolution issues?
