---
date: 2026-01-17T12:00:00+01:00
researcher: Claude
git_commit: f747dc0a40ede1d3347fb8e1e290753f004eb7f7
branch: main
repository: balance-frontend
topic: "Bank Account Creation and Selection in Budget Flows"
tags: [research, bank-accounts, budget-wizard, budget-detail, forms, modals]
status: complete
last_updated: 2026-01-17
last_updated_by: Claude
---

# Research: Bank Account Creation and Selection in Budget Flows

**Date**: 2026-01-17
**Researcher**: Claude
**Git Commit**: f747dc0a40ede1d3347fb8e1e290753f004eb7f7
**Branch**: main
**Repository**: balance-frontend

## Research Question
How does bank account creation work (modals, components, rules), and how are bank accounts selected in the budget creation flow and budget details page?

## Summary

Bank accounts are created via a modal-based form on the Accounts page. The creation flow uses React Hook Form with Zod validation, requiring a name and optional description/initial balance. Account selection appears in two contexts:

1. **Budget Wizard** (creation flow): Each step (Income, Expenses, Savings) uses inline shadcn/ui Select dropdowns in table rows, storing both account ID and name in wizard state
2. **Budget Detail Page** (editing): Modal dialogs for each item type include a Select dropdown controlled by React Hook Form

Both contexts fetch accounts via the `useAccounts()` React Query hook and validate that an account is selected before submission.

## Detailed Findings

### 1. Bank Account Creation Modal

#### Component Structure
- **Page**: `src/pages/AccountsPage.tsx`
- **Modal**: `src/components/accounts/CreateAccountModal.tsx`
- **Schema**: `src/components/accounts/schemas.ts`
- **API**: `src/api/accounts.ts`
- **Hook**: `src/hooks/use-accounts.ts`

#### Form Fields
| Field | Type | Required | Validation |
|-------|------|----------|------------|
| name | text | Yes | Min 1 char |
| description | text | No | - |
| initialBalance | number | No | Min 0 (no negatives) |

#### Flow
1. User clicks "New Account" button in `AccountsPage.tsx:38-41`
2. `setIsCreateModalOpen(true)` opens the modal (line 29)
3. `CreateAccountModal` renders with controlled form (line 64-67)
4. User fills form, Zod validates on submit (schema at `schemas.ts:3-11`)
5. `onSubmit` calls `createAccount.mutateAsync()` (line 41)
6. API POST to `/api/bank-accounts` via `apiPost` helper
7. Success: toast shown, form reset, modal closes, query cache invalidated
8. Error: displayed inline below form fields

#### Validation Schema (`schemas.ts:3-11`)
```typescript
export const createAccountSchema = z.object({
  name: z.string({ message: 'Name is required' }).min(1, 'Name is required'),
  description: z.string().optional(),
  initialBalance: z.number({ message: 'Must be a number' }).min(0, 'Initial balance cannot be negative'),
})
```

### 2. Bank Account Selection in Budget Wizard

#### Component Structure
- **Page**: `src/pages/BudgetWizardPage.tsx`
- **Steps**: `src/components/wizard/steps/StepIncome.tsx`, `StepExpenses.tsx`, `StepSavings.tsx`
- **Context**: `src/components/wizard/WizardContext.tsx`
- **Types**: `src/components/wizard/types.ts`

#### Wizard Item Types
Each wizard item stores both the account ID and name:
```typescript
interface WizardIncomeItem {
  id: string
  name: string
  amount: number
  bankAccountId: string      // For API/validation
  bankAccountName: string    // For display
}
```
Same pattern for `WizardExpenseItem` and `WizardSavingsItem`.

