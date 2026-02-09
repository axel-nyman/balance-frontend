# Recurring Expense Bank Account Support — Implementation Plan

## Overview

The backend now supports an optional `bankAccountId` on recurring expense templates. When set, the bank account is returned as a `BankAccountSummary` (`{ id, name, currentBalance }`) on the response. We need to update the frontend to:

1. Allow selecting a bank account when creating/editing recurring expenses
2. Display the bank account in the recurring expenses list
3. Auto-fill the bank account when quick-adding recurring expenses in the budget wizard

## Current State Analysis

**Backend API (new schema from `/v3/api-docs`):**
- `CreateRecurringExpenseRequest`: `{ name, amount, recurrenceInterval, isManual, bankAccountId? }` — `bankAccountId` is optional UUID
- `UpdateRecurringExpenseRequest`: identical to create
- `RecurringExpenseListItemResponse`: includes `bankAccount: BankAccountSummary | null`
- `RecurringExpenseResponse`: includes `bankAccount: BankAccountSummary | null`
- `BankAccountSummary`: `{ id, name, currentBalance }`

**Frontend (current):**
- `RecurringExpense` type has no bank account field
- `CreateRecurringExpenseRequest` / `UpdateRecurringExpenseRequest` have no `bankAccountId`
- Create/Edit modals have no account selector
- List/Row/Card show Name, Amount, Interval only
- Wizard quick-add sets `bankAccountId: ''` and `bankAccountName: ''`

### Key Discoveries:
- `AccountSelect` component at `src/components/accounts/AccountSelect.tsx` is a reusable select with "New Account" option — already used in wizard and budget detail modals
- `BankAccountRef` (`{ id, name }`) exists at `src/api/types.ts:134-137` but the API returns `BankAccountSummary` (`{ id, name, currentBalance }`) — we should add a matching type
- The existing `BankAccountRef` is fine for display purposes; we can reuse it or add `BankAccountSummary`
- MSW mock handler at `src/test/mocks/handlers.ts:37-43` needs updating to include `bankAccount`

## Desired End State

- Users can optionally select a bank account when creating or editing a recurring expense
- The recurring expenses list shows which account each expense is associated with (or "No account" if none)
- When a recurring expense with a bank account is quick-added in the wizard, the bank account is pre-filled automatically
- All existing tests pass and new behavior is covered

### Verification:
- `npm test` passes
- `npm run build` succeeds (no type errors)
- Manual: Create a recurring expense with a bank account, verify it shows in the list, quick-add it in a budget wizard and verify account is pre-filled

## What We're NOT Doing

- Not adding `currentBalance` display to the recurring expenses page (we only show the account name)
- Not changing the `BankAccountRef` type used by budget items
- Not making bank account required on recurring expenses — it remains optional
- Not changing the budget detail page

## Implementation Approach

We'll work from the data layer up: types → API → schemas → create/edit modals → list display → wizard integration → tests.

---

## Phase 1: Data Layer & Types

### Overview
Update TypeScript types and API request interfaces to match the new backend schema.

### Changes Required:

#### 1. API Types
**File**: `src/api/types.ts`

Add `BankAccountSummary` type (new, matches the backend schema):
```typescript
export interface BankAccountSummary {
  id: string
  name: string
}
```

Note: The backend `BankAccountSummary` includes `currentBalance` but we don't need it for recurring expenses display. We'll keep the frontend type minimal with just `id` and `name` since that's all we use. If needed elsewhere later we can add `currentBalance`.

Update `RecurringExpense` to include optional bank account:
```typescript
export interface RecurringExpense {
  id: string
  name: string
  amount: number
  recurrenceInterval: RecurrenceInterval
  isManual: boolean
  bankAccount: BankAccountSummary | null  // NEW
  lastUsedDate: string | null
  nextDueDate: string | null
  isDue: boolean
  createdAt: string
}
```

