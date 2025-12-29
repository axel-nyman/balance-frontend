# Balance Update Date Format Implementation Plan

## Overview

Update the frontend to match the backend's new date-only format (`YYYY-MM-DD`) for balance updates. The backend now expects plain date strings instead of datetime strings, and has a new validation rule preventing entries older than the most recent balance entry.

## Current State Analysis

### Current Implementation
- `UpdateBalanceModal.tsx:49` converts the date picker value to datetime format by appending `T12:00:00`:
  ```typescript
  const dateTime = `${data.date}T12:00:00`
  ```
- This causes issues when:
  - Current time is before 12:00 on today's date (backend rejects as "future")
  - Selected date is the account creation date and account was created after 12:00

### New Backend API Contract (from Swagger)
- **Request**: `UpdateBalanceRequest.date` expects `string (date)` format: `"2025-12-29"`
- **Response**: `lastUpdated` now returns date format: `"2025-12-29"`
- **History**: `changeDate` now returns date format: `"2025-12-29"`
- **Validation Errors**:
  - 403: "Date cannot be in the future"
  - New: Entries older than most recent entry are rejected

### Key Discoveries
- `UpdateBalanceModal.tsx:49` - Hardcoded datetime conversion (needs removal)
- `src/lib/utils.ts:26-33` - `formatDate()` already handles date-only strings correctly
- `BalanceHistoryDrawer.tsx:30` - Uses `formatDate(entry.changeDate)` (no changes needed)
- Test file at `UpdateBalanceModal.test.tsx:107-110` validates request body (may need update)

## Desired End State

After implementation:
1. Frontend sends date in `YYYY-MM-DD` format (e.g., `"2025-12-29"`)
2. No datetime conversion happens in the frontend
3. `formatDate()` continues to work correctly (it already handles both formats)
4. Tests pass and validate the correct date format is sent

## What We're NOT Doing

- No changes to the date picker UI (it already uses `YYYY-MM-DD` format natively)
- No changes to `formatDate()` utility (it already works with date-only strings)
- No changes to `BalanceHistoryDrawer` display logic
- No frontend validation for "older than most recent entry" (backend handles this)

## Implementation Approach

This is a simple fix - remove the datetime conversion in `UpdateBalanceModal.tsx`. The HTML date input already returns `YYYY-MM-DD` format, which is exactly what the backend now expects.

## Phase 1: Update UpdateBalanceModal

### Overview
Remove the datetime conversion and send the date directly as selected by the user.

### Changes Required

#### 1. UpdateBalanceModal.tsx
**File**: `src/components/accounts/UpdateBalanceModal.tsx`
**Changes**: Remove the datetime conversion, send date directly

```typescript
// BEFORE (lines 46-58):
const onSubmit = async (data: UpdateBalanceFormData) => {
  try {
    // Convert date to ISO date-time format (backend expects date-time, not just date)
    const dateTime = `${data.date}T12:00:00`

    await updateBalance.mutateAsync({
      id: account.id,
      data: {
        newBalance: data.newBalance,
        date: dateTime,
        comment: data.comment || undefined,
      },
    })

// AFTER:
const onSubmit = async (data: UpdateBalanceFormData) => {
  try {
    await updateBalance.mutateAsync({
      id: account.id,
      data: {
        newBalance: data.newBalance,
        date: data.date,  // Send date directly (YYYY-MM-DD format)
        comment: data.comment || undefined,
      },
    })
```

#### 2. UpdateBalanceModal.test.tsx
**File**: `src/components/accounts/UpdateBalanceModal.test.tsx`
**Changes**: Update test to verify date format is `YYYY-MM-DD` without time component

```typescript
// Update the assertion around line 107-110 to verify date format:
expect(requestBody).toMatchObject({
  newBalance: 6000,
  comment: 'Test update',
})
// Add explicit date format check:
expect((requestBody as { date: string }).date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
```

### Success Criteria

#### Automated Verification:
- [x] TypeScript compiles without errors: `npm run build`
- [x] All tests pass: `npm test`
- [x] Linting passes: `npm run lint` (pre-existing unrelated warnings remain)

#### Manual Verification:
- [x] Open balance history drawer for any account
- [x] Click "Update Balance"
- [x] Enter a new balance and select today's date
- [x] Submit - should succeed without "future date" error
- [x] Verify the new entry appears in history with correct date display
- [x] Try selecting a past date and verify it works (unless older than most recent entry)

## Testing Strategy

### Unit Tests
- Verify `UpdateBalanceModal` sends date in `YYYY-MM-DD` format
- Verify form submission works with today's date at any time of day

### Manual Testing Steps
1. At any time of day (especially before noon), update a balance with today's date
2. Verify no "future date" error occurs
3. Verify the balance history shows the correct date
4. Try updating with a past date to verify backend's new "older than most recent" validation works

## Performance Considerations

None - this is a simple string format change with no performance impact.

## Migration Notes

No migration needed. This is a frontend-only change to match the updated backend API.

## References

- Backend Swagger UI: http://localhost:8080/swagger-ui/index.html#/Bank%20Accounts/updateBankAccountBalance
- Current implementation: `src/components/accounts/UpdateBalanceModal.tsx:49`
