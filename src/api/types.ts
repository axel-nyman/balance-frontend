// =============================================================================
// ENUMS
// =============================================================================

export type BudgetStatus = 'LOCKED' | 'UNLOCKED'
export type RecurrenceInterval = 'MONTHLY' | 'QUARTERLY' | 'BIANNUALLY' | 'YEARLY'
export type TodoItemType = 'TRANSFER' | 'PAYMENT'
export type TodoItemStatus = 'PENDING' | 'COMPLETED'
export type BalanceSource = 'MANUAL' | 'AUTOMATIC'

// =============================================================================
// BANK ACCOUNTS
// =============================================================================

export interface BankAccount {
  id: string
  name: string
  description: string | null
  currentBalance: number
  createdAt: string
}

export interface BankAccountListResponse {
  totalBalance: number
  accountCount: number
  accounts: BankAccount[]
}

export interface CreateBankAccountRequest {
  name: string
  description?: string
  initialBalance?: number
}

export interface UpdateBankAccountRequest {
  name: string
  description?: string
}

export interface UpdateBalanceRequest {
  newBalance: number
  date: string
  comment?: string
}

export interface BalanceUpdateResponse {
  id: string
  name: string
  currentBalance: number
  previousBalance: number
  changeAmount: number
  lastUpdated: string
}

export interface BalanceHistoryEntry {
  id: string
  balance: number
  changeAmount: number
  changeDate: string
  comment: string | null
  source: BalanceSource
  budgetId: string | null
}

export interface BalanceHistoryResponse {
  content: BalanceHistoryEntry[]
  page: {
    size: number
    number: number
    totalElements: number
    totalPages: number
  }
}

// =============================================================================
// RECURRING EXPENSES
// =============================================================================

export interface BankAccountSummary {
  id: string
  name: string
}

export interface RecurringExpense {
  id: string
  name: string
  amount: number
  recurrenceInterval: RecurrenceInterval
  isManual: boolean
  bankAccount: BankAccountSummary | null
  dueMonth: number | null
  dueYear: number | null
  dueDisplay: string | null
  createdAt: string
}

export interface RecurringExpenseListResponse {
  expenses: RecurringExpense[]
}

export interface CreateRecurringExpenseRequest {
  name: string
  amount: number
  recurrenceInterval: RecurrenceInterval
  isManual: boolean
  bankAccountId?: string
}

export interface UpdateRecurringExpenseRequest {
  name: string
  amount: number
  recurrenceInterval: RecurrenceInterval
  isManual: boolean
  bankAccountId?: string
}

// =============================================================================
// BUDGETS
// =============================================================================

export interface BudgetTotals {
  income: number
  expenses: number
  savings: number
  balance: number
}

export interface BudgetSummary {
  id: string
  month: number
  year: number
  status: BudgetStatus
  createdAt: string
  lockedAt: string | null
  totals: BudgetTotals
}

export interface BudgetListResponse {
  budgets: BudgetSummary[]
}

export interface BankAccountRef {
  id: string
  name: string
}

export interface BudgetIncome {
  id: string
  name: string
  amount: number
  bankAccount: BankAccountRef
}

export interface BudgetExpense {
  id: string
  name: string
  amount: number
  bankAccount: BankAccountRef
  recurringExpenseId: string | null
  deductedAt: string | null
  isManual: boolean
}

export interface BudgetSavings {
  id: string
  name: string
  amount: number
  bankAccount: BankAccountRef
}

export interface BudgetDetail {
  id: string
  month: number
  year: number
  status: BudgetStatus
  createdAt: string
  lockedAt: string | null
  income: BudgetIncome[]
  expenses: BudgetExpense[]
  savings: BudgetSavings[]
  totals: BudgetTotals
}

export interface CreateBudgetRequest {
  month: number
  year: number
}

export interface CreateBudgetIncomeRequest {
  name: string
  amount: number
  bankAccountId: string
}

export interface UpdateBudgetIncomeRequest {
  name: string
  amount: number
  bankAccountId: string
}

export interface CreateBudgetExpenseRequest {
  name: string
  amount: number
  bankAccountId: string
  recurringExpenseId?: string
  deductedAt?: string
  isManual: boolean
}

export interface UpdateBudgetExpenseRequest {
  name: string
  amount: number
  bankAccountId: string
  deductedAt?: string
  isManual: boolean
}

export interface CreateBudgetSavingsRequest {
  name: string
  amount: number
  bankAccountId: string
}

export interface UpdateBudgetSavingsRequest {
  name: string
  amount: number
  bankAccountId: string
}

// =============================================================================
// TODO LIST
// =============================================================================

export interface TodoItemAccount {
  id: string
  name: string
}

export interface TodoItem {
  id: string
  name: string
  status: TodoItemStatus
  type: TodoItemType
  amount: number
  fromAccount: TodoItemAccount
  toAccount: TodoItemAccount | null
  completedAt: string | null
  createdAt: string
}

export interface TodoListSummary {
  totalItems: number
  pendingItems: number
  completedItems: number
}

export interface TodoList {
  id: string
  budgetId: string
  createdAt: string
  items: TodoItem[]
  summary: TodoListSummary
}

export interface UpdateTodoItemRequest {
  status: TodoItemStatus
}

// =============================================================================
// ERROR RESPONSES
// =============================================================================

export interface ApiError {
  error: string
}
