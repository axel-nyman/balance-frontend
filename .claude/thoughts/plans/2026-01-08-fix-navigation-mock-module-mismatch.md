# Fix Navigation Mock Module Mismatch

## Overview

Fix 5 failing tests caused by a module mismatch: tests mock `react-router-dom` while source files import from `react-router`. Since Vitest's `vi.mock()` only intercepts the exact module path specified, the mocks don't intercept the actual imports, causing navigation assertions to fail.

## Current State Analysis

### Failing Tests (5 total)

| Test File | Test Name | Issue |
|-----------|-----------|-------|
| `BudgetCard.test.tsx` | "navigates to budget detail on click" | `mockNavigate` never called |
| `BudgetsPage.test.tsx` | "navigates to wizard when new budget button is clicked" | `mockNavigate` never called |
| `BudgetDetailPage.test.tsx` | "navigates to todo list on View Todo List click" | `mockNavigate` never called |
| `BudgetDetailPage.test.tsx` | "navigates to budgets on back button click" | `mockNavigate` never called |
| `WizardIntegration.test.tsx` | "completes full wizard flow and saves budget" | `mockNavigate` never called |

### Root Cause

Test files use:
```typescript
vi.mock('react-router-dom', async () => { ... })
```

Source files import from:
```typescript
import { useNavigate } from 'react-router'
```

Since the mock targets `react-router-dom` but components import from `react-router`, the mock is never applied to the actual code.

### Key Discoveries

- Source files already standardized on `react-router` (Phase 1 of previous plan completed)
- `test-utils.tsx` imports from `react-router` (correct)
- 6 test files still mock `react-router-dom` instead of `react-router`

## Desired End State

All 5 failing navigation tests pass. Test mocks correctly intercept `useNavigate` calls from components.

### Verification
- `npm test` passes with 0 failures
- All navigation assertions work correctly

## What We're NOT Doing

- Not changing component behavior
- Not refactoring test structure
- Not adding new tests
- Not addressing the unrelated `act()` warnings for Select components

## Implementation Approach

Simple find-and-replace: change `vi.mock('react-router-dom'` to `vi.mock('react-router'` in all affected test files.

---

## Phase 1: Fix Module Mocks in Test Files

### Overview

Update 6 test files to mock `react-router` instead of `react-router-dom`.

### Changes Required

#### 1. BudgetCard.test.tsx

**File**: `src/components/budgets/BudgetCard.test.tsx`
**Line**: 9
**Change**: Replace module name in mock

```typescript
// Before
vi.mock('react-router-dom', async () => {

// After
vi.mock('react-router', async () => {
```

Also update line 10:
```typescript
// Before
const actual = await vi.importActual('react-router-dom')

// After
const actual = await vi.importActual('react-router')
```

#### 2. BudgetsPage.test.tsx

**File**: `src/pages/BudgetsPage.test.tsx`
**Line**: 11
**Change**: Replace module name in mock

```typescript
// Before
vi.mock('react-router-dom', async () => {

// After
vi.mock('react-router', async () => {
```

Also update line 12:
```typescript
// Before
const actual = await vi.importActual('react-router-dom')

// After
const actual = await vi.importActual('react-router')
```

#### 3. BudgetGrid.test.tsx

**File**: `src/components/budgets/BudgetGrid.test.tsx`
**Line**: 8
**Change**: Replace module name in mock

```typescript
// Before
vi.mock('react-router-dom', async () => {

// After
vi.mock('react-router', async () => {
```

Also update line 9:
```typescript
// Before
const actual = await vi.importActual('react-router-dom')

// After
const actual = await vi.importActual('react-router')
```

#### 4. WizardIntegration.test.tsx

**File**: `src/components/wizard/WizardIntegration.test.tsx`
**Line**: 10
**Change**: Replace module name in mock

```typescript
// Before
vi.mock('react-router-dom', async () => {

// After
vi.mock('react-router', async () => {
```

Also update line 11:
```typescript
// Before
const actual = await vi.importActual('react-router-dom')

// After
const actual = await vi.importActual('react-router')
```

#### 5. WizardShell.test.tsx

**File**: `src/components/wizard/WizardShell.test.tsx`
**Line**: 11
**Change**: Replace module name in mock

```typescript
// Before
vi.mock('react-router-dom', async () => {

// After
vi.mock('react-router', async () => {
```

Also update line 12:
```typescript
// Before
const actual = await vi.importActual('react-router-dom')

// After
const actual = await vi.importActual('react-router')
```

#### 6. BudgetActions.test.tsx

**File**: `src/components/budget-detail/BudgetActions.test.tsx`
**Line**: 9
**Change**: Replace module name in mock

```typescript
// Before
vi.mock('react-router-dom', async () => {

// After
vi.mock('react-router', async () => {
```

Also update line 10:
```typescript
// Before
const actual = await vi.importActual('react-router-dom')

// After
const actual = await vi.importActual('react-router')
```

### Success Criteria

#### Automated Verification:
- [x] All tests pass: `npm test`
- [x] Build succeeds: `npm run build`
- [x] Lint passes: `npm run lint`

#### Manual Verification:
- [x] CI workflow passes on push

---

## Testing Strategy

### Automated Tests
Run `npm test` to verify:
1. The 5 previously failing navigation tests now pass
2. No regressions in other tests

### Expected Test Output
All tests should pass, particularly:
- `BudgetCard.test.tsx` - "navigates to budget detail on click"
- `BudgetsPage.test.tsx` - "navigates to wizard when new budget button is clicked"
- `WizardIntegration.test.tsx` - "completes full wizard flow and saves budget"

## References

- Research: `.claude/thoughts/research/2026-01-06-test-failures-navigation-mock-mismatch.md`
- Previous plan: `.claude/thoughts/plans/2026-01-06-fix-ci-router-context-failures.md`
- React Router v7 uses `react-router` as primary package
