// =============================================================================
// ENUMS
// =============================================================================

export type BudgetStatus = 'LOCKED' | 'UNLOCKED'
export type RecurrenceInterval = 'MONTHLY' | 'QUARTERLY' | 'BIANNUALLY' | 'YEARLY'
export type TodoItemType = 'TRANSFER' | 'PAYMENT'
export type TodoItemStatus = 'PENDING' | 'COMPLETED'
export type BalanceSource = 'MANUAL' | 'AUTOMATIC'
export type SavingsGoalStatus = 'ACTIVE' | 'ARCHIVED'
export type GoalAllocationChangeSource =
  | 'MANUAL'
  | 'BUDGET_LOCK'
  | 'BALANCE_REALLOCATION'
  | 'ARCHIVE'

// =============================================================================
// BANK ACCOUNTS
// =============================================================================

export interface BankAccount {
  id: string
  name: string
  description: string | null
  currentBalance: number
  /**
   * Savings-goal allocation figures (item 070a, additive). Always present on the
   * `/api/bank-accounts` response; optional here because a few places build
   * partial account objects that don't carry allocation data.
   */
  allocatedAmount?: number
  unallocatedAmount?: number
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
  /**
   * Optional savings-goal reallocation (item 070d). Signed per-goal changes that
   * resolve the balance update against this account's earmarks: negative reduces
   * (splits a deficit on a decrease), positive adds (earmarks an increase).
   * Omitted on the common case.
   */
  reallocation?: ReallocationEntry[]
}

export interface ReallocationEntry {
  savingsGoalId: string
  changeBy: number
}

/** A goal earmark adjusted as part of a balance update (item 070d). */
export interface AllocationAdjustment {
  savingsGoalId: string
  goalName: string
  changeAmount: number
  resultingAmount: number
}

/** 409 body when a decrease over-allocates an account backed by 2+ goals (item 070d). */
export interface ReallocationConflictResponse {
  error: string
  accountId: string
  accountName: string
  newBalance: number
  totalAllocated: number
  requiredReduction: number
  goals: ReallocationConflictGoal[]
}

export interface ReallocationConflictGoal {
  savingsGoalId: string
  goalName: string
  currentAllocation: number
}

export interface BalanceUpdateResponse {
  id: string
  name: string
  currentBalance: number
  previousBalance: number
  changeAmount: number
  lastUpdated: string
  /** Earmarks adjusted by this update; empty/absent when none changed (item 070d). */
  allocationAdjustments?: AllocationAdjustment[]
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
  savingsGoalId: string | null
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
  savingsGoalId?: string
}

export interface UpdateBudgetSavingsRequest {
  name: string
  amount: number
  bankAccountId: string
  savingsGoalId?: string | null
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
// SAVINGS GOALS
// =============================================================================

export interface GoalAccountAllocation {
  bankAccountId: string
  bankAccountName: string
  amount: number
}

export interface SavingsGoal {
  id: string
  name: string
  targetAmount: number | null
  endDate: string | null
  status: SavingsGoalStatus
  totalAllocated: number
  /** Allocated / target as a percentage; null when no target is set. */
  progressPercentage: number | null
  completed: boolean
  allocations: GoalAccountAllocation[]
  archivedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface SavingsGoalListResponse {
  goalCount: number
  goals: SavingsGoal[]
}

export interface GoalAllocationChange {
  id: string
  bankAccountId: string
  bankAccountName: string
  changeAmount: number
  resultingAmount: number
  source: GoalAllocationChangeSource
  createdAt: string
}

export interface GoalAllocationHistoryResponse {
  goalId: string
  changes: GoalAllocationChange[]
}

export interface SeedAllocationRequest {
  bankAccountId: string
  amount: number
}

export interface CreateSavingsGoalRequest {
  name: string
  targetAmount?: number
  endDate?: string
  allocations?: SeedAllocationRequest[]
}

export interface UpdateSavingsGoalRequest {
  name: string
  targetAmount?: number
  endDate?: string
}

export interface AllocateRequest {
  bankAccountId: string
  amount: number
}

export interface ArchiveSavingsGoalRequest {
  releaseToBalance: boolean
}

// =============================================================================
// ERROR RESPONSES
// =============================================================================

export interface ApiError {
  error: string
}
