# Recurring Expense API Changes

**Date:** 2026-02-15
**Backend commit:** `d08a844`

## Summary

Two fields have been removed from recurring expense API responses. A database column (`last_used_date`) was also dropped via migration.

## Removed Fields

### 1. `lastUsedDate` (removed from all responses)

- **Type:** `LocalDateTime` (nullable)
- **Affected endpoints:**
  - `GET /api/recurring-expenses` — each item in the list
  - `GET /api/recurring-expenses/{id}`
  - `POST /api/recurring-expenses`
  - `PUT /api/recurring-expenses/{id}`
  - Any budget-related response that includes recurring expense details
- **Reason:** Superseded by `lastUsedMonth` / `lastUsedYear` which were already in use for month-based due date tracking.
- **Frontend action:** Stop reading `lastUsedDate` from responses. Use `lastUsedMonth` and `lastUsedYear` instead if you need to know when an expense was last applied.

### 2. `isDue` (removed from budget recurring expense responses)

- **Type:** `Boolean`
- **Affected endpoints:** Budget responses that include recurring expenses with due date info (the `RecurringExpenseBudgetResponse` shape).
- **Reason:** Was a runtime-calculated boolean without proper budget context. Due status should be derived on the frontend from `dueMonth`, `dueYear`, and `dueDisplay` which are still present.
- **Frontend action:** Stop reading `isDue`. To determine if an expense is due, compare `dueMonth`/`dueYear` against the current or target month/year. The `dueDisplay` string (e.g. "Feb 2026") can be shown directly to users.

## Fields Still Available

These fields remain unchanged and can be used as replacements:

| Field | Type | Description |
|-------|------|-------------|
| `dueMonth` | `Integer` | Month number (1-12) when the expense is next due |
| `dueYear` | `Integer` | Year when the expense is next due |
| `dueDisplay` | `String` | Human-readable due date (e.g. "Feb 2026") |
| `lastUsedMonth` | `Integer` | Month the expense was last applied |
| `lastUsedYear` | `Integer` | Year the expense was last applied |

## No Changes To

- Request bodies (`CreateRecurringExpenseRequest`, `UpdateRecurringExpenseRequest`) — no fields removed from inputs.
- Other response fields (`id`, `name`, `amount`, `recurrenceInterval`, `isManual`, `bankAccount`, `createdAt`, `updatedAt`).
