# Story 1.3: API Client & Types

**As a** developer
**I want to** have type-safe API client functions
**So that** I can interact with the backend with full TypeScript support

## Acceptance Criteria

- [ ] All API response types defined as TypeScript interfaces
- [ ] All API request types defined as TypeScript interfaces
- [ ] Fetch wrapper with error handling
- [ ] API client functions for all endpoints
- [ ] User-friendly error messages mapped from API errors
- [ ] Currency formatting utility for SEK

## Type Definitions

Create `src/api/types.ts`:

```typescript
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

export interface RecurringExpense {
  id: string
  name: string
  amount: number
  recurrenceInterval: RecurrenceInterval
  isManual: boolean
  lastUsedDate: string | null
  nextDueDate: string | null
  isDue: boolean
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
}

export interface UpdateRecurringExpenseRequest {
  name: string
  amount: number
  recurrenceInterval: RecurrenceInterval
  isManual: boolean
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
```

## Fetch Wrapper & Error Handling

Create `src/api/client.ts`:

```typescript
const API_BASE = '/api'

// Error message mapping for user-friendly display
const ERROR_MESSAGES: Record<string, string> = {
  'Bank account name already exists': 'An account with this name already exists. Please choose a different name.',
  'Bank account not found': 'This account could not be found. It may have been deleted.',
  'Cannot delete account used in unlocked budget': 'This account is used in a budget that is not locked. Remove it from the budget first, or lock the budget.',
  'Recurring expense with this name already exists': 'A recurring expense with this name already exists. Please choose a different name.',
  'Recurring expense not found': 'This recurring expense could not be found. It may have been deleted.',
  'Budget already exists for this month': 'A budget already exists for this month. You can only have one budget per month.',
  'Another budget is currently unlocked': 'You already have an unlocked budget. Lock or delete it before creating a new one.',
  'Cannot modify locked budget': 'This budget is locked and cannot be modified. Unlock it first if you need to make changes.',
  'Cannot delete locked budget': 'This budget is locked and cannot be deleted. Unlock it first.',
  'Budget must be balanced to lock': 'Your budget must balance to zero before it can be locked. Adjust your income, expenses, or savings.',
  'Cannot unlock - not the most recent budget': 'Only the most recent budget can be unlocked.',
  'Date cannot be in the future': 'The date cannot be in the future. Please select today or an earlier date.',
}

export class ApiClientError extends Error {
  constructor(
    public originalMessage: string,
    public userMessage: string,
    public status: number
  ) {
    super(userMessage)
    this.name = 'ApiClientError'
  }
}

function mapErrorMessage(apiError: string): string {
  return ERROR_MESSAGES[apiError] || apiError
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMessage = 'An unexpected error occurred'

    try {
      const errorBody = await response.json()
      if (errorBody.error) {
        errorMessage = errorBody.error
      }
    } catch {
      // Response wasn't JSON, use status text
      errorMessage = response.statusText
    }

    throw new ApiClientError(
      errorMessage,
      mapErrorMessage(errorMessage),
      response.status
    )
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return undefined as T
  }

  return response.json()
}

export async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`)
  return handleResponse<T>(response)
}

export async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
  return handleResponse<T>(response)
}

export async function apiPut<T>(path: string, body?: unknown): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
  return handleResponse<T>(response)
}

export async function apiDelete<T = void>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: 'DELETE',
  })
  return handleResponse<T>(response)
}
```

## API Functions by Domain

Create `src/api/accounts.ts`:

```typescript
import { apiGet, apiPost, apiPut, apiDelete } from './client'
import type {
  BankAccountListResponse,
  BankAccount,
  CreateBankAccountRequest,
  UpdateBankAccountRequest,
  UpdateBalanceRequest,
  BalanceUpdateResponse,
  BalanceHistoryResponse,
} from './types'

export async function getAccounts(): Promise<BankAccountListResponse> {
  return apiGet('/bank-accounts')
}

