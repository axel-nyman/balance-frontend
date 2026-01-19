# Account Select with Inline Create Implementation Plan

## Overview

Add the ability to create new bank accounts directly from account selection dropdowns throughout the application. When a user selects "+ New Account" from any account dropdown, a modal opens to create the account, and upon success, that account is automatically selected.

## Current State Analysis

Account selection dropdowns exist in 6 locations:
1. **Budget Wizard** - 3 steps (Income, Expenses, Savings) with inline table Select components
2. **Budget Detail** - 3 modals (IncomeItemModal, ExpenseItemModal, SavingsItemModal) with form Select components

All use the same pattern:
```tsx
<Select value={...} onValueChange={...}>
  <SelectTrigger>
    <SelectValue placeholder="Select account" />
  </SelectTrigger>
  <SelectContent>
    {accounts.map((account) => (
      <SelectItem key={account.id} value={account.id}>
        {account.name}
      </SelectItem>
    ))}
  </SelectContent>
</Select>
```

The `CreateAccountModal` component already exists at `src/components/accounts/CreateAccountModal.tsx` and uses `useCreateAccount` hook which invalidates the accounts query on success.

### Key Discoveries:
- `CreateAccountModal.tsx:39-52` - Returns after success via `onOpenChange(false)`
- `use-accounts.ts:37-46` - `useCreateAccount` invalidates `queryKeys.accounts.all` on success
- Wizard steps use `handleUpdateItem` pattern that dispatches both `bankAccountId` and `bankAccountName`
- Budget detail modals use React Hook Form with `setValue('bankAccountId', value)`

## Desired End State

All 6 account selection dropdowns include a "+ New Account" option at the top. Clicking it opens the create account modal. On successful creation, the new account is automatically selected in the dropdown.

### Verification:
- User can create account from any dropdown in wizard or detail modals
- New account appears in dropdown after creation
- New account is auto-selected after creation
- Modal can be cancelled without side effects
- Existing account selection behavior unchanged

## What We're NOT Doing

- Modifying the CreateAccountModal's form fields or validation
- Adding inline account creation (must use modal)
- Adding account editing from these dropdowns
- Changing the styling of the existing Select components

## Implementation Approach

Create a reusable `AccountSelect` component that encapsulates the Select with "+ New Account" functionality. This avoids code duplication and ensures consistent behavior across all 6 locations.

The component will:
1. Render the standard Select with accounts from `useAccounts()`
2. Add a special "+ New Account" option that triggers the modal
3. Track a "pending selection" for the newly created account
4. Call `onValueChange` with the new account ID after creation

---

## Phase 1: Create AccountSelect Component

### Overview
Create a reusable `AccountSelect` component that wraps the shadcn Select with "+ New Account" functionality.

### Changes Required:

#### 1. Create AccountSelect Component
**File**: `src/components/accounts/AccountSelect.tsx` (new file)

