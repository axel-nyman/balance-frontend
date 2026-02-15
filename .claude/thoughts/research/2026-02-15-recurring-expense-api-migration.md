---
date: 2026-02-15T12:00:00+01:00
researcher: Claude
git_commit: af411ba
branch: main
repository: balance-frontend
topic: "Recurring Expense API Migration — Field Changes and Frontend Impact"
tags: [research, recurring-expenses, due-dates, api-migration, breaking-changes]
status: complete
last_updated: 2026-02-15
last_updated_by: Claude
related:
  - .claude/thoughts/notes/2026-02-15-recurring-expense-api-changes.md
  - .claude/thoughts/research/2026-02-13-recurring-expense-due-date-calculation.md
---

# Research: Recurring Expense API Migration

**Date**: 2026-02-15
**Researcher**: Claude
**Git Commit**: af411ba
**Branch**: main

## Context

The backend has shipped a breaking change to the recurring expense API. The old
timestamp-based due date model (`lastUsedDate` datetime + `isDue` boolean +
`nextDueDate` datetime) has been replaced with a month-based model (`dueMonth` +
`dueYear` + `dueDisplay`). This doc covers what changed, what's broken, and how
the frontend should adapt.

Previous research (`2026-02-13-recurring-expense-due-date-calculation.md`)
identified the timestamp problem and proposed the month-based approach. The
backend has now implemented it.

## Backend Changes (Confirmed from Live API + OpenAPI)

### Removed Fields

| Old Field | Old Type | Was Used For |
|-----------|----------|-------------|
| `lastUsedDate` | `string (date-time) \| null` | Tracking when expense was last applied. DB column dropped. |
| `nextDueDate` | `string (date-time) \| null` | Next due datetime, calculated as `lastUsedDate + interval`. |
| `isDue` | `boolean` | Runtime calculation: `nextDueDate <= now()`. |

### New Fields (on `RecurringExpenseListItemResponse` only)

| New Field | Type | Description |
|-----------|------|-------------|
| `dueMonth` | `integer \| null` | Month (1-12) when the expense is next due. Null if never used. |
| `dueYear` | `integer \| null` | Year when expense is next due. Null if never used. |
| `dueDisplay` | `string \| null` | Human-readable label, e.g. `"April"`. Null if never used. |

### Live API Response Example

```json
// GET /api/recurring-expenses
{
  "expenses": [
    {
      "id": "3f2c2e0b-...",
      "name": "string",
      "amount": 1.0,
      "recurrenceInterval": "MONTHLY",
      "isManual": true,
      "bankAccount": { "id": "6f1def55-...", "name": "string", "currentBalance": 0.0 },
      "dueMonth": 4,
      "dueYear": 2026,
      "dueDisplay": "April",
      "createdAt": "2026-02-09T07:38:27.511458"
    },
    {
      "id": "7df62146-...",
      "name": "string2",
      "amount": 1.0,
      "recurrenceInterval": "MONTHLY",
      "isManual": true,
      "bankAccount": null,
      "dueMonth": null,
      "dueYear": null,
      "dueDisplay": null,
      "createdAt": "2026-02-09T07:38:49.459322"
    }
  ]
}
```

### Single-Item Response (`RecurringExpenseResponse`)

The POST/PUT endpoints return `RecurringExpenseResponse` which has **no due date
fields at all** — just `id, name, amount, recurrenceInterval, isManual,
bankAccount, createdAt, updatedAt`. This was already the case; the due fields
only existed on the list endpoint.

### Note on `lastUsedMonth` / `lastUsedYear`

The API change notes mention these as "still available", but they are **not
present** in the `RecurringExpenseListItemResponse` OpenAPI schema nor in live
API responses. They may exist in budget-related response shapes only. The
frontend cannot rely on them from the recurring expenses endpoint.

## Frontend Impact — File-by-File

### Type Definition

**`src/api/types.ts:84-95`** — `RecurringExpense` interface

Current (broken):
```typescript
export interface RecurringExpense {
  id: string
  name: string
  amount: number
  recurrenceInterval: RecurrenceInterval
  isManual: boolean
  bankAccount: BankAccountSummary | null
  lastUsedDate: string | null    // REMOVED from API
  nextDueDate: string | null     // REMOVED from API
  isDue: boolean                 // REMOVED from API
  createdAt: string
}
```