Update `CreateRecurringExpenseRequest`:
```typescript
export interface CreateRecurringExpenseRequest {
  name: string
  amount: number
  recurrenceInterval: RecurrenceInterval
  isManual: boolean
  bankAccountId?: string  // NEW - optional
}
```

Update `UpdateRecurringExpenseRequest`:
```typescript
export interface UpdateRecurringExpenseRequest {
  name: string
  amount: number
  recurrenceInterval: RecurrenceInterval
  isManual: boolean
  bankAccountId?: string  // NEW - optional
}
```

### Success Criteria:

#### Automated Verification:
- [x] TypeScript compilation passes: `npm run build`
- [x] Tests pass: `npm test`

---

## Phase 2: Form Schemas & Create/Edit Modals

### Overview
Add an optional bank account selector to the create and edit recurring expense modals.

### Changes Required:

#### 1. Form Schemas
**File**: `src/components/recurring-expenses/schemas.ts`

Add optional `bankAccountId` to the Zod schema:
```typescript
export const createRecurringExpenseSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  amount: z
    .number({ message: 'Must be a number' })
    .positive('Amount must be greater than 0'),
  recurrenceInterval: z.enum(['MONTHLY', 'QUARTERLY', 'BIANNUALLY', 'YEARLY'], {
    message: 'Please select an interval',
  }),
  isManual: z.boolean(),
  bankAccountId: z.string().optional(),  // NEW
})
```

#### 2. Create Modal
**File**: `src/components/recurring-expenses/CreateRecurringExpenseModal.tsx`

Changes:
- Import `AccountSelect` from `@/components/accounts`
- Add `bankAccountId: ''` to `defaultValues` (empty string = no selection)
- Add `AccountSelect` field between the interval select and the manual checkbox
- In `onSubmit`, include `bankAccountId` in the request (only if non-empty):
  ```typescript
  bankAccountId: data.bankAccountId || undefined
  ```
- Add `bankAccountId: ''` to `reset()` default values

The account select field should use this pattern (matching existing forms like `IncomeItemModal`):
```tsx
<div className="space-y-2">
  <Label>Account</Label>
  <AccountSelect
    value={watch('bankAccountId') ?? ''}
    onValueChange={(accountId) => setValue('bankAccountId', accountId)}
    placeholder="No account (optional)"
  />
</div>
```

#### 3. Edit Modal
**File**: `src/components/recurring-expenses/EditRecurringExpenseModal.tsx`

Changes:
- Import `AccountSelect` from `@/components/accounts`
- In the `useEffect` that resets form values, include `bankAccountId`:
  ```typescript
  reset({
    name: expense.name,
    amount: expense.amount,
    recurrenceInterval: expense.recurrenceInterval,
    isManual: expense.isManual,
    bankAccountId: expense.bankAccount?.id ?? '',  // NEW
  })
  ```
- Add `AccountSelect` field (same position and pattern as create modal)
- In `onSubmit`, include `bankAccountId` (only if non-empty):
  ```typescript
  bankAccountId: data.bankAccountId || undefined
  ```

### Success Criteria:

#### Automated Verification:
- [x] TypeScript compilation passes: `npm run build`
- [x] Tests pass: `npm test`

#### Manual Verification:
- [ ] Create modal shows account selector with "No account (optional)" placeholder
- [ ] Creating without account works (existing behavior preserved)
- [ ] Creating with account works and the response includes the bank account
- [ ] Edit modal shows the current bank account pre-selected
- [ ] Editing to remove the bank account works (select a different value or clear)
- [ ] Editing to change the bank account works

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.

---

## Phase 3: List Display

### Overview
Show the bank account name in the recurring expenses list (desktop table + mobile cards).

### Changes Required:

#### 1. Desktop Table Header
**File**: `src/components/recurring-expenses/RecurringExpensesList.tsx`

Add "Account" column header between "Amount" and "Interval":
```tsx
<TableHead className="w-[300px]">Name</TableHead>
<TableHead className="text-right">Amount</TableHead>
<TableHead>Account</TableHead>          {/* NEW */}
<TableHead>Interval</TableHead>
<TableHead className="w-[100px]"></TableHead>
```