export async function createAccount(data: CreateBankAccountRequest): Promise<BankAccount> {
  return apiPost('/bank-accounts', data)
}

export async function updateAccount(id: string, data: UpdateBankAccountRequest): Promise<BankAccount> {
  return apiPut(`/bank-accounts/${id}`, data)
}

export async function deleteAccount(id: string): Promise<void> {
  return apiDelete(`/bank-accounts/${id}`)
}

export async function updateBalance(id: string, data: UpdateBalanceRequest): Promise<BalanceUpdateResponse> {
  return apiPost(`/bank-accounts/${id}/balance`, data)
}

export async function getBalanceHistory(
  id: string,
  page: number = 0,
  size: number = 20
): Promise<BalanceHistoryResponse> {
  return apiGet(`/bank-accounts/${id}/balance-history?page=${page}&size=${size}`)
}
```

Create `src/api/recurring-expenses.ts`:

```typescript
import { apiGet, apiPost, apiPut, apiDelete } from './client'
import type {
  RecurringExpenseListResponse,
  RecurringExpense,
  CreateRecurringExpenseRequest,
  UpdateRecurringExpenseRequest,
} from './types'

export async function getRecurringExpenses(): Promise<RecurringExpenseListResponse> {
  return apiGet('/recurring-expenses')
}

export async function createRecurringExpense(data: CreateRecurringExpenseRequest): Promise<RecurringExpense> {
  return apiPost('/recurring-expenses', data)
}

export async function updateRecurringExpense(id: string, data: UpdateRecurringExpenseRequest): Promise<RecurringExpense> {
  return apiPut(`/recurring-expenses/${id}`, data)
}

export async function deleteRecurringExpense(id: string): Promise<void> {
  return apiDelete(`/recurring-expenses/${id}`)
}
```

Create `src/api/budgets.ts`:

```typescript
import { apiGet, apiPost, apiPut, apiDelete } from './client'
import type {
  BudgetListResponse,
  BudgetDetail,
  BudgetSummary,
  CreateBudgetRequest,
  CreateBudgetIncomeRequest,
  UpdateBudgetIncomeRequest,
  CreateBudgetExpenseRequest,
  UpdateBudgetExpenseRequest,
  CreateBudgetSavingsRequest,
  UpdateBudgetSavingsRequest,
  BudgetIncome,
  BudgetExpense,
  BudgetSavings,
} from './types'

// Budget CRUD
export async function getBudgets(): Promise<BudgetListResponse> {
  return apiGet('/budgets')
}

export async function getBudget(id: string): Promise<BudgetDetail> {
  return apiGet(`/budgets/${id}`)
}

export async function createBudget(data: CreateBudgetRequest): Promise<BudgetSummary> {
  return apiPost('/budgets', data)
}

export async function deleteBudget(id: string): Promise<void> {
  return apiDelete(`/budgets/${id}`)
}

export async function lockBudget(id: string): Promise<BudgetDetail> {
  return apiPut(`/budgets/${id}/lock`)
}

export async function unlockBudget(id: string): Promise<BudgetDetail> {
  return apiPut(`/budgets/${id}/unlock`)
}

// Income
export async function addIncome(budgetId: string, data: CreateBudgetIncomeRequest): Promise<BudgetIncome> {
  return apiPost(`/budgets/${budgetId}/income`, data)
}

export async function updateIncome(budgetId: string, incomeId: string, data: UpdateBudgetIncomeRequest): Promise<BudgetIncome> {
  return apiPut(`/budgets/${budgetId}/income/${incomeId}`, data)
}

export async function deleteIncome(budgetId: string, incomeId: string): Promise<void> {
  return apiDelete(`/budgets/${budgetId}/income/${incomeId}`)
}