Needed:
```typescript
export interface RecurringExpense {
  id: string
  name: string
  amount: number
  recurrenceInterval: RecurrenceInterval
  isManual: boolean
  bankAccount: BankAccountSummary | null
  dueMonth: number | null        // NEW
  dueYear: number | null         // NEW
  dueDisplay: string | null      // NEW
  createdAt: string
}
```

### DueStatusIndicator Component

**`src/components/recurring-expenses/DueStatusIndicator.tsx`**

Props currently: `isDue`, `nextDueDate`, `lastUsedDate`

The component renders three states:
1. **Never used** (yellow dot) — was `lastUsedDate === null`, becomes `dueMonth === null`
2. **Due** (red dot) — was `isDue === true`, becomes `dueMonth/dueYear` matches reference month
3. **Not due yet** (green dot + label) — was `nextDueDate` parsed to month/year, becomes `dueDisplay` shown directly

**Design decision:** This component is used on the recurring expenses list page,
not in budget context. For the list page, due status should be derived from
comparing `dueMonth`/`dueYear` to the current calendar month. The component
should accept the expense's due fields and a reference month/year to compare
against.

### RecurringExpenseRow & RecurringExpenseCard

**`src/components/recurring-expenses/RecurringExpenseRow.tsx:25-29`**
**`src/components/recurring-expenses/RecurringExpenseCard.tsx:28-32`**

Both pass the three removed props to `DueStatusIndicator`. These will pass the
new expense fields + a reference month instead. Minimal logic change — just prop
plumbing.

### RecurringExpensesList — Sort Logic

**`src/components/recurring-expenses/RecurringExpensesList.tsx:26-45`**

`sortExpenses()` currently uses a 3-tier score:
- Score 0: `isDue === true` (due items first)
- Score 1: `lastUsedDate === null` (never used)
- Score 2: not due

Then sorts within tiers by `nextDueDate` ascending.

New approach: same 3-tier structure, but derived from `dueMonth`/`dueYear`:
- Score 0: `dueMonth`/`dueYear` matches current month (due)
- Score 1: `dueMonth === null` (never used)
- Score 2: future due date

Within-tier sort: compare `dueYear * 100 + dueMonth` (can reuse existing
`monthYearToNumber()` util from `src/lib/utils.ts:119`).

### EditRecurringExpenseModal — Info Display

**`src/components/recurring-expenses/EditRecurringExpenseModal.tsx:93-102, 177-188`**

Two pieces of read-only info shown at bottom of modal:

1. **"Last used" (line 180-182):** Currently shows `formatDate(expense.lastUsedDate)` or "Never". Since `lastUsedDate` is removed and `lastUsedMonth`/`lastUsedYear` are not on the list response, this row should be removed entirely.

2. **"Next due" (line 93-102, 184-187):** `getNextDueDisplay()` checks `lastUsedDate`, `isDue`, `nextDueDate`. Replace with:
   - `dueMonth === null` → "Never used"
   - Otherwise → show `dueDisplay` directly (the backend provides a human-readable string)

### StepExpenses (Budget Wizard)

**`src/components/wizard/steps/StepExpenses.tsx:73-87`**

This is the most semantically important change. The wizard splits recurring
expenses into "Due this month" and "Other recurring":

```typescript
// Current (broken)
.sort((a, b) => {
  if (a.isDue !== b.isDue) return a.isDue ? -1 : 1
  return a.name.localeCompare(b.name)
})
const dueExpenses = availableRecurring.filter((exp) => exp.isDue)
const otherExpenses = availableRecurring.filter((exp) => !exp.isDue)
```

**New approach:** Compare `dueMonth`/`dueYear` against the **wizard's target
budget month/year** (not the current calendar month). The wizard already knows
the target month from its state. An expense is "due for this budget" when
`dueMonth === targetMonth && dueYear === targetYear`.

This is an improvement: the old `isDue` always compared against "now" regardless
of which month's budget was being created. With the new model, creating a March
budget will correctly show March's due expenses even if it's still February.

The wizard state already contains `month` and `year` fields in `WizardContext`.
These should be passed through to the due-checking logic.