#### Account Selection UI
All three steps use identical Select component structure (`StepIncome.tsx:199-215`):
```tsx
<Select
  value={item.bankAccountId}
  onValueChange={(value) => handleUpdateItem(item.id, 'bankAccountId', value)}
>
  <SelectTrigger className="border-0 shadow-none focus:ring-0 px-0">
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

#### Update Handler Pattern (`StepIncome.tsx:73-95`)
When account is selected, handler looks up the full account object:
```typescript
const handleUpdateItem = (id, field, value) => {
  if (field === 'bankAccountId') {
    const account = accounts.find((a) => a.id === value)
    dispatch({
      type: 'UPDATE_INCOME_ITEM',
      id,
      updates: {
        bankAccountId: value,
        bankAccountName: account?.name ?? '',
      },
    })
  }
}
```

#### Step Validation (`WizardContext.tsx:23-44`)
- **Step 2 (Income)**: Requires at least one item, all must have `bankAccountId`
- **Step 3 (Expenses)**: Optional items, but any added must have `bankAccountId`
- **Step 4 (Savings)**: Optional items, but any added must have `bankAccountId`

#### Special Cases in StepSavings
1. **No accounts alert** (`StepSavings.tsx:221-228`): If no accounts exist, shows an Alert instead of the savings table
2. **Account existence check** (`StepSavings.tsx:117-118`): Before copying from last budget, validates account still exists
3. **Filter invalid items** (`StepSavings.tsx:161-164`): Items from last budget with deleted accounts are filtered out

#### Copying from Last Budget
- **Income** (`StepIncome.tsx:122-123`): Copies both `bankAccountId` and `bankAccountName`
- **Savings** (`StepSavings.tsx:136-137`): Same pattern, with account existence check
- **Recurring Expenses** (`StepExpenses.tsx:126-127`): Does NOT copy account - user must select manually

### 3. Bank Account Selection in Budget Detail Modals

#### Component Structure
- **Page**: `src/pages/BudgetDetailPage.tsx`
- **Modals**: `src/components/budget-detail/IncomeItemModal.tsx`, `ExpenseItemModal.tsx`, `SavingsItemModal.tsx`
- **Schema**: `src/components/budget-detail/schemas.ts`

#### Form Setup (`IncomeItemModal.tsx:46-53`)
Uses React Hook Form with Zod resolver:
```typescript
const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
  resolver: zodResolver(incomeItemSchema),
  defaultValues: { name: '', amount: undefined, bankAccountId: '' },
})
```

#### Select Component (`IncomeItemModal.tsx:134-154`)
```tsx
<Select value={selectedAccountId} onValueChange={(value) => setValue('bankAccountId', value)}>
  <SelectTrigger id="bankAccountId">
    <SelectValue placeholder="Select account" />
  </SelectTrigger>
  <SelectContent>
    {accountsData?.accounts.map((account) => (
      <SelectItem key={account.id} value={account.id}>{account.name}</SelectItem>
    ))}
  </SelectContent>