// Expenses
export async function addExpense(budgetId: string, data: CreateBudgetExpenseRequest): Promise<BudgetExpense> {
  return apiPost(`/budgets/${budgetId}/expenses`, data)
}

export async function updateExpense(budgetId: string, expenseId: string, data: UpdateBudgetExpenseRequest): Promise<BudgetExpense> {
  return apiPut(`/budgets/${budgetId}/expenses/${expenseId}`, data)
}

export async function deleteExpense(budgetId: string, expenseId: string): Promise<void> {
  return apiDelete(`/budgets/${budgetId}/expenses/${expenseId}`)
}

// Savings
export async function addSavings(budgetId: string, data: CreateBudgetSavingsRequest): Promise<BudgetSavings> {
  return apiPost(`/budgets/${budgetId}/savings`, data)
}

export async function updateSavings(budgetId: string, savingsId: string, data: UpdateBudgetSavingsRequest): Promise<BudgetSavings> {
  return apiPut(`/budgets/${budgetId}/savings/${savingsId}`, data)
}

export async function deleteSavings(budgetId: string, savingsId: string): Promise<void> {
  return apiDelete(`/budgets/${budgetId}/savings/${savingsId}`)
}
```

Create `src/api/todo.ts`:

```typescript
import { apiGet, apiPut } from './client'
import type { TodoList, TodoItem, UpdateTodoItemRequest } from './types'

export async function getTodoList(budgetId: string): Promise<TodoList> {
  return apiGet(`/budgets/${budgetId}/todo-list`)
}

export async function updateTodoItem(
  budgetId: string,
  itemId: string,
  data: UpdateTodoItemRequest
): Promise<TodoItem> {
  return apiPut(`/budgets/${budgetId}/todo-list/items/${itemId}`, data)
}
```

Create barrel export `src/api/index.ts`:

```typescript
export * from './types'
export * from './client'
export * from './accounts'
export * from './recurring-expenses'
export * from './budgets'
export * from './todo'
```

## Currency Formatting Utility

Add to `src/lib/utils.ts`:

```typescript
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a number as Swedish Kronor (SEK)
 * Examples: 1234.56 -> "1 234,56 kr", -500 -> "-500,00 kr"
 */
export function formatCurrency(amount: number): string {
  const formatted = new Intl.NumberFormat('sv-SE', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)

  return `${formatted} kr`
}

/**
 * Format a date string for display
 * Examples: "2025-03-15" -> "15 mar 2025"
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('sv-SE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

/**
 * Format month and year for budget display
 * Examples: (3, 2025) -> "Mars 2025"
 */
export function formatMonthYear(month: number, year: number): string {
  const date = new Date(year, month - 1) // month is 0-indexed in Date
  return new Intl.DateTimeFormat('sv-SE', {
    month: 'long',
    year: 'numeric',
  }).format(date)
}

/**
 * Get month name
 * Examples: 3 -> "Mars"
 */
export function getMonthName(month: number): string {
  const date = new Date(2000, month - 1)
  return new Intl.DateTimeFormat('sv-SE', { month: 'long' }).format(date)
}
```

## File Structure After Completion

```
src/
├── api/
│   ├── accounts.ts
│   ├── budgets.ts
│   ├── client.ts
│   ├── index.ts
│   ├── recurring-expenses.ts
│   ├── todo.ts
│   └── types.ts
└── lib/
    └── utils.ts
```

## Definition of Done

- [ ] All types compile without errors
- [ ] API client functions can be imported
- [ ] `formatCurrency(1234.56)` returns `"1 234,56 kr"`
- [ ] `formatMonthYear(3, 2025)` returns `"mars 2025"` (or similar Swedish format)
- [ ] Error mapping works (manual test with mock response)
- [ ] Budget balance calculation utilities work correctly
- [ ] Month/year comparison utilities work correctly

## Additional Utility Functions

**Add to `src/lib/utils.ts`:**

```typescript
// =============================================================================
// BUDGET BALANCE UTILITIES
// =============================================================================