#### 2. Desktop Row
**File**: `src/components/recurring-expenses/RecurringExpenseRow.tsx`

Add a new `<td>` for account between Amount and Interval:
```tsx
<td className="px-4 py-3 text-muted-foreground">
  {expense.bankAccount?.name ?? '—'}
</td>
```

Use an em-dash `—` for expenses without a bank account (consistent with how "No account" is typically displayed in minimal contexts).

#### 3. Mobile Card
**File**: `src/components/recurring-expenses/RecurringExpenseCard.tsx`

Update the subtitle line to include the account name when present:
```tsx
<p className="text-sm text-muted-foreground">
  {formatCurrency(expense.amount)} • {INTERVAL_LABELS[expense.recurrenceInterval]}
  {expense.bankAccount && ` • ${expense.bankAccount.name}`}
</p>
```

### Success Criteria:

#### Automated Verification:
- [x] TypeScript compilation passes: `npm run build`
- [x] Tests pass: `npm test`

#### Manual Verification:
- [ ] Desktop table shows Account column with account names (or em-dash for none)
- [ ] Mobile cards show account name in subtitle when present
- [ ] Column alignment looks good on desktop

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.

---

## Phase 4: Wizard Integration

### Overview
When quick-adding a recurring expense that has a bank account, auto-fill the `bankAccountId` and `bankAccountName` on the wizard item.

### Changes Required:

#### 1. StepExpenses Quick-Add Handler
**File**: `src/components/wizard/steps/StepExpenses.tsx`

Update `handleAddRecurring` (around line 116-131) to use the recurring expense's bank account:
```typescript
const handleAddRecurring = (recurring: RecurringExpense) => {
  startCopyAnimation(recurring.id, (newId) => {
    dispatch({
      type: 'ADD_EXPENSE_ITEM',
      item: {
        id: newId,
        name: recurring.name,
        amount: recurring.amount,
        bankAccountId: recurring.bankAccount?.id ?? '',       // CHANGED
        bankAccountName: recurring.bankAccount?.name ?? '',   // CHANGED
        isManual: recurring.isManual,
        recurringExpenseId: recurring.id,
      },
    })
  })
}
```

#### 2. Quick-Add Card Bank Account Display
**File**: `src/components/wizard/steps/StepExpenses.tsx`

In `renderQuickAddItem` (around line 187-210), pass the bank account name to the quick-add card so users can see which account will be pre-filled:
```typescript
<WizardItemCard
  variant="quick-add"
  name={recurring.name}
  amount={recurring.amount}
  bankAccountName={recurring.bankAccount?.name ?? ''}  // CHANGED: show account
  isDue={recurring.isDue}
  isManual={recurring.isManual}
  amountColorClass="text-expense"
  onQuickAdd={() => handleAddRecurring(recurring)}
  isCopying={isCopying}
/>
```

Note: The `WizardItemCard` in quick-add variant currently doesn't display `bankAccountName`. We should add a subtle display of the account name in the quick-add card so users know which account will be pre-filled. Add it below the amount line:

#### 3. WizardItemCard Quick-Add Account Display
**File**: `src/components/wizard/WizardItemCard.tsx`

In the quick-add variant (around lines 36-97), add the bank account name display below the amount when present:
```tsx
{/* Row 2: Amount + Account */}
<div className="mt-1 flex items-center gap-2">
  <span className="font-semibold text-muted-foreground/70">
    {formatCurrency(amount)}
  </span>
  {bankAccountName && (
    <span className="text-xs text-muted-foreground/50">
      • {bankAccountName}
    </span>
  )}
</div>
```

### Success Criteria:

#### Automated Verification:
- [x] TypeScript compilation passes: `npm run build`
- [x] Tests pass: `npm test`

#### Manual Verification:
- [ ] Quick-add cards show account name when the recurring expense has one
- [ ] Quick-adding a recurring expense with a bank account pre-fills the account in the expense row
- [ ] Quick-adding a recurring expense without a bank account leaves account empty (existing behavior)
- [ ] "Add All" due button still works correctly with account pre-filling
- [ ] User can still change the pre-filled account

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.

