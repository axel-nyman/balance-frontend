---
date: 2026-01-01T15:17:37+0100
researcher: Claude
git_commit: fc277e2ebe211f0fdda447388715b883e1c8af72
branch: main
repository: balance-frontend
topic: "Test Failures and Lint Errors Analysis"
tags: [research, testing, linting, vitest, eslint]
status: complete
last_updated: 2026-01-01
last_updated_by: Claude
---

# Research: Test Failures and Lint Errors Analysis

**Date**: 2026-01-01T15:17:37+0100
**Researcher**: Claude
**Git Commit**: fc277e2ebe211f0fdda447388715b883e1c8af72
**Branch**: main
**Repository**: balance-frontend

## Research Question

Identify and document the test failures and lint errors in the codebase.

## Summary

The codebase has **3 failing tests** and **10 lint errors** (plus 7 warnings). All 3 test failures are in `StepIncome.test.tsx` and relate to a mismatch between test expectations (modal-based "Copy from last budget" flow) and the actual implementation (inline quick-add pattern). The lint errors are primarily unused variables and type issues in test utilities.

## Detailed Findings

### Test Failures (3 tests)

All failures are in `src/components/wizard/steps/StepIncome.test.tsx`:

| Test Name | Line | Error |
|-----------|------|-------|
| shows copy from last budget button when budget exists | 119-133 | `Unable to find role="button" and name="/copy from last/i"` |
| opens copy modal when copy button clicked | 141-175 | Same button not found |
| copies selected income items from modal | 177-231 | Same button not found |

**Root Cause**: The tests expect a "Copy from last budget" button that opens a modal with checkboxes to select items. However, the actual `StepIncome.tsx` implementation uses an inline quick-add pattern where:
- Previous budget items appear in a "From last budget" section within the table (line 246-265)
- Each item has an individual Plus button to copy it (line 302-326)
- There is no modal-based copy flow

The test was written for a design that was either never implemented or was replaced with the current inline approach.

### Lint Errors (10 errors)

| File | Line | Error | Description |
|------|------|-------|-------------|
| `UpdateBalanceModal.tsx` | 63 | `@typescript-eslint/no-unused-vars` | `error` is defined in catch block but never used |
| `DeleteRecurringExpenseDialog.tsx` | 22 | `@typescript-eslint/no-unused-vars` | `error` is defined in catch block but never used |
| `WizardIntegration.test.tsx` | 2 | `@typescript-eslint/no-unused-vars` | `within` imported but never used |
| `WizardShell.test.tsx` | 2 | `@typescript-eslint/no-unused-vars` | `within` imported but never used |
| `validation.test.ts` | 108 | `prefer-const` | `monthAfterNext` should use `const` instead of `let` |
| `validation.test.ts` | 109 | `prefer-const` | `yearAfterNext` should use `const` instead of `let` |
| `setup.ts` | 13 | `@typescript-eslint/no-unused-vars` | `_callback` in MockIntersectionObserver unused |
| `setup.ts` | 14 | `@typescript-eslint/no-unused-vars` | `_options` in MockIntersectionObserver unused |
| `setup.ts` | 28 | `@typescript-eslint/no-unused-vars` | `_callback` in MockResizeObserver unused |
| `test-utils.tsx` | 34 | `@typescript-eslint/no-explicit-any` | `ReactElement<any>` uses explicit `any` type |

### Lint Warnings (7 warnings)

| File | Line | Warning | Description |
|------|------|---------|-------------|
| `badge.tsx` | 46 | `react-refresh/only-export-components` | Exports non-component `badgeVariants` |
| `button.tsx` | 62 | `react-refresh/only-export-components` | Exports non-component `buttonVariants` |
| `WizardContext.tsx` | 89 | `react-refresh/only-export-components` | Exports non-component `useWizard` |
| `StepMonthYear.tsx` | 76 | `react-hooks/exhaustive-deps` | `existingBudgets` logical expression in useEffect deps |
| `StepMonthYear.tsx` | 76 | `react-hooks/exhaustive-deps` | Same issue affects second useEffect |
| `test-utils.tsx` | 21 | `react-refresh/only-export-components` | Non-component exports |
| `test-utils.tsx` | 41 | `react-refresh/only-export-components` | `export *` can't verify components-only |

## Code References

- `src/components/wizard/steps/StepIncome.test.tsx:119-133` - First failing test
- `src/components/wizard/steps/StepIncome.tsx:246-265` - "From last budget" section (actual implementation)
- `src/components/wizard/steps/StepIncome.tsx:302-326` - Individual copy buttons (actual implementation)
- `src/components/accounts/UpdateBalanceModal.tsx:63` - Unused error variable
- `src/components/recurring-expenses/DeleteRecurringExpenseDialog.tsx:22` - Unused error variable
- `src/test/setup.ts:13-14,28` - Unused constructor parameters in mock classes
- `src/test/test-utils.tsx:34` - `any` type in customRender function
- `src/components/wizard/validation.test.ts:108-109` - let should be const

## Architecture Documentation

The test structure follows a standard pattern:
- `src/test/setup.ts` - Global test setup with MSW server and DOM mocks
- `src/test/test-utils.tsx` - Custom render with QueryClient and Router providers
- `src/test/mocks/server.ts` - MSW server for API mocking
- Tests co-located with components (e.g., `Component.test.tsx`)

The codebase uses:
- Vitest for test runner
- Testing Library for component testing
- MSW for API mocking
- ESLint with TypeScript and React rules

## Open Questions

1. Should the 3 failing tests be updated to match the current inline implementation, or was the modal-based design intended and the component needs updating?
2. The underscore-prefixed parameters in mock classes (`_callback`, `_options`) follow TypeScript convention for unused params but ESLint flags them - should a rule exception be added?
