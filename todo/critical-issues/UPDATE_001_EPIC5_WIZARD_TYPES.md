# Update #001: Fix Epic 5 Wizard Types

**Purpose:** Align wizard item types with backend API contracts  
**Files Affected:** `FRONTEND_STORIES_EPIC5.md`  
**Priority:** Critical (blocks implementation)

---

## Problem Summary

The wizard types in Epic 5 don't match the backend API request types defined in Epic 1:

| Item Type | Current (Wrong) | Required (Backend API) |
|-----------|-----------------|------------------------|
| Income | `source`, `amount` | `name`, `amount`, `bankAccountId` |
| Expense | `name`, `amount`, `recurringExpenseId?` | `name`, `amount`, `bankAccountId`, `isManual`, `recurringExpenseId?`, `deductedAt?` |
| Savings | `targetAccountId`, `targetAccountName`, `amount` | `name`, `amount`, `bankAccountId` |

---

## Changes Required

### 1. Replace Wizard Types Definition (Story 5.1)

**Location:** Lines 53-110 and 112-179 in `FRONTEND_STORIES_EPIC5.md`

**Replace the types section with:**

```typescript
// src/components/wizard/types.ts

// =============================================================================
// WIZARD ITEM TYPES
// These mirror the API request types but include a client-side `id` for local
// state management and display-only fields for UX purposes.
// =============================================================================

export interface WizardIncomeItem {
  id: string                    // Client-side UUID for React keys and local operations
  name: string                  // Required: e.g., "Salary", "Freelance payment"
  amount: number                // Required: Must be positive
  bankAccountId: string         // Required: Target account for this income
  bankAccountName: string       // Display only: Shown in UI, not sent to API
}

export interface WizardExpenseItem {
  id: string                    // Client-side UUID
  name: string                  // Required: e.g., "Rent", "Groceries"
  amount: number                // Required: Must be positive
  bankAccountId: string         // Required: Account this expense comes from
  bankAccountName: string       // Display only: Shown in UI
  isManual: boolean             // Required: If true, generates PAYMENT todo item
  recurringExpenseId?: string   // Optional: Link to recurring expense template
  deductedAt?: string           // Optional: Date expense is deducted (ISO format)
}

export interface WizardSavingsItem {
  id: string                    // Client-side UUID
  name: string                  // Required: e.g., "Emergency Fund", "Vacation"
  amount: number                // Required: Must be positive
  bankAccountId: string         // Required: Target savings account
  bankAccountName: string       // Display only: Shown in UI
}

// =============================================================================
// WIZARD STATE
// =============================================================================

export interface WizardState {
  currentStep: number
  month: number | null
  year: number | null
  incomeItems: WizardIncomeItem[]
  expenseItems: WizardExpenseItem[]
  savingsItems: WizardSavingsItem[]
  isDirty: boolean
  isSubmitting: boolean
  error: string | null
}

// =============================================================================
// WIZARD ACTIONS
// =============================================================================

export type WizardAction =
  | { type: 'SET_MONTH_YEAR'; month: number; year: number }
  // Income actions
  | { type: 'SET_INCOME_ITEMS'; items: WizardIncomeItem[] }
  | { type: 'ADD_INCOME_ITEM'; item: WizardIncomeItem }
  | { type: 'UPDATE_INCOME_ITEM'; id: string; updates: Partial<WizardIncomeItem> }
  | { type: 'REMOVE_INCOME_ITEM'; id: string }
  // Expense actions
  | { type: 'SET_EXPENSE_ITEMS'; items: WizardExpenseItem[] }
  | { type: 'ADD_EXPENSE_ITEM'; item: WizardExpenseItem }
  | { type: 'UPDATE_EXPENSE_ITEM'; id: string; updates: Partial<WizardExpenseItem> }
  | { type: 'REMOVE_EXPENSE_ITEM'; id: string }
  // Savings actions
  | { type: 'SET_SAVINGS_ITEMS'; items: WizardSavingsItem[] }
  | { type: 'ADD_SAVINGS_ITEM'; item: WizardSavingsItem }
  | { type: 'UPDATE_SAVINGS_ITEM'; id: string; updates: Partial<WizardSavingsItem> }
  | { type: 'REMOVE_SAVINGS_ITEM'; id: string }
  // Navigation actions
  | { type: 'NEXT_STEP' }
  | { type: 'PREV_STEP' }
  | { type: 'GO_TO_STEP'; step: number }
  // Submission actions
  | { type: 'SET_SUBMITTING'; isSubmitting: boolean }
  | { type: 'SET_ERROR'; error: string | null }
  | { type: 'RESET' }

// =============================================================================
// CONSTANTS
// =============================================================================

export const STEP_TITLES = [
  'Select Month',
  'Income',
  'Expenses',
  'Savings',
  'Review',
] as const

export const TOTAL_STEPS = 5

// =============================================================================
// HELPER: Convert wizard items to API requests
// =============================================================================

import type {
  CreateBudgetIncomeRequest,
  CreateBudgetExpenseRequest,
  CreateBudgetSavingsRequest,
} from '@/api/types'

export function toIncomeRequest(item: WizardIncomeItem): CreateBudgetIncomeRequest {
  return {
    name: item.name,
    amount: item.amount,
    bankAccountId: item.bankAccountId,
  }
}

export function toExpenseRequest(item: WizardExpenseItem): CreateBudgetExpenseRequest {
  return {
    name: item.name,
    amount: item.amount,
    bankAccountId: item.bankAccountId,
    isManual: item.isManual,
    recurringExpenseId: item.recurringExpenseId,
    deductedAt: item.deductedAt,
  }
}

export function toSavingsRequest(item: WizardSavingsItem): CreateBudgetSavingsRequest {
  return {
    name: item.name,
    amount: item.amount,
    bankAccountId: item.bankAccountId,
  }
}
```