---

## Phase 5: Tests & Mocks

### Overview
Update MSW mock data and existing tests to include the new `bankAccount` field.

### Changes Required:

#### 1. MSW Handlers
**File**: `src/test/mocks/handlers.ts`

Update the recurring expenses mock response (line 37-43) to include `bankAccount`:
```typescript
http.get('/api/recurring-expenses', () => {
  return HttpResponse.json({
    expenses: [
      {
        id: '1',
        name: 'Rent',
        amount: 8000,
        recurrenceInterval: 'MONTHLY',
        isManual: true,
        bankAccount: { id: '1', name: 'Checking' },  // NEW
        lastUsedDate: null,
        nextDueDate: '2025-02-01',
        isDue: true,
        createdAt: '2025-01-01T00:00:00Z',
      },
    ],
  })
})
```

#### 2. Existing Tests Updates

Tests that create `RecurringExpense` mock objects need `bankAccount: null` added:

- `src/components/recurring-expenses/RecurringExpensesList.test.tsx` — Update `mockExpenses` array
- `src/components/recurring-expenses/CreateRecurringExpenseModal.test.tsx` — Verify request body in submit test now optionally includes `bankAccountId`
- `src/components/recurring-expenses/EditRecurringExpenseModal.test.tsx` — Update mock expense, verify form pre-fills account
- `src/components/recurring-expenses/RecurringExpenseRow.test.tsx` (if exists) — Update mock data
- `src/components/recurring-expenses/RecurringExpenseCard.test.tsx` (if exists) — Update mock data
- `src/components/recurring-expenses/DueStatusIndicator.test.tsx` — No changes needed (doesn't use RecurringExpense type)
- `src/pages/RecurringExpensesPage.test.tsx` — Update mock data
- `src/components/wizard/steps/StepExpenses.test.tsx` — Update to verify account pre-fill

#### 3. New Test Cases

**CreateRecurringExpenseModal**: Add test for submitting with a bank account selected, verifying `bankAccountId` is included in the request body.

**EditRecurringExpenseModal**: Add test verifying the account select pre-fills when expense has a bank account.

**RecurringExpensesList**: Verify account name appears in the table.

**StepExpenses**: Add test verifying that when a recurring expense with a bank account is quick-added, the bank account is pre-filled in the expense item.

### Success Criteria:

#### Automated Verification:
- [x] All tests pass: `npm test`
- [x] TypeScript compilation passes: `npm run build`
- [x] No linting errors

---

## Testing Strategy

### Unit Tests:
- Create modal: submit with/without bank account
- Edit modal: pre-fill bank account, submit with changed account
- List/Row: render with and without bank account
- Card: render with and without bank account

### Integration Tests (via existing wizard tests):
- Quick-add recurring expense with bank account → account pre-filled
- Quick-add recurring expense without bank account → account empty

### Manual Testing Steps:
1. Navigate to `/recurring-expenses`
2. Create a new recurring expense WITH a bank account — verify it appears in the list with the account name
3. Create a new recurring expense WITHOUT a bank account — verify it shows em-dash in the account column
4. Edit a recurring expense to add a bank account — verify the list updates
5. Edit a recurring expense to remove the bank account — verify the list updates
6. Navigate to `/budgets/new`, reach Step 3 (Expenses)
7. Quick-add a recurring expense that has a bank account — verify the account is pre-filled in the expense row
8. Quick-add a recurring expense without a bank account — verify account is empty (user must select)
9. Use "Add All" for due expenses — verify accounts are pre-filled correctly

## References

- Research doc: `.claude/thoughts/research/2026-02-09-recurring-expenses-data-model.md`
- Backend API docs: `http://localhost:8080/swagger-ui/index.html`
- AccountSelect component: `src/components/accounts/AccountSelect.tsx`
- Current recurring expense types: `src/api/types.ts:79-107`