/**
 * Calculate budget totals and balance
 * Balance = income - expenses - savings
 * Balance of 0 means budget is balanced (ready to lock)
 */
export function calculateBudgetTotals(
  income: Array<{ amount: number }>,
  expenses: Array<{ amount: number }>,
  savings: Array<{ amount: number }>
): {
  incomeTotal: number
  expensesTotal: number
  savingsTotal: number
  balance: number
} {
  const incomeTotal = income.reduce((sum, item) => sum + item.amount, 0)
  const expensesTotal = expenses.reduce((sum, item) => sum + item.amount, 0)
  const savingsTotal = savings.reduce((sum, item) => sum + item.amount, 0)
  const balance = incomeTotal - expensesTotal - savingsTotal

  return { incomeTotal, expensesTotal, savingsTotal, balance }
}

/**
 * Check if a budget is balanced (balance equals zero)
 * Uses a small epsilon for floating point comparison
 */
export function isBudgetBalanced(balance: number): boolean {
  return Math.abs(balance) < 0.01 // Within 1 öre
}

/**
 * Format balance with color indicator
 */
export function formatBalance(balance: number): {
  text: string
  colorClass: string
  isBalanced: boolean
} {
  const isBalanced = isBudgetBalanced(balance)

  if (isBalanced) {
    return { text: '0,00 kr', colorClass: 'text-green-600', isBalanced: true }
  }

  if (balance > 0) {
    return { text: `+${formatCurrency(balance)}`, colorClass: 'text-yellow-600', isBalanced: false }
  }

  return { text: formatCurrency(balance), colorClass: 'text-red-600', isBalanced: false }
}

// =============================================================================
// MONTH/YEAR UTILITIES
// =============================================================================

/**
 * Convert month and year to a comparable integer (YYYYMM format)
 */
export function monthYearToNumber(month: number, year: number): number {
  return year * 100 + month
}

/**
 * Compare two month/year pairs
 * Returns negative if a < b, zero if equal, positive if a > b
 */
export function compareMonthYear(
  a: { month: number; year: number },
  b: { month: number; year: number }
): number {
  return monthYearToNumber(a.month, a.year) - monthYearToNumber(b.month, b.year)
}

/**
 * Get the previous month
 */
export function getPreviousMonth(month: number, year: number): { month: number; year: number } {
  if (month === 1) {
    return { month: 12, year: year - 1 }
  }
  return { month: month - 1, year }
}

/**
 * Get the next month
 */
export function getNextMonth(month: number, year: number): { month: number; year: number } {
  if (month === 12) {
    return { month: 1, year: year + 1 }
  }
  return { month: month + 1, year }
}

/**
 * Get current month and year
 */
export function getCurrentMonthYear(): { month: number; year: number } {
  const now = new Date()
  return { month: now.getMonth() + 1, year: now.getFullYear() }
}

// =============================================================================
// UUID GENERATION
// =============================================================================

/**
 * Generate a UUID for client-side item tracking
 */
export function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  // Fallback for older browsers
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

// =============================================================================
// FORM HELPERS
// =============================================================================

/**
 * Parse a string to a number, returning 0 for invalid input
 * Handles Swedish decimal format (comma as separator)
 */
export function parseAmount(value: string): number {
  const normalized = value.replace(/\s/g, '').replace(',', '.')
  const parsed = parseFloat(normalized)
  return isNaN(parsed) ? 0 : parsed
}

/**
 * Format a number for display in an input field
 * Uses Swedish format with comma as decimal separator
 */