---

### 2. Update All References to Old Type Names

Throughout Epic 5, replace:
- `IncomeItem` → `WizardIncomeItem`
- `ExpenseItem` → `WizardExpenseItem`
- `SavingsItem` → `WizardSavingsItem`

**Note:** The `Wizard` prefix distinguishes these client-side types from the API response types (`BudgetIncome`, `BudgetExpense`, `BudgetSavings`).

---

### 3. Update Income Step (Story 5.3) 

**Add bank account selection to income items:**

The income table should have columns:
| Column | Type | Required | Notes |
|--------|------|----------|-------|
| Name | Text input | Yes | e.g., "Salary" |
| Amount | Number input | Yes | Must be positive |
| **Bank Account** | **Dropdown** | **Yes** | **Which account receives this income** |
| Actions | Buttons | — | Delete row button |

**Add helper to create new income item:**

```typescript
function createEmptyIncomeItem(): WizardIncomeItem {
  return {
    id: crypto.randomUUID(),
    name: '',
    amount: 0,
    bankAccountId: '',
    bankAccountName: '',
  }
}
```

---

### 4. Update Expense Step (Story 5.4)

**Expense table columns should include:**
| Column | Type | Required | Notes |
|--------|------|----------|-------|
| Name | Text input | Yes | Pre-filled from template or user-entered |
| Amount | Number input | Yes | Editable, must be positive |
| Bank Account | Dropdown | Yes | **Must be selected before proceeding** |
| Manual Payment | Checkbox | No | Pre-filled from template, editable |
| Actions | Buttons | — | Delete row button |

**When adding from recurring expense template:**

```typescript
function createExpenseFromTemplate(
  template: RecurringExpense,
  defaultBankAccountId?: string
): WizardExpenseItem {
  return {
    id: crypto.randomUUID(),
    name: template.name,
    amount: template.amount,
    bankAccountId: defaultBankAccountId ?? '',  // User must select
    bankAccountName: '',                         // Will be filled when account selected
    isManual: template.isManual,
    recurringExpenseId: template.id,
    deductedAt: undefined,
  }
}

function createEmptyExpenseItem(): WizardExpenseItem {
  return {
    id: crypto.randomUUID(),
    name: '',
    amount: 0,
    bankAccountId: '',
    bankAccountName: '',
    isManual: false,
    recurringExpenseId: undefined,
    deductedAt: undefined,
  }
}
```

---

### 5. Update Savings Step (Story 5.5)

**Savings table columns:**
| Column | Type | Required | Notes |
|--------|------|----------|-------|
| Name | Text input | Yes | e.g., "Emergency Fund", "Vacation" |
| Amount | Number input | Yes | Must be positive |
| Bank Account | Dropdown | Yes | Target savings account |
| Actions | Buttons | — | Delete row button |

**Helper:**

```typescript
function createEmptySavingsItem(): WizardSavingsItem {
  return {
    id: crypto.randomUUID(),
    name: '',
    amount: 0,
    bankAccountId: '',
    bankAccountName: '',
  }
}
```

---

### 6. Update Submit Logic (Story 5.6)

**Replace the submission helpers in the Review step:**

```typescript
async function submitBudget(
  state: WizardState,
  shouldLock: boolean
): Promise<string> {
  // 1. Create the budget
  const budget = await createBudget({
    month: state.month!,
    year: state.year!,
  })

  // 2. Add all income items
  for (const item of state.incomeItems) {
    await addIncome(budget.id, toIncomeRequest(item))
  }

  // 3. Add all expense items
  for (const item of state.expenseItems) {
    await addExpense(budget.id, toExpenseRequest(item))
  }

  // 4. Add all savings items
  for (const item of state.savingsItems) {
    await addSavings(budget.id, toSavingsRequest(item))
  }

  // 5. Optionally lock
  if (shouldLock) {
    await lockBudget(budget.id)
  }

  return budget.id
}
```

---

## Validation Reminder

Every item in the wizard must have a valid `bankAccountId` before the user can proceed to the next step or submit. Add validation:

```typescript
function isIncomeItemValid(item: WizardIncomeItem): boolean {
  return (
    item.name.trim().length > 0 &&
    item.amount > 0 &&
    item.bankAccountId.length > 0
  )
}

function isExpenseItemValid(item: WizardExpenseItem): boolean {
  return (
    item.name.trim().length > 0 &&
    item.amount > 0 &&
    item.bankAccountId.length > 0
  )
}

function isSavingsItemValid(item: WizardSavingsItem): boolean {
  return (
    item.name.trim().length > 0 &&
    item.amount > 0 &&
    item.bankAccountId.length > 0
  )
}
```

---

## Impact Analysis

This change affects:
- Story 5.1: Types definition
- Story 5.3: Income step UI and validation
- Story 5.4: Expense step UI and validation
- Story 5.5: Savings step UI and validation
- Story 5.6: Review step and submission logic
- Story 5.7: Copy from last budget feature (needs to map API response to wizard types)

---

*Created: [Current Date]*