```tsx
import { useState, useEffect } from 'react'
import { Plus } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAccounts } from '@/hooks'
import { CreateAccountModal } from './CreateAccountModal'

const NEW_ACCOUNT_VALUE = '__new_account__'

interface AccountSelectProps {
  value: string
  onValueChange: (accountId: string, accountName: string) => void
  placeholder?: string
  triggerClassName?: string
}

export function AccountSelect({
  value,
  onValueChange,
  placeholder = 'Select account',
  triggerClassName,
}: AccountSelectProps) {
  const { data: accountsData } = useAccounts()
  const accounts = accountsData?.accounts ?? []

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [pendingSelection, setPendingSelection] = useState(false)
  const [previousAccountCount, setPreviousAccountCount] = useState(accounts.length)

  // Detect when a new account is added after modal closes
  useEffect(() => {
    if (pendingSelection && accounts.length > previousAccountCount) {
      // Find the newest account (last in the array after refetch)
      const newAccount = accounts[accounts.length - 1]
      if (newAccount) {
        onValueChange(newAccount.id, newAccount.name)
        setPendingSelection(false)
      }
    }
    setPreviousAccountCount(accounts.length)
  }, [accounts, pendingSelection, previousAccountCount, onValueChange])

  const handleValueChange = (newValue: string) => {
    if (newValue === NEW_ACCOUNT_VALUE) {
      setIsCreateModalOpen(true)
      return
    }

    const account = accounts.find((a) => a.id === newValue)
    if (account) {
      onValueChange(account.id, account.name)
    }
  }

  const handleModalClose = (open: boolean) => {
    if (!open) {
      // Modal is closing - if it was a successful creation,
      // the accounts list will be refetched and we'll auto-select
      setPendingSelection(true)
    }
    setIsCreateModalOpen(open)
  }

  return (
    <>
      <Select value={value} onValueChange={handleValueChange}>
        <SelectTrigger className={triggerClassName}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NEW_ACCOUNT_VALUE}>
            <span className="flex items-center gap-2 text-blue-600">
              <Plus className="w-4 h-4" />
              New Account
            </span>
          </SelectItem>
          {accounts.map((account) => (
            <SelectItem key={account.id} value={account.id}>
              {account.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <CreateAccountModal
        open={isCreateModalOpen}
        onOpenChange={handleModalClose}
      />
    </>
  )
}
```

#### 2. Export from accounts index
**File**: `src/components/accounts/index.ts`
**Changes**: Add export for new component

```typescript
export { AccountSelect } from './AccountSelect'
```

### Success Criteria:

#### Automated Verification:
- [x] TypeScript compiles without errors: `npm run typecheck`
- [x] Linting passes: `npm run lint`
- [x] Build succeeds: `npm run build`

#### Manual Verification:
- [x] Component can be imported and rendered
- [x] "+ New Account" option appears at top of dropdown
- [x] Clicking "+ New Account" opens the create modal
- [x] Cancelling modal does not change selection
- [x] Creating account closes modal and selects new account

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation.

---

## Phase 2: Update Budget Wizard Steps

### Overview
Replace the inline Select components in all three wizard steps with the new AccountSelect component.

### Changes Required:

#### 1. Update StepIncome
**File**: `src/components/wizard/steps/StepIncome.tsx`
**Changes**:
- Import `AccountSelect` instead of Select components
- Replace Select usage with AccountSelect
- Simplify `handleUpdateItem` for bankAccountId (component now provides both id and name)

Replace lines 199-215:
```tsx
<AccountSelect
  value={item.bankAccountId}
  onValueChange={(accountId, accountName) => {
    dispatch({
      type: 'UPDATE_INCOME_ITEM',
      id: item.id,
      updates: {
        bankAccountId: accountId,
        bankAccountName: accountName,
      },
    })
  }}
  placeholder="Select account"
  triggerClassName="border-0 shadow-none focus:ring-0 px-0"
/>
```

#### 2. Update StepExpenses
**File**: `src/components/wizard/steps/StepExpenses.tsx`
**Changes**: Same pattern as StepIncome

Replace lines 388-404:
```tsx
<AccountSelect
  value={item.bankAccountId}
  onValueChange={(accountId, accountName) => {
    dispatch({
      type: 'UPDATE_EXPENSE_ITEM',
      id: item.id,
      updates: {
        bankAccountId: accountId,
        bankAccountName: accountName,
      },
    })
  }}
  placeholder="Select account"
  triggerClassName="border-0 shadow-none focus:ring-0 px-0"
/>
```

#### 3. Update StepSavings
**File**: `src/components/wizard/steps/StepSavings.tsx`
**Changes**: Same pattern as StepIncome

Replace lines 272-288:
```tsx
<AccountSelect
  value={item.bankAccountId}
  onValueChange={(accountId, accountName) => {
    dispatch({
      type: 'UPDATE_SAVINGS_ITEM',
      id: item.id,
      updates: {
        bankAccountId: accountId,
        bankAccountName: accountName,
      },
    })
  }}
  placeholder="Select account"
  triggerClassName="border-0 shadow-none focus:ring-0 px-0"
/>
```

### Success Criteria:

#### Automated Verification:
- [x] TypeScript compiles without errors: `npm run typecheck`
- [x] Linting passes: `npm run lint`
- [x] Build succeeds: `npm run build`

#### Manual Verification:
- [x] StepIncome: Can select existing account
- [x] StepIncome: Can create new account and it's auto-selected
- [x] StepExpenses: Can select existing account
- [x] StepExpenses: Can create new account and it's auto-selected
- [x] StepSavings: Can select existing account
- [x] StepSavings: Can create new account and it's auto-selected
- [x] New accounts appear in all subsequent dropdowns after creation

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation.

---

## Phase 3: Update Budget Detail Modals

### Overview
Replace the Select components in all three budget detail modals with the new AccountSelect component.

### Changes Required:

#### 1. Update IncomeItemModal
**File**: `src/components/budget-detail/IncomeItemModal.tsx`
**Changes**:
- Remove Select imports
- Import `AccountSelect`
- Remove `useAccounts` import (AccountSelect handles it)
- Replace Select with AccountSelect

Replace lines 134-150:
```tsx
<AccountSelect
  value={selectedAccountId}
  onValueChange={(accountId) => setValue('bankAccountId', accountId)}
  placeholder="Select account"
/>
```

Note: The second parameter (accountName) is not needed here since the form only tracks the ID.

#### 2. Update ExpenseItemModal
**File**: `src/components/budget-detail/ExpenseItemModal.tsx`
**Changes**: Same pattern as IncomeItemModal

Replace lines 141-155:
```tsx
<AccountSelect
  value={selectedAccountId}
  onValueChange={(accountId) => setValue('bankAccountId', accountId)}
  placeholder="Select account"
/>
```

#### 3. Update SavingsItemModal
**File**: `src/components/budget-detail/SavingsItemModal.tsx`
**Changes**: Same pattern as IncomeItemModal

Replace lines 136-150:
```tsx
<AccountSelect
  value={selectedAccountId}
  onValueChange={(accountId) => setValue('bankAccountId', accountId)}
  placeholder="Select account"
/>
```

### Success Criteria:

#### Automated Verification:
- [x] TypeScript compiles without errors: `npm run typecheck`
- [x] Linting passes: `npm run lint`
- [x] Build succeeds: `npm run build`

#### Manual Verification:
- [x] IncomeItemModal: Can select existing account
- [x] IncomeItemModal: Can create new account and it's auto-selected
- [x] ExpenseItemModal: Can select existing account
- [x] ExpenseItemModal: Can create new account and it's auto-selected
- [x] SavingsItemModal: Can select existing account
- [x] SavingsItemModal: Can create new account and it's auto-selected
- [x] Form validation still works (required field)
- [x] Edit mode pre-populates correct account

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation.

---

## Testing Strategy

### Manual Testing Steps:
1. **Budget Wizard Flow**:
   - Start creating a new budget
   - On Income step, click account dropdown
   - Verify "+ New Account" appears at top
   - Click "+ New Account", create an account
   - Verify modal closes and new account is selected
   - Add another income item, verify new account appears in dropdown
   - Repeat for Expenses and Savings steps

2. **Budget Detail Flow**:
   - Open an existing budget
   - Click to add new income
   - Verify "+ New Account" appears in dropdown
   - Create account, verify auto-selection
   - Save income item
   - Repeat for expense and savings modals

3. **Edge Cases**:
   - Cancel account creation modal (selection should not change)
   - Create account with existing name (should show error in modal)
   - Create account when dropdown already has a selection (should switch to new)

## Performance Considerations

- Each AccountSelect instance calls `useAccounts()` but React Query deduplicates this
- The CreateAccountModal is only rendered when `isCreateModalOpen` is true
- Account detection uses simple array length comparison, avoiding expensive operations

## References

- Research document: `.claude/thoughts/research/2026-01-17-bank-account-creation-and-selection.md`
- CreateAccountModal: `src/components/accounts/CreateAccountModal.tsx`
- useAccounts hook: `src/hooks/use-accounts.ts:17-22`