export function formatAmountForInput(amount: number): string {
  return amount.toFixed(2).replace('.', ',')
}
```

**Tests for utilities (`src/lib/utils.test.ts`):**

```typescript
describe('calculateBudgetTotals', () => {
  it('calculates totals correctly', () => {
    const income = [{ amount: 50000 }, { amount: 5000 }]
    const expenses = [{ amount: 30000 }, { amount: 2000 }]
    const savings = [{ amount: 10000 }, { amount: 8000 }]

    const result = calculateBudgetTotals(income, expenses, savings)

    expect(result.incomeTotal).toBe(55000)
    expect(result.expensesTotal).toBe(32000)
    expect(result.savingsTotal).toBe(18000)
    expect(result.balance).toBe(5000) // 55000 - 32000 - 18000 = 5000
  })

  it('handles empty arrays', () => {
    const result = calculateBudgetTotals([], [], [])
    expect(result.balance).toBe(0)
  })
})

describe('isBudgetBalanced', () => {
  it('returns true for zero', () => {
    expect(isBudgetBalanced(0)).toBe(true)
  })

  it('returns true for near-zero (floating point)', () => {
    expect(isBudgetBalanced(0.001)).toBe(true)
    expect(isBudgetBalanced(-0.005)).toBe(true)
  })

  it('returns false for non-zero', () => {
    expect(isBudgetBalanced(1)).toBe(false)
    expect(isBudgetBalanced(-50)).toBe(false)
  })
})

describe('compareMonthYear', () => {
  it('compares correctly', () => {
    expect(compareMonthYear({ month: 3, year: 2025 }, { month: 1, year: 2025 })).toBeGreaterThan(0)
    expect(compareMonthYear({ month: 1, year: 2025 }, { month: 3, year: 2025 })).toBeLessThan(0)
    expect(compareMonthYear({ month: 3, year: 2025 }, { month: 3, year: 2025 })).toBe(0)
    expect(compareMonthYear({ month: 12, year: 2024 }, { month: 1, year: 2025 })).toBeLessThan(0)
  })
})

describe('parseAmount', () => {
  it('parses Swedish format', () => {
    expect(parseAmount('1 234,56')).toBe(1234.56)
  })

  it('parses standard format', () => {
    expect(parseAmount('1234.56')).toBe(1234.56)
  })

  it('returns 0 for invalid input', () => {
    expect(parseAmount('abc')).toBe(0)
    expect(parseAmount('')).toBe(0)
  })
})
```

## Testing

### Test File: `src/lib/utils.test.ts`

```typescript
import { describe, it, expect } from 'vitest'
import { formatCurrency, formatDate, formatMonthYear, getMonthName } from './utils'

describe('formatCurrency', () => {
  it('formats positive amounts with Swedish locale', () => {
    expect(formatCurrency(1234.56)).toBe('1 234,56 kr')
  })

  it('formats zero', () => {
    expect(formatCurrency(0)).toBe('0,00 kr')
  })

  it('formats negative amounts', () => {
    expect(formatCurrency(-500)).toBe('−500,00 kr')
  })

  it('formats large amounts with thousand separators', () => {
    expect(formatCurrency(1000000)).toBe('1 000 000,00 kr')
  })

  it('rounds to two decimal places', () => {
    expect(formatCurrency(123.456)).toBe('123,46 kr')
  })
})

describe('formatDate', () => {
  it('formats ISO date string to Swedish locale', () => {
    const result = formatDate('2025-03-15')
    expect(result).toMatch(/15.*mar.*2025/i)
  })

  it('formats datetime string', () => {
    const result = formatDate('2025-12-25T10:30:00Z')
    expect(result).toMatch(/25.*dec.*2025/i)
  })
})

describe('formatMonthYear', () => {
  it('formats month and year in Swedish', () => {
    const result = formatMonthYear(3, 2025)
    expect(result.toLowerCase()).toContain('mars')
    expect(result).toContain('2025')
  })

  it('handles January (month 1)', () => {
    const result = formatMonthYear(1, 2025)
    expect(result.toLowerCase()).toContain('januari')
  })

  it('handles December (month 12)', () => {
    const result = formatMonthYear(12, 2025)
    expect(result.toLowerCase()).toContain('december')
  })
})

