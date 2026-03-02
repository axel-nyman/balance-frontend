# Fix Mobile Keyboard Blocking Wizard Item Modal

## Overview

When opening the WizardItemEditModal on mobile (via "Add Income/Expense/Savings"), the Name input is auto-focused by Radix Dialog, which immediately opens the virtual keyboard. The browser doesn't adjust the viewport in time, so the keyboard covers the bottom sheet. The user has to deselect and re-select the field for the UI to adjust properly.

## Current State Analysis

- `WizardItemEditModal` (`src/components/wizard/WizardItemEditModal.tsx`) uses `Sheet` (Radix Dialog) with `side="bottom"`
- Three wizard steps auto-open this modal on mobile when adding a new item:
  - `StepIncome.tsx:74` — `setEditingItem(newItem)`
  - `StepExpenses.tsx:118` — `setEditingItem(newItem)`
  - `StepSavings.tsx:83` — `setEditingItem(newItem)`
- Radix Dialog auto-focuses the first focusable element (the Name `<Input>`) on open
- The `SheetContent` component passes `{...props}` through to `SheetPrimitive.Content`, so it already supports `onOpenAutoFocus`
- No `onOpenAutoFocus` override exists anywhere in the codebase currently

## Desired End State

When the mobile bottom sheet opens, no input field is auto-focused. The keyboard does not open automatically. The user taps the field they want to edit, at which point the browser properly adjusts the viewport and the keyboard does not block the modal.

## What We're NOT Doing

- Not adding `visualViewport` resize listeners or JavaScript viewport management
- Not changing the Sheet/Dialog UI components themselves
- Not adding a delayed focus mechanism (too fragile across devices)
- Not changing desktop behavior (desktop doesn't use the Sheet modal)

## Implementation Approach

Prevent Radix's default auto-focus behavior by passing `onOpenAutoFocus` with `preventDefault()` to the `SheetContent` component in `WizardItemEditModal`.

## Phase 1: Prevent Auto-Focus on Sheet Open

### Changes Required:

#### 1. WizardItemEditModal
**File**: `src/components/wizard/WizardItemEditModal.tsx`
**Changes**: Add `onOpenAutoFocus` handler to `SheetContent` to prevent auto-focus

```tsx
<SheetContent
  side="bottom"
  className="rounded-t-2xl"
  onOpenAutoFocus={(e) => e.preventDefault()}
>
```

This is the only change needed. The `SheetContent` component already spreads `...props` to `SheetPrimitive.Content` (which is Radix's `DialogContent`), so `onOpenAutoFocus` is already a supported prop.

### Success Criteria:

#### Automated Verification:
- [x] TypeScript compiles: `npm run build`
- [x] Tests pass: `npm test`

#### Manual Verification:
- [x] On mobile, tap "Add Income/Expense/Savings" — the bottom sheet opens without the keyboard appearing
- [x] Tapping the Name field opens the keyboard and the modal properly adjusts above it
- [x] Tapping the Amount field works the same way
- [x] The modal still functions correctly (save, delete, close all work)
- [x] Desktop behavior is unchanged (desktop uses table rows, not the Sheet modal)

## References

- Radix Dialog `onOpenAutoFocus`: https://www.radix-ui.com/primitives/docs/components/dialog#content
- `WizardItemEditModal.tsx:142-143` — Sheet with `side="bottom"`
- `sheet.tsx:58-79` — SheetContent passes `{...props}` to Radix Content
