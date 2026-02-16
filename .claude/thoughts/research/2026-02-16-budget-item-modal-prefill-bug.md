---
date: 2026-02-16T12:00:00+01:00
researcher: Claude
git_commit: 97bcc2e499ef8b59ced1b1f34382d67d5754ce68
branch: main
repository: balance-frontend
topic: "Budget item modal form pre-fill bug when adding consecutive items"
tags: [research, codebase, budget-detail, modal, react-hook-form, bug]
status: complete
last_updated: 2026-02-16
last_updated_by: Claude
---

# Research: Budget Item Modal Form Pre-fill Bug

**Date**: 2026-02-16
**Researcher**: Claude
**Git Commit**: 97bcc2e499ef8b59ced1b1f34382d67d5754ce68
**Branch**: main
**Repository**: balance-frontend

## Research Question

On the budget details page, when adding several new items (income, expense, savings) consecutively, the second time the "+ add" button is pressed, all fields are pre-filled with values from the first entry. What causes this behaviour?

## Summary

The bug is caused by the `useEffect` dependency array in each modal component (`IncomeItemModal`, `ExpenseItemModal`, `SavingsItemModal`). The effect that resets the form depends on `[item, reset]`, but when opening the modal in "add" (create) mode consecutively, `item` is `null` both times. Since `null === null`, React's dependency comparison sees no change and **skips the effect entirely on the second open**. The form therefore retains the values from the previously submitted entry.

## Detailed Findings

### The Modal Lifecycle

All three modals follow an identical pattern (using `IncomeItemModal` as the example):

1. **Parent state** (`BudgetDetailPage.tsx:54-55`): Two pieces of state control each modal:
   ```tsx
   const [incomeModalOpen, setIncomeModalOpen] = useState(false)
   const [editingIncome, setEditingIncome] = useState<BudgetIncome | null>(null)
   ```

2. **"Add" handler** (`BudgetDetailPage.tsx:71-74`):
   ```tsx
   const handleAddIncome = () => {
     setEditingIncome(null)   // Always sets to null for create mode
     setIncomeModalOpen(true)
   }
   ```

3. **Modal props** (`BudgetDetailPage.tsx:263-268`):
   ```tsx
   <IncomeItemModal
     budgetId={id!}
     item={editingIncome}      // null when adding
     open={incomeModalOpen}
     onOpenChange={setIncomeModalOpen}
   />
   ```

4. **Form reset effect** (`IncomeItemModal.tsx:51-65`):
   ```tsx
   useEffect(() => {
     if (item) {
       reset({ name: item.name, amount: item.amount, bankAccountId: item.bankAccount.id })
     } else {
       reset({ name: '', amount: undefined, bankAccountId: '' })
     }
   }, [item, reset])
   ```

### The Bug Mechanism

Here is the exact sequence of events when the bug manifests:

1. User clicks "+ Add income" -> `handleAddIncome()` sets `editingIncome` to `null` and `incomeModalOpen` to `true`
2. Modal opens, the `useEffect` fires because the component mounts. `item` is `null`, so the form resets to empty values. **Form is clean.**
3. User fills in the form (e.g., "Salary", 25000, Account A) and clicks Save
4. `onSubmit` calls `addIncome.mutateAsync(data)`, then calls `onOpenChange(false)` which is `setIncomeModalOpen`
5. **Crucially**: `onOpenChange(false)` is called directly — it does NOT go through `handleClose()`. The `handleClose` function (which calls `reset()`) is only invoked when the user closes the dialog via the X button, backdrop click, or Cancel button. The successful submit path bypasses `handleClose`.
6. The modal closes (`open` becomes `false`), but the Dialog component still keeps the form mounted in the DOM (Radix Dialog's default behavior with `forceMount` or its internal unmount timing)
7. User clicks "+ Add income" again -> `handleAddIncome()` sets `editingIncome` to `null` (it's already `null`) and `incomeModalOpen` to `true`
8. Modal opens again. The `useEffect` dependency array is `[item, reset]`. Since `item` was `null` before and is still `null`, **React does not re-run the effect**
9. The form still holds the values from step 3: "Salary", 25000, Account A. **Bug manifests.**

### Why `handleClose` Would Have Prevented It

The `handleClose` function (`IncomeItemModal.tsx:85-88`) does call `reset()`:
```tsx
const handleClose = () => {
  reset()
  onOpenChange(false)
}
```

But the successful submit path (`onSubmit`, line 79) only calls `onOpenChange(false)` directly, skipping the `reset()` call. This means after a successful save, the form is never explicitly cleared.

### Component Mount/Unmount Behavior

Whether the form component stays mounted between open/close cycles depends on the Radix Dialog implementation. There are two scenarios, and the bug occurs in both:

- **If the component stays mounted**: The form state persists across open/close because neither `onSubmit` resets the form nor does the `useEffect` re-fire (since `item` doesn't change)
- **If the component unmounts and remounts**: `useForm` initializes with `defaultValues` (which are static: `name: '', amount: undefined, bankAccountId: ''`), so this path would actually produce a clean form. However, the `useEffect` would also fire on mount and reset to clean values. In this case, the bug would NOT manifest.

The fact that the bug IS observed means the Dialog component keeps children mounted when `open` toggles between `true`/`false`. This aligns with how Radix UI Dialog works — it hides content visually but may keep it in the DOM for animation purposes.

### All Three Modals Share the Same Pattern

- `IncomeItemModal.tsx:51-65` — `useEffect` depends on `[item, reset]`
- `ExpenseItemModal.tsx:54-70` — `useEffect` depends on `[item, reset]`
- `SavingsItemModal.tsx:51-65` — `useEffect` depends on `[item, reset]`

All three are equally affected by this bug.

## Code References

- `src/pages/BudgetDetailPage.tsx:54-55` — `incomeModalOpen` and `editingIncome` state declarations
- `src/pages/BudgetDetailPage.tsx:71-74` — `handleAddIncome` handler (sets `editingIncome` to `null`)
- `src/pages/BudgetDetailPage.tsx:263-268` — `IncomeItemModal` rendered with `item={editingIncome}`
- `src/components/budget-detail/IncomeItemModal.tsx:51-65` — `useEffect` with `[item, reset]` dependency
- `src/components/budget-detail/IncomeItemModal.tsx:67-83` — `onSubmit` handler (calls `onOpenChange(false)` without `reset()`)
- `src/components/budget-detail/IncomeItemModal.tsx:85-88` — `handleClose` handler (calls `reset()` then `onOpenChange(false)`)
- `src/components/budget-detail/ExpenseItemModal.tsx:54-70` — Same pattern in expense modal
- `src/components/budget-detail/SavingsItemModal.tsx:51-65` — Same pattern in savings modal

## Architecture Documentation

The budget detail page uses a common React pattern where a single modal component handles both "create" and "edit" modes, distinguished by whether `item` is `null` or an object. The `item` prop doubles as both a mode indicator and the data source for pre-filling the form in edit mode.

The form reset strategy relies on a `useEffect` that watches the `item` prop to decide when to reset. This works well for the edit-to-create transition (item goes from object to null) but fails for the create-to-create transition (item stays null).

## Historical Context (from thoughts/)

- `.claude/thoughts/notes/BUDGET_DETAIL_FLOW.md` — Documents the UX flow for budget detail modals
- `.claude/thoughts/plans/2026-02-02-consolidate-wizard-edit-modals.md` — Plan to consolidate wizard and edit modals into unified components (would be relevant to any fix as it may introduce the same pattern)

## Open Questions

- Does the Dialog component from shadcn/Radix keep children mounted when `open` is `false`? This determines whether the root cause is solely the `useEffect` dependency or also the component lifecycle.
