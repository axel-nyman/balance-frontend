---
date: 2026-02-13T14:00:00+01:00
researcher: Claude
git_commit: af411ba9bf162b5dfcd6704e01db64f5790c95bf
branch: main
repository: balance-frontend
topic: "Recurring Expense Due Date Calculation — Current Behavior and Issues"
tags: [research, codebase, recurring-expenses, due-dates, backend, data-model]
status: complete
last_updated: 2026-02-13
last_updated_by: Claude
---

# Research: Recurring Expense Due Date Calculation

**Date**: 2026-02-13
**Researcher**: Claude
**Git Commit**: af411ba9bf162b5dfcd6704e01db64f5790c95bf
**Branch**: main
**Repository**: balance-frontend

## Research Question

How are due dates for recurring expenses currently calculated? The user wants due dates to be based on which month an expense falls in (e.g., a monthly expense should be "due" for February's budget regardless of when the user creates that budget). The user also wants the recurring expenses page to show which month it'll be due ("Due February" or "Due March 2027").

## Summary

### Current Behavior

The backend calculates due dates using a **timestamp-based approach**:

- `nextDueDate` = `lastUsedDate` + recurrence interval (e.g. +1 month for MONTHLY)
- `isDue` = `nextDueDate <= now()`
- `lastUsedDate` is set to the **budget's `lockedAt` timestamp** (a `date-time`) when a budget containing the expense is locked

This means due dates are anchored to **when the budget was locked**, not to **which month** the budget was for. A monthly expense locked on February 12 at 17:36 becomes due on March 12 at 17:36, rather than simply being "due in March."

### The Problem

The current timestamp-based approach causes incorrect behavior:
1. If you lock January's budget on Jan 31, a monthly expense won't be "due" until Feb 28+ — meaning if you create February's budget on Feb 1, the expense won't show as due
2. Due dates drift based on when you lock, not which month you're planning for
3. The `nextDueDate` is a `date-time` (e.g. `"2026-03-12T17:36:32.61024"`) rather than a month reference, making it impossible to display "Due February" cleanly

### Where the Fix Needs to Happen

**Primarily backend**, with minor frontend display changes:

1. **Backend (required):** Change `lastUsedDate` from a timestamp to a month/year reference tied to the budget's month, not lock time. Change `nextDueDate` calculation to be month-based. Change `isDue` to compare against a target month rather than "now".
2. **Frontend (minor):** Update `DueStatusIndicator` display text. Currently shows "Due now" or "Juni 2025" — would need "Due February" or "Due March 2027" format.
3. **Possible data type change:** `lastUsedDate` could become `lastUsedMonth`/`lastUsedYear` (integers), or the backend could store the budget's month/year instead of `lockedAt` timestamp. The `nextDueDate` could similarly become month/year integers rather than a datetime string.

## Detailed Findings

### 1. Backend API Response (Live Data)

From `GET /api/recurring-expenses`:

```json
{
  "expenses": [
    {
      "id": "61a24823-...",
      "name": "test",
      "amount": 123.0,
      "recurrenceInterval": "MONTHLY",
      "lastUsedDate": "2026-02-12T17:36:32.61024",
      "nextDueDate": "2026-03-12T17:36:32.61024",
      "isDue": false,
      "createdAt": "2026-02-11T20:09:49.16897"
    }
  ]
}
```

Key observation: `nextDueDate` is a full datetime, not a month reference. It's exactly `lastUsedDate + 1 month` (Feb 12 17:36 → Mar 12 17:36).

### 2. Backend OpenAPI Schema

From `/v3/api-docs`, the `RecurringExpenseListItemResponse` schema:

```
lastUsedDate:  type: string, format: date-time
nextDueDate:   type: string, format: date-time
isDue:         type: boolean
```

Both date fields are `date-time` format (ISO 8601 timestamps).

### 3. Backend Calculation Logic (from backend-stories.md)

**Setting `lastUsedDate`** — in `DomainService.lockBudget()`:
- When a budget is locked, for each budget expense with a `recurringExpenseId`:
  - Sets `lastUsedDate = budget.lockedAt` (the lock timestamp)
  - Sets `lastUsedBudgetId = budget.id`

**Calculating `nextDueDate`** — in `DomainService.getAllRecurringExpenses()`:
- `nextDueDate = lastUsedDate + interval`:
  - MONTHLY: +1 month
  - QUARTERLY: +3 months
  - BIANNUALLY: +6 months
  - YEARLY: +12 months

**Calculating `isDue`**:
- `isDue = (nextDueDate <= current_date)`

**On unlock**, `lastUsedDate` is restored to the previous locked budget's `lockedAt`, or null if no prior usage.

### 4. Frontend Display (`DueStatusIndicator.tsx`)

Three states:
- `lastUsedDate === null` → Yellow dot, "Never used"
- `isDue === true` → Red dot, "Due now"
- `isDue === false && nextDueDate exists` → Green dot, formatted as "Mars 2026" (month + year via `formatMonthYear()`)

Currently does NOT say "Due February" — just shows the month/year of the raw `nextDueDate` datetime.

### 5. Frontend Types (`src/api/types.ts:84-95`)

```typescript
export interface RecurringExpense {
  id: string
  name: string
  amount: number
  recurrenceInterval: RecurrenceInterval
  isManual: boolean
  bankAccount: BankAccountSummary | null
  lastUsedDate: string | null    // date-time from backend
  nextDueDate: string | null     // date-time from backend
  isDue: boolean                 // computed by backend
  createdAt: string
}
```

### 6. Wizard Usage (`StepExpenses.tsx`)

The wizard splits recurring expenses into two groups:
- `dueExpenses`: where `isDue === true` → shown under "Due this month"
- `otherExpenses`: where `isDue === false` → shown under "Other recurring"

The wizard does NOT consider which month the budget is being created for. It relies entirely on the backend's `isDue` flag, which compares against "now."

### 7. GET endpoint has no month/year parameter

The `GET /api/recurring-expenses` endpoint accepts no query parameters. There's no way to ask "which expenses are due for March 2026?" — it always calculates against the current date.

## Proposed Data Model Change (for consideration)

### Option A: Month-based fields

Replace timestamp-based tracking with month/year integers:

**Backend entity:**
- `lastUsedDate` (datetime) → `lastUsedMonth` (int) + `lastUsedYear` (int)
- `nextDueDate` (datetime) → `nextDueMonth` (int) + `nextDueYear` (int)

**API response:**
```json
{
  "lastUsedMonth": 2,
  "lastUsedYear": 2026,
  "nextDueMonth": 3,
  "nextDueYear": 2026,
  "isDue": true
}
```

**On lock:** Set `lastUsedMonth/Year` = budget's `month/year` (not `lockedAt` time).

### Option B: Keep datetime but anchor to month

Keep `lastUsedDate` as datetime but set it to the first of the budget's month (e.g., `2026-02-01T00:00:00`) instead of `lockedAt`. This is simpler but semantically misleading.

### Option C: Add target month parameter to GET

Add `?forMonth=3&forYear=2026` to the GET endpoint. Backend calculates `isDue` against the target month instead of "now." This would let the wizard ask for the correct month.

## Code References

- `src/api/types.ts:84-95` — RecurringExpense interface with `lastUsedDate`, `nextDueDate`, `isDue`
- `src/components/recurring-expenses/DueStatusIndicator.tsx:9-45` — Display component
- `src/components/wizard/steps/StepExpenses.tsx:86-87` — Due/not-due filtering in wizard
- `src/lib/utils.ts:39-45` — `formatMonthYear()` utility
- `.claude/thoughts/notes/backend-stories.md` — Backend logic documentation

## Historical Context (from thoughts/)

- `.claude/thoughts/research/2026-02-09-recurring-expenses-data-model.md` — Previous research covering the full data model and flow
- `.claude/thoughts/notes/RECURRING_EXPENSES_FLOW.md` — UX flow specification

## Open Questions

1. Should the GET endpoint accept a target month/year for the wizard context?
2. Should `lastUsedDate` become month/year integers, or keep the datetime with different semantics?
3. When a recurring expense has never been used (`lastUsedDate === null`), should it be shown as "due" for every month?
4. For the recurring expenses page (not wizard), should "isDue" mean "due for the current month" or "due for the next budget to be created"?