### WizardItemCard

**`src/components/wizard/WizardItemCard.tsx:12, 54-57`**

Has an `isDue?: boolean` prop. In the quick-add variant, renders a red "Due"
badge when true. This prop should remain boolean — the parent (`StepExpenses`)
will derive it before passing.

### Test Files

All test files use the old field names in mock data. Each needs updating:

| File | Mock data locations |
|------|-------------------|
| `DueStatusIndicator.test.tsx` | Lines 6-72 — all test scenarios |
| `RecurringExpensesList.test.tsx` | Lines 15-41 — mock expense objects |
| `EditRecurringExpenseModal.test.tsx` | Lines 16-18, 79, 163, 170 |
| `DeleteRecurringExpenseDialog.test.tsx` | Lines 16-18 |
| `StepExpenses.test.tsx` | Lines 173-392 — extensive mock data |

### MSW Mock Handler

**`src/test/mocks/handlers.ts:40`**

```typescript
// Current (broken)
{ ..., lastUsedDate: null, nextDueDate: '2025-02-01', isDue: true, ... }
```

Needs: `dueMonth`, `dueYear`, `dueDisplay` instead.

## Design Decisions

### 1. Due status is always budget-relative

Due dates should always be understood in the context of a specific budget month:

- **Budget wizard:** Compare `dueMonth`/`dueYear` to the wizard's target month.
  An expense is "due" if it matches the budget being created.
- **Budget detail page:** Use the `dueDisplay` field from the API to show which
  month a recurring expense will be used next. The budget already has its own
  month/year context.
- **Recurring expenses list page:** Compare `dueMonth`/`dueYear` to the current
  calendar month as a reasonable default.

### 2. Remove "Last used" display

Since `lastUsedDate` is gone and `lastUsedMonth`/`lastUsedYear` are not on the
list response, remove the "Last used" info row from `EditRecurringExpenseModal`.
The "Next due" row using `dueDisplay` provides sufficient context.

### 3. `isDue` is computed on the frontend

The `isDue` boolean is no longer from the API. The frontend computes it:

```typescript
function isDueForMonth(expense: RecurringExpense, month: number, year: number): boolean {
  return expense.dueMonth === month && expense.dueYear === year
}
```

This helper (or an inline check) replaces all `expense.isDue` reads. For
components that accept a boolean prop (like `WizardItemCard`), the parent
computes it before passing.

### 4. Sort by `dueMonth`/`dueYear`

Sorting uses `monthYearToNumber(dueMonth, dueYear)` from existing utils for
chronological ordering within same-tier items.

## Summary of Changes Needed

| Area | What | Complexity |
|------|------|-----------|
| `src/api/types.ts` | Replace 3 fields on `RecurringExpense` | Trivial |
| `DueStatusIndicator.tsx` | New props, new logic, same 3 visual states | Small |
| `RecurringExpenseRow.tsx` | Update prop passing | Trivial |
| `RecurringExpenseCard.tsx` | Update prop passing | Trivial |
| `RecurringExpensesList.tsx` | Rewrite `sortExpenses()` with month-based comparison | Small |
| `EditRecurringExpenseModal.tsx` | Remove "Last used" row, simplify "Next due" | Small |
| `StepExpenses.tsx` | Compare against wizard target month instead of `isDue` | Medium |
| `WizardItemCard.tsx` | No change (already receives boolean `isDue` prop) | None |
| `src/test/mocks/handlers.ts` | Update mock data | Trivial |
| 5 test files | Update mock data and assertions | Medium (volume) |

## Open Questions

1. **"Never used" in wizard context:** If `dueMonth === null` (expense never
   used in a budget), should it appear in "Due this month" or "Other recurring"?
   Currently it goes to "Other recurring" since `isDue` was false. Keeping that
   behavior makes sense — these are expenses with no established due schedule.
2. **`dueDisplay` locale:** The backend returns `"April"` (English). Should the
   frontend use `dueDisplay` as-is, or format `dueMonth`/`dueYear` using
   `formatMonthYear()` (which uses `sv-SE` locale) for consistency? Using
   `formatMonthYear()` would show "april 2026" in Swedish. Depends on whether
   the backend will localize `dueDisplay`.
