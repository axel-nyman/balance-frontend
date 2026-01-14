import type {
  CreateBudgetIncomeRequest,
  CreateBudgetExpenseRequest,
  CreateBudgetSavingsRequest,
} from '@/api/types'

// =============================================================================
// WIZARD ITEM TYPES
// =============================================================================

export interface WizardIncomeItem {
  id: string // Client-side UUID
  name: string // Required: e.g., "Salary"
  amount: number // Required: Must be positive
  bankAccountId: string // Required: Target account
  bankAccountName: string // Display only
}

export interface WizardExpenseItem {
  id: string // Client-side UUID
  name: string // Required: e.g., "Rent"
  amount: number // Required: Must be positive
  bankAccountId: string // Required: Source account
  bankAccountName: string // Display only
  isManual: boolean // Required: Generates PAYMENT todo if true
  recurringExpenseId?: string // Optional: Link to template
  deductedAt?: string // Optional: Deduction date (ISO)
}

export interface WizardSavingsItem {
  id: string // Client-side UUID
  name: string // Required: e.g., "Emergency Fund"
  amount: number // Required: Must be positive
  bankAccountId: string // Required: Target savings account
  bankAccountName: string // Display only
}

// =============================================================================
// WIZARD STATE
// =============================================================================

export interface WizardState {
  currentStep: number
  month: number | null
  year: number | null
  budgetExists: boolean
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
  | { type: 'SET_BUDGET_EXISTS'; exists: boolean }
  | { type: 'SET_INCOME_ITEMS'; items: WizardIncomeItem[] }
  | { type: 'ADD_INCOME_ITEM'; item: WizardIncomeItem }
  | { type: 'UPDATE_INCOME_ITEM'; id: string; updates: Partial<WizardIncomeItem> }
  | { type: 'REMOVE_INCOME_ITEM'; id: string }
  | { type: 'SET_EXPENSE_ITEMS'; items: WizardExpenseItem[] }
  | { type: 'ADD_EXPENSE_ITEM'; item: WizardExpenseItem }
  | { type: 'UPDATE_EXPENSE_ITEM'; id: string; updates: Partial<WizardExpenseItem> }
  | { type: 'REMOVE_EXPENSE_ITEM'; id: string }
  | { type: 'SET_SAVINGS_ITEMS'; items: WizardSavingsItem[] }
  | { type: 'ADD_SAVINGS_ITEM'; item: WizardSavingsItem }
  | { type: 'UPDATE_SAVINGS_ITEM'; id: string; updates: Partial<WizardSavingsItem> }
  | { type: 'REMOVE_SAVINGS_ITEM'; id: string }
  | { type: 'NEXT_STEP' }
  | { type: 'PREV_STEP' }
  | { type: 'GO_TO_STEP'; step: number }
  | { type: 'SET_SUBMITTING'; isSubmitting: boolean }
  | { type: 'SET_ERROR'; error: string | null }
  | { type: 'RESET' }

// =============================================================================
// CONSTANTS
// =============================================================================

export const WIZARD_STEPS = [
  { id: 1, title: 'Month', description: 'Select budget period' },
  { id: 2, title: 'Income', description: 'Add income sources' },
  { id: 3, title: 'Expenses', description: 'Add monthly expenses' },
  { id: 4, title: 'Savings', description: 'Set savings goals' },
  { id: 5, title: 'Review', description: 'Review and create' },
] as const

export const TOTAL_STEPS = 5

// =============================================================================
// HELPER: Convert wizard items to API requests
// =============================================================================

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

// =============================================================================
// HELPER: Create empty items for new rows
// =============================================================================

export function createEmptyIncomeItem(): WizardIncomeItem {
  return {
    id: crypto.randomUUID(),
    name: '',
    amount: 0,
    bankAccountId: '',
    bankAccountName: '',
  }
}

export function createEmptyExpenseItem(): WizardExpenseItem {
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

export function createEmptySavingsItem(): WizardSavingsItem {
  return {
    id: crypto.randomUUID(),
    name: '',
    amount: 0,
    bankAccountId: '',
    bankAccountName: '',
  }
}

// =============================================================================
// VALIDATION HELPERS
// =============================================================================

export function isIncomeItemValid(item: WizardIncomeItem): boolean {
  return (
    item.name.trim().length > 0 &&
    item.amount > 0 &&
    item.bankAccountId.length > 0
  )
}

export function isExpenseItemValid(item: WizardExpenseItem): boolean {
  return (
    item.name.trim().length > 0 &&
    item.amount > 0 &&
    item.bankAccountId.length > 0
  )
}

export function isSavingsItemValid(item: WizardSavingsItem): boolean {
  return (
    item.name.trim().length > 0 &&
    item.amount > 0 &&
    item.bankAccountId.length > 0
  )
}