</Select>
{errors.bankAccountId && <p className="text-sm text-red-600">{errors.bankAccountId.message}</p>}
```

#### Validation Schema (`schemas.ts`)
All three item schemas require `bankAccountId`:
```typescript
export const incomeItemSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  amount: z.number({ message: 'Must be a number' }).positive('Amount must be greater than 0'),
  bankAccountId: z.string().min(1, 'Account is required'),
})
```

### 4. Account Name Display in Budget Sections

#### Data Structure (`types.ts:134-161`)
API returns budget items with embedded account reference:
```typescript
interface BankAccountRef {
  id: string
  name: string
}
interface BudgetIncome {
  id: string
  name: string
  amount: number
  bankAccount: BankAccountRef
}
```

#### Mapping to Display (`BudgetDetailPage.tsx:18-25`)
```typescript
function mapIncomeToSectionItems(income: BudgetIncome[]) {
  return income.map((item) => ({
    id: item.id,
    label: item.name,
    amount: item.amount,
    sublabel: item.bankAccount.name,  // Account name as sublabel
  }))
}
```

#### Rendering in BudgetSection (`BudgetSection.tsx:85-95`)
Account name displayed as gray secondary text below item name:
```tsx
<p className="font-medium text-gray-900 truncate">{item.label}</p>
{item.sublabel && <p className="text-sm text-gray-500 truncate">{item.sublabel}</p>}
```

## Code References

### Bank Account Creation
- `src/pages/AccountsPage.tsx:28-30` - Modal open trigger
- `src/pages/AccountsPage.tsx:64-67` - Modal rendering
- `src/components/accounts/CreateAccountModal.tsx:39-52` - Submit handler
- `src/components/accounts/CreateAccountModal.tsx:67-101` - Form fields
- `src/components/accounts/schemas.ts:3-11` - Validation schema
- `src/api/accounts.ts:16-18` - API function
- `src/hooks/use-accounts.ts:37-46` - Mutation hook

### Budget Wizard Account Selection
- `src/components/wizard/steps/StepIncome.tsx:73-95` - Update handler
- `src/components/wizard/steps/StepIncome.tsx:199-215` - Select component
- `src/components/wizard/steps/StepExpenses.tsx:153-175` - Update handler
- `src/components/wizard/steps/StepExpenses.tsx:388-404` - Select component
- `src/components/wizard/steps/StepSavings.tsx:84-106` - Update handler
- `src/components/wizard/steps/StepSavings.tsx:221-228` - No accounts alert
- `src/components/wizard/steps/StepSavings.tsx:272-288` - Select component
- `src/components/wizard/types.ts:11-36` - Wizard item types
- `src/components/wizard/types.ts:167-189` - Item validation functions
- `src/components/wizard/WizardContext.tsx:23-44` - Step validation

### Budget Detail Account Selection
- `src/components/budget-detail/IncomeItemModal.tsx:134-154` - Select in income modal
- `src/components/budget-detail/ExpenseItemModal.tsx:139-159` - Select in expense modal
- `src/components/budget-detail/schemas.ts:3-26` - Validation schemas
- `src/pages/BudgetDetailPage.tsx:18-43` - Mapping functions

### API Types
- `src/api/types.ts:15-21` - BankAccount interface
- `src/api/types.ts:29-33` - CreateBankAccountRequest
- `src/api/types.ts:134-137` - BankAccountRef
- `src/api/types.ts:181-220` - Budget item request types

## Architecture Documentation

### Patterns

1. **Modal-based editing**: All account/item creation/editing uses modal dialogs, not inline editing
2. **React Hook Form + Zod**: Consistent form handling pattern with type-safe validation
3. **React Query for server state**: All data fetched/mutated via TanStack Query hooks
4. **Cache invalidation on mutation**: Success callbacks invalidate relevant query keys
5. **Two-tier account references**: Full `BankAccount` for account management, lightweight `BankAccountRef` for budget items
6. **ID + Name storage in wizard**: Wizard stores both for display purposes during multi-step flow

### Component Conventions

- shadcn/ui `Select` component for account dropdowns (not native `<select>`)
- Controlled components via React Hook Form `watch()` and `setValue()`
- Error messages displayed inline below form fields
- Toast notifications for success only (errors shown inline)

## Historical Context (from thoughts/)

### Related Plans
- `.claude/thoughts/plans/story-02-03-create-account-modal.md` - Original plan for create account modal
- `.claude/thoughts/plans/story-05-02-wizard-step2-income.md` - Plan for income step with account selection
- `.claude/thoughts/plans/story-05-03-wizard-step3-expenses.md` - Plan for expenses step
- `.claude/thoughts/plans/story-05-04-wizard-step4-savings.md` - Plan for savings step

### Related Flow Documentation
- `.claude/thoughts/notes/ACCOUNTS_FLOW.md` - Complete UX flow for bank accounts
- `.claude/thoughts/notes/BUDGET_WIZARD_FLOW.md` - Complete UX flow for budget wizard
- `.claude/thoughts/notes/BUDGET_DETAIL_FLOW.md` - Budget detail page flow

## Open Questions

None - research complete.