describe('getMonthName', () => {
  it('returns Swedish month names', () => {
    expect(getMonthName(1).toLowerCase()).toBe('januari')
    expect(getMonthName(6).toLowerCase()).toBe('juni')
    expect(getMonthName(12).toLowerCase()).toBe('december')
  })
})
```

### Test File: `src/api/client.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ApiClientError, apiGet, apiPost, apiPut, apiDelete } from './client'

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

beforeEach(() => {
  mockFetch.mockReset()
})

describe('ApiClientError', () => {
  it('stores original and user-friendly messages', () => {
    const error = new ApiClientError(
      'Bank account name already exists',
      'An account with this name already exists. Please choose a different name.',
      400
    )

    expect(error.originalMessage).toBe('Bank account name already exists')
    expect(error.userMessage).toBe('An account with this name already exists. Please choose a different name.')
    expect(error.status).toBe(400)
    expect(error.message).toBe(error.userMessage)
  })
})

describe('apiGet', () => {
  it('returns parsed JSON on success', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: 'test' }),
    })

    const result = await apiGet('/test')

    expect(mockFetch).toHaveBeenCalledWith('/api/test')
    expect(result).toEqual({ data: 'test' })
  })

  it('throws ApiClientError on error response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ error: 'Bank account name already exists' }),
    })

    await expect(apiGet('/test')).rejects.toThrow(ApiClientError)

    try {
      await apiGet('/test')
    } catch (e) {
      const error = e as ApiClientError
      expect(error.userMessage).toContain('already exists')
    }
  })
})

describe('apiPost', () => {
  it('sends JSON body and returns response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: () => Promise.resolve({ id: '123' }),
    })

    const result = await apiPost('/test', { name: 'Test' })

    expect(mockFetch).toHaveBeenCalledWith('/api/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test' }),
    })
    expect(result).toEqual({ id: '123' })
  })
})

describe('apiPut', () => {
  it('sends PUT request with body', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ updated: true }),
    })

    await apiPut('/test/1', { name: 'Updated' })

    expect(mockFetch).toHaveBeenCalledWith('/api/test/1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Updated' }),
    })
  })
})

describe('apiDelete', () => {
  it('handles 204 No Content response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 204,
    })

    const result = await apiDelete('/test/1')

    expect(mockFetch).toHaveBeenCalledWith('/api/test/1', {
      method: 'DELETE',
    })
    expect(result).toBeUndefined()
  })
})

describe('error message mapping', () => {
  const errorCases = [
    {
      apiError: 'Bank account name already exists',
      expectedContains: 'already exists',
    },
    {
      apiError: 'Cannot delete account used in unlocked budget',
      expectedContains: 'used in a budget',
    },
    {
      apiError: 'Budget already exists for this month',
      expectedContains: 'already exists for this month',
    },
    {
      apiError: 'Cannot modify locked budget',
      expectedContains: 'locked',
    },
    {
      apiError: 'Unknown error from API',
      expectedContains: 'Unknown error from API', // Falls through unchanged
    },
  ]

  it.each(errorCases)('maps "$apiError" to user-friendly message', async ({ apiError, expectedContains }) => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ error: apiError }),
    })

    try {
      await apiGet('/test')
    } catch (e) {
      const error = e as ApiClientError
      expect(error.userMessage.toLowerCase()).toContain(expectedContains.toLowerCase())
    }
  })
})
```

### TDD Flow for Story 1.3

1. **Write tests first** — Copy the test files above
2. **Run tests** — `npm test` (all should fail)
3. **Implement `src/lib/utils.ts`** — Make utility tests pass
4. **Implement `src/api/client.ts`** — Make API client tests pass
5. **Run tests** — All should pass
6. **Implement remaining API files** — `accounts.ts`, `budgets.ts`, etc. (these are thin wrappers, covered by integration tests later)
