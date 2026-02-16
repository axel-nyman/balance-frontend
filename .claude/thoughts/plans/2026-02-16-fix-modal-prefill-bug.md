# Fix Budget Item Modal Form Pre-fill Bug

## Overview

Fix a bug where adding consecutive budget items (income, expense, savings) in create mode causes the second modal to be pre-filled with values from the first submission.

## Current State Analysis

All three modal components (`IncomeItemModal`, `ExpenseItemModal`, `SavingsItemModal`) share the same bug pattern:

1. A `useEffect` resets the form based on `[item, reset]` dependencies
2. The `onSubmit` handler closes the modal via `onOpenChange(false)` without calling `reset()`
3. When reopening in create mode, `item` is still `null` (unchanged), so the `useEffect` doesn't re-fire
4. The form retains the previously submitted values

### Key Discoveries:
- `IncomeItemModal.tsx:67-83` — `onSubmit` calls `onOpenChange(false)` without `reset()`
- `ExpenseItemModal.tsx:72-88` — same pattern
- `SavingsItemModal.tsx:67-83` — same pattern
- `handleClose` (used by Cancel/overlay) correctly calls `reset()` before `onOpenChange(false)`

## Desired End State

After a successful form submission, the form is always reset to empty default values before the modal closes. Consecutive "Add" operations always show a clean form.

## What We're NOT Doing

- Changing the `useEffect` dependency array (the effect still serves its purpose for edit-to-create transitions)
- Changing the Dialog mount/unmount behavior
- Refactoring the modal lifecycle or component structure

## Implementation Approach

Add `reset()` before `onOpenChange(false)` in the `onSubmit` handler of each modal. This mirrors what `handleClose` already does and ensures the form is clean after every successful save.

## Phase 1: Add reset() to onSubmit handlers

### Changes Required:

#### 1. IncomeItemModal
**File**: `src/components/budget-detail/IncomeItemModal.tsx`
**Line 79**: Add `reset()` before `onOpenChange(false)`

```tsx
// Before:
      onOpenChange(false)

// After:
      reset()
      onOpenChange(false)
```

#### 2. ExpenseItemModal
**File**: `src/components/budget-detail/ExpenseItemModal.tsx`
**Line 84**: Add `reset()` before `onOpenChange(false)`

```tsx
// Before:
      onOpenChange(false)

// After:
      reset()
      onOpenChange(false)
```

#### 3. SavingsItemModal
**File**: `src/components/budget-detail/SavingsItemModal.tsx`
**Line 79**: Add `reset()` before `onOpenChange(false)`

```tsx
// Before:
      onOpenChange(false)

// After:
      reset()
      onOpenChange(false)
```

### Success Criteria:

#### Automated Verification:
- [x] TypeScript compiles: `npm run build`
- [x] Tests pass: `npm test`

#### Manual Verification:
- [x] Add an income item, close modal, click "Add" again — form is empty
- [x] Add an expense item, close modal, click "Add" again — form is empty
- [x] Add a savings item, close modal, click "Add" again — form is empty
- [x] Edit an existing item — form still pre-fills correctly with existing values
- [x] Cancel button still clears the form properly
- [x] Closing via overlay/X still clears the form properly

## References

- Research: `.claude/thoughts/research/2026-02-16-budget-item-modal-prefill-bug.md`
