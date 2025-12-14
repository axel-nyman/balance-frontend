# Balance — Frontend Stories: Epic 1 (Infrastructure)

This document contains detailed, implementable stories for the Infrastructure epic. Complete these stories first — all other epics depend on them.

---

## Story 1.1: Project Setup

**As a** developer  
**I want to** have a properly configured React project  
**So that** I can start building features with the right tooling in place

### Acceptance Criteria

- [ ] Vite project initialized with React + TypeScript template
- [ ] Tailwind CSS installed and configured
- [ ] Project runs with `npm run dev`
- [ ] Production build works with `npm run build`
- [ ] ESLint configured for TypeScript + React
- [ ] Path aliases configured (`@/` maps to `src/`)
- [ ] Base `index.css` includes Tailwind directives

### Implementation Steps

1. **Initialize project**
   ```bash
   npm create vite@latest balance-frontend -- --template react-ts
   cd balance-frontend
   npm install
   ```

2. **Install core dependencies**
   ```bash
   npm install react-router-dom @tanstack/react-query
   npm install react-hook-form @hookform/resolvers zod
   npm install tailwindcss postcss autoprefixer
   npm install clsx tailwind-merge
   npm install -D @types/node
   ```

3. **Initialize Tailwind**
   ```bash
   npx tailwindcss init -p
   ```

4. **Configure `tailwind.config.js`**
   ```javascript
   /** @type {import('tailwindcss').Config} */
   export default {
     content: [
       "./index.html",
       "./src/**/*.{js,ts,jsx,tsx}",
     ],
     theme: {
       extend: {},
     },
     plugins: [],
   }
   ```

5. **Update `src/index.css`**
   ```css
   @tailwind base;
   @tailwind components;
   @tailwind utilities;
   ```

6. **Configure path aliases in `vite.config.ts`**
   ```typescript
   import { defineConfig } from 'vite'
   import react from '@vitejs/plugin-react'
   import path from 'path'

   export default defineConfig({
     plugins: [react()],
     resolve: {
       alias: {
         '@': path.resolve(__dirname, './src'),
       },
     },
   })
   ```

7. **Update `tsconfig.json`** (add to compilerOptions)
   ```json
   {
     "compilerOptions": {
       "baseUrl": ".",
       "paths": {
         "@/*": ["./src/*"]
       }
     }
   }
   ```

8. **Create utility function `src/lib/utils.ts`**
   ```typescript
   import { clsx, type ClassValue } from 'clsx'
   import { twMerge } from 'tailwind-merge'

   export function cn(...inputs: ClassValue[]) {
     return twMerge(clsx(inputs))
   }
   ```

### File Structure After Completion

```
balance-frontend/
├── src/
│   ├── lib/
│   │   └── utils.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── index.html
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

### Definition of Done

- [ ] `npm run dev` starts dev server without errors
- [ ] `npm run build` completes without errors
- [ ] Tailwind classes work (test with a colored div)
- [ ] Path alias works (`import { cn } from '@/lib/utils'`)

---

## Story 1.2: Routing Setup

**As a** developer  
**I want to** have all routes defined and working  
**So that** I can navigate between pages during development

### Acceptance Criteria

- [ ] React Router v6 configured with BrowserRouter
- [ ] All route paths defined as constants
- [ ] Placeholder page components created for each route
- [ ] 404 catch-all route implemented
- [ ] Navigation between routes works

### Route Definitions

| Path | Page Component | Description |
|------|----------------|-------------|
| `/` | Redirect to `/budgets` | Home redirects to budget list |
| `/accounts` | AccountsPage | Bank accounts management |
| `/recurring-expenses` | RecurringExpensesPage | Recurring expense templates |
| `/budgets` | BudgetsPage | Budget list |
| `/budgets/new` | BudgetWizardPage | Create new budget |
| `/budgets/:id` | BudgetDetailPage | View/edit budget |
| `/budgets/:id/todo` | TodoListPage | Todo list for budget |
| `*` | NotFoundPage | 404 page |

### Implementation Steps

1. **Create route constants `src/routes.ts`**
   ```typescript
   export const ROUTES = {
     HOME: '/',
     ACCOUNTS: '/accounts',
     RECURRING_EXPENSES: '/recurring-expenses',
     BUDGETS: '/budgets',
     BUDGET_NEW: '/budgets/new',
     BUDGET_DETAIL: '/budgets/:id',
     BUDGET_TODO: '/budgets/:id/todo',
   } as const

   // Helper functions for dynamic routes
   export const budgetDetailPath = (id: string) => `/budgets/${id}`
   export const budgetTodoPath = (id: string) => `/budgets/${id}/todo`
   ```

2. **Create placeholder pages in `src/pages/`**
   
   Create simple placeholder components for each page:
   ```typescript
   // src/pages/AccountsPage.tsx
   export function AccountsPage() {
     return <div className="p-4"><h1 className="text-2xl font-bold">Accounts</h1></div>
   }
   ```
   
   Create similar files for:
   - `AccountsPage.tsx`
   - `RecurringExpensesPage.tsx`
   - `BudgetsPage.tsx`
   - `BudgetWizardPage.tsx`
   - `BudgetDetailPage.tsx`
   - `TodoListPage.tsx`
   - `NotFoundPage.tsx`

3. **Create pages barrel export `src/pages/index.ts`**
   ```typescript
   export { AccountsPage } from './AccountsPage'
   export { RecurringExpensesPage } from './RecurringExpensesPage'
   export { BudgetsPage } from './BudgetsPage'
   export { BudgetWizardPage } from './BudgetWizardPage'
   export { BudgetDetailPage } from './BudgetDetailPage'
   export { TodoListPage } from './TodoListPage'
   export { NotFoundPage } from './NotFoundPage'
   ```

4. **Configure router in `src/App.tsx`**
   ```typescript
   import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
   import { ROUTES } from './routes'
   import {
     AccountsPage,
     RecurringExpensesPage,
     BudgetsPage,
     BudgetWizardPage,
     BudgetDetailPage,
     TodoListPage,
     NotFoundPage,
   } from './pages'

   function App() {
     return (
       <BrowserRouter>
         <Routes>
           <Route path={ROUTES.HOME} element={<Navigate to={ROUTES.BUDGETS} replace />} />
           <Route path={ROUTES.ACCOUNTS} element={<AccountsPage />} />
           <Route path={ROUTES.RECURRING_EXPENSES} element={<RecurringExpensesPage />} />
           <Route path={ROUTES.BUDGETS} element={<BudgetsPage />} />
           <Route path={ROUTES.BUDGET_NEW} element={<BudgetWizardPage />} />
           <Route path={ROUTES.BUDGET_DETAIL} element={<BudgetDetailPage />} />
           <Route path={ROUTES.BUDGET_TODO} element={<TodoListPage />} />
           <Route path="*" element={<NotFoundPage />} />
         </Routes>
       </BrowserRouter>
     )
   }

   export default App
   ```

### File Structure After Completion

```
src/
├── pages/
│   ├── AccountsPage.tsx
│   ├── RecurringExpensesPage.tsx
│   ├── BudgetsPage.tsx
│   ├── BudgetWizardPage.tsx
│   ├── BudgetDetailPage.tsx
│   ├── TodoListPage.tsx
│   ├── NotFoundPage.tsx
│   └── index.ts
├── routes.ts
└── App.tsx
```

### Definition of Done

- [ ] Can navigate to all routes via URL bar
- [ ] Unknown routes show 404 page
- [ ] Home (`/`) redirects to `/budgets`
- [ ] No console errors during navigation

---

## Story 1.3: API Client & Types

**As a** developer  
**I want to** have type-safe API client functions  
**So that** I can interact with the backend with full TypeScript support

### Acceptance Criteria

- [ ] All API response types defined as TypeScript interfaces
- [ ] All API request types defined as TypeScript interfaces
- [ ] Fetch wrapper with error handling
- [ ] API client functions for all endpoints
- [ ] User-friendly error messages mapped from API errors
- [ ] Currency formatting utility for SEK

### Type Definitions

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

### Fetch Wrapper & Error Handling

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

### API Functions by Domain

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

### Currency Formatting Utility

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

### File Structure After Completion

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

### Definition of Done

- [ ] All types compile without errors
- [ ] API client functions can be imported
- [ ] `formatCurrency(1234.56)` returns `"1 234,56 kr"`
- [ ] `formatMonthYear(3, 2025)` returns `"mars 2025"` (or similar Swedish format)
- [ ] Error mapping works (manual test with mock response)
- [ ] Budget balance calculation utilities work correctly
- [ ] Month/year comparison utilities work correctly

### Additional Utility Functions

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

---

## Story 1.4: React Query Setup

**As a** developer  
**I want to** have React Query configured with reusable hooks  
**So that** I can fetch and cache data consistently across the app

### Acceptance Criteria

- [ ] QueryClient configured with sensible defaults
- [ ] QueryClientProvider wraps the app
- [ ] React Query DevTools available in development
- [ ] Query key constants defined
- [ ] Custom hooks created for each data domain

### Implementation Steps

1. **Install React Query DevTools**
   ```bash
   npm install -D @tanstack/react-query-devtools
   ```

2. **Create query keys `src/hooks/query-keys.ts`**
   ```typescript
   export const queryKeys = {
     accounts: {
       all: ['accounts'] as const,
       history: (accountId: string) => ['accounts', accountId, 'history'] as const,
     },
     recurringExpenses: {
       all: ['recurring-expenses'] as const,
     },
     budgets: {
       all: ['budgets'] as const,
       detail: (budgetId: string) => ['budgets', budgetId] as const,
       todo: (budgetId: string) => ['budgets', budgetId, 'todo'] as const,
     },
   }
   ```

3. **Create hooks for accounts `src/hooks/use-accounts.ts`**
   ```typescript
   import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
   import { queryKeys } from './query-keys'
   import {
     getAccounts,
     createAccount,
     updateAccount,
     deleteAccount,
     updateBalance,
     getBalanceHistory,
   } from '@/api'
   import type {
     CreateBankAccountRequest,
     UpdateBankAccountRequest,
     UpdateBalanceRequest,
   } from '@/api'

   export function useAccounts() {
     return useQuery({
       queryKey: queryKeys.accounts.all,
       queryFn: getAccounts,
     })
   }

   export function useBalanceHistory(accountId: string, page: number = 0) {
     return useQuery({
       queryKey: [...queryKeys.accounts.history(accountId), page],
       queryFn: () => getBalanceHistory(accountId, page),
       enabled: !!accountId,
     })
   }

   export function useCreateAccount() {
     const queryClient = useQueryClient()
     
     return useMutation({
       mutationFn: (data: CreateBankAccountRequest) => createAccount(data),
       onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: queryKeys.accounts.all })
       },
     })
   }

   export function useUpdateAccount() {
     const queryClient = useQueryClient()
     
     return useMutation({
       mutationFn: ({ id, data }: { id: string; data: UpdateBankAccountRequest }) =>
         updateAccount(id, data),
       onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: queryKeys.accounts.all })
       },
     })
   }

   export function useDeleteAccount() {
     const queryClient = useQueryClient()
     
     return useMutation({
       mutationFn: (id: string) => deleteAccount(id),
       onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: queryKeys.accounts.all })
       },
     })
   }

   export function useUpdateBalance() {
     const queryClient = useQueryClient()
     
     return useMutation({
       mutationFn: ({ id, data }: { id: string; data: UpdateBalanceRequest }) =>
         updateBalance(id, data),
       onSuccess: (_, variables) => {
         queryClient.invalidateQueries({ queryKey: queryKeys.accounts.all })
         queryClient.invalidateQueries({ queryKey: queryKeys.accounts.history(variables.id) })
       },
     })
   }
   ```

4. **Create hooks for recurring expenses `src/hooks/use-recurring-expenses.ts`**
   ```typescript
   import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
   import { queryKeys } from './query-keys'
   import {
     getRecurringExpenses,
     createRecurringExpense,
     updateRecurringExpense,
     deleteRecurringExpense,
   } from '@/api'
   import type {
     CreateRecurringExpenseRequest,
     UpdateRecurringExpenseRequest,
   } from '@/api'

   export function useRecurringExpenses() {
     return useQuery({
       queryKey: queryKeys.recurringExpenses.all,
       queryFn: getRecurringExpenses,
     })
   }

   export function useCreateRecurringExpense() {
     const queryClient = useQueryClient()
     
     return useMutation({
       mutationFn: (data: CreateRecurringExpenseRequest) => createRecurringExpense(data),
       onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: queryKeys.recurringExpenses.all })
       },
     })
   }

   export function useUpdateRecurringExpense() {
     const queryClient = useQueryClient()
     
     return useMutation({
       mutationFn: ({ id, data }: { id: string; data: UpdateRecurringExpenseRequest }) =>
         updateRecurringExpense(id, data),
       onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: queryKeys.recurringExpenses.all })
       },
     })
   }

   export function useDeleteRecurringExpense() {
     const queryClient = useQueryClient()
     
     return useMutation({
       mutationFn: (id: string) => deleteRecurringExpense(id),
       onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: queryKeys.recurringExpenses.all })
       },
     })
   }
   ```

5. **Create hooks for budgets `src/hooks/use-budgets.ts`**
   ```typescript
   import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
   import { queryKeys } from './query-keys'
   import {
     getBudgets,
     getBudget,
     createBudget,
     deleteBudget,
     lockBudget,
     unlockBudget,
     addIncome,
     updateIncome,
     deleteIncome,
     addExpense,
     updateExpense,
     deleteExpense,
     addSavings,
     updateSavings,
     deleteSavings,
   } from '@/api'
   import type {
     CreateBudgetRequest,
     CreateBudgetIncomeRequest,
     UpdateBudgetIncomeRequest,
     CreateBudgetExpenseRequest,
     UpdateBudgetExpenseRequest,
     CreateBudgetSavingsRequest,
     UpdateBudgetSavingsRequest,
   } from '@/api'

   export function useBudgets() {
     return useQuery({
       queryKey: queryKeys.budgets.all,
       queryFn: getBudgets,
     })
   }

   export function useBudget(id: string) {
     return useQuery({
       queryKey: queryKeys.budgets.detail(id),
       queryFn: () => getBudget(id),
       enabled: !!id,
     })
   }

   export function useCreateBudget() {
     const queryClient = useQueryClient()
     
     return useMutation({
       mutationFn: (data: CreateBudgetRequest) => createBudget(data),
       onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: queryKeys.budgets.all })
       },
     })
   }

   export function useDeleteBudget() {
     const queryClient = useQueryClient()
     
     return useMutation({
       mutationFn: (id: string) => deleteBudget(id),
       onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: queryKeys.budgets.all })
       },
     })
   }

   export function useLockBudget() {
     const queryClient = useQueryClient()
     
     return useMutation({
       mutationFn: (id: string) => lockBudget(id),
       onSuccess: (_, id) => {
         queryClient.invalidateQueries({ queryKey: queryKeys.budgets.all })
         queryClient.invalidateQueries({ queryKey: queryKeys.budgets.detail(id) })
         queryClient.invalidateQueries({ queryKey: queryKeys.accounts.all })
       },
     })
   }

   export function useUnlockBudget() {
     const queryClient = useQueryClient()
     
     return useMutation({
       mutationFn: (id: string) => unlockBudget(id),
       onSuccess: (_, id) => {
         queryClient.invalidateQueries({ queryKey: queryKeys.budgets.all })
         queryClient.invalidateQueries({ queryKey: queryKeys.budgets.detail(id) })
         queryClient.invalidateQueries({ queryKey: queryKeys.accounts.all })
       },
     })
   }

   // Income mutations
   export function useAddIncome(budgetId: string) {
     const queryClient = useQueryClient()
     
     return useMutation({
       mutationFn: (data: CreateBudgetIncomeRequest) => addIncome(budgetId, data),
       onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: queryKeys.budgets.detail(budgetId) })
       },
     })
   }

   export function useUpdateIncome(budgetId: string) {
     const queryClient = useQueryClient()
     
     return useMutation({
       mutationFn: ({ incomeId, data }: { incomeId: string; data: UpdateBudgetIncomeRequest }) =>
         updateIncome(budgetId, incomeId, data),
       onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: queryKeys.budgets.detail(budgetId) })
       },
     })
   }

   export function useDeleteIncome(budgetId: string) {
     const queryClient = useQueryClient()
     
     return useMutation({
       mutationFn: (incomeId: string) => deleteIncome(budgetId, incomeId),
       onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: queryKeys.budgets.detail(budgetId) })
       },
     })
   }

   // Expense mutations
   export function useAddExpense(budgetId: string) {
     const queryClient = useQueryClient()
     
     return useMutation({
       mutationFn: (data: CreateBudgetExpenseRequest) => addExpense(budgetId, data),
       onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: queryKeys.budgets.detail(budgetId) })
       },
     })
   }

   export function useUpdateExpense(budgetId: string) {
     const queryClient = useQueryClient()
     
     return useMutation({
       mutationFn: ({ expenseId, data }: { expenseId: string; data: UpdateBudgetExpenseRequest }) =>
         updateExpense(budgetId, expenseId, data),
       onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: queryKeys.budgets.detail(budgetId) })
       },
     })
   }

   export function useDeleteExpense(budgetId: string) {
     const queryClient = useQueryClient()
     
     return useMutation({
       mutationFn: (expenseId: string) => deleteExpense(budgetId, expenseId),
       onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: queryKeys.budgets.detail(budgetId) })
       },
     })
   }

   // Savings mutations
   export function useAddSavings(budgetId: string) {
     const queryClient = useQueryClient()
     
     return useMutation({
       mutationFn: (data: CreateBudgetSavingsRequest) => addSavings(budgetId, data),
       onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: queryKeys.budgets.detail(budgetId) })
       },
     })
   }

   export function useUpdateSavings(budgetId: string) {
     const queryClient = useQueryClient()
     
     return useMutation({
       mutationFn: ({ savingsId, data }: { savingsId: string; data: UpdateBudgetSavingsRequest }) =>
         updateSavings(budgetId, savingsId, data),
       onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: queryKeys.budgets.detail(budgetId) })
       },
     })
   }

   export function useDeleteSavings(budgetId: string) {
     const queryClient = useQueryClient()
     
     return useMutation({
       mutationFn: (savingsId: string) => deleteSavings(budgetId, savingsId),
       onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: queryKeys.budgets.detail(budgetId) })
       },
     })
   }
   ```

6. **Create hooks for todo `src/hooks/use-todo.ts`**
   ```typescript
   import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
   import { queryKeys } from './query-keys'
   import { getTodoList, updateTodoItem } from '@/api'
   import type { UpdateTodoItemRequest, TodoList, TodoItem } from '@/api'

   export function useTodoList(budgetId: string) {
     return useQuery({
       queryKey: queryKeys.budgets.todo(budgetId),
       queryFn: () => getTodoList(budgetId),
       enabled: !!budgetId,
     })
   }

   export function useUpdateTodoItem(budgetId: string) {
     const queryClient = useQueryClient()
     
     return useMutation({
       mutationFn: ({ itemId, data }: { itemId: string; data: UpdateTodoItemRequest }) =>
         updateTodoItem(budgetId, itemId, data),
       // Optimistic update
       onMutate: async ({ itemId, data }) => {
         await queryClient.cancelQueries({ queryKey: queryKeys.budgets.todo(budgetId) })
         
         const previousTodo = queryClient.getQueryData<TodoList>(
           queryKeys.budgets.todo(budgetId)
         )
         
         if (previousTodo) {
           queryClient.setQueryData<TodoList>(
             queryKeys.budgets.todo(budgetId),
             {
               ...previousTodo,
               items: previousTodo.items.map((item) =>
                 item.id === itemId
                   ? { ...item, status: data.status, completedAt: data.status === 'COMPLETED' ? new Date().toISOString() : null }
                   : item
               ),
             }
           )
         }
         
         return { previousTodo }
       },
       onError: (err, variables, context) => {
         if (context?.previousTodo) {
           queryClient.setQueryData(
             queryKeys.budgets.todo(budgetId),
             context.previousTodo
           )
         }
       },
       onSettled: () => {
         queryClient.invalidateQueries({ queryKey: queryKeys.budgets.todo(budgetId) })
       },
     })
   }
   ```

7. **Create hooks barrel export `src/hooks/index.ts`**
   ```typescript
   export * from './query-keys'
   export * from './use-accounts'
   export * from './use-recurring-expenses'
   export * from './use-budgets'
   export * from './use-todo'
   ```

8. **Update `src/App.tsx`** to include QueryClientProvider
   ```typescript
   import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
   import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
   import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
   import { ROUTES } from './routes'
   import {
     AccountsPage,
     RecurringExpensesPage,
     BudgetsPage,
     BudgetWizardPage,
     BudgetDetailPage,
     TodoListPage,
     NotFoundPage,
   } from './pages'

   const queryClient = new QueryClient({
     defaultOptions: {
       queries: {
         staleTime: 1000 * 60, // 1 minute
         refetchOnWindowFocus: true,
         retry: 1,
       },
     },
   })

   function App() {
     return (
       <QueryClientProvider client={queryClient}>
         <BrowserRouter>
           <Routes>
             <Route path={ROUTES.HOME} element={<Navigate to={ROUTES.BUDGETS} replace />} />
             <Route path={ROUTES.ACCOUNTS} element={<AccountsPage />} />
             <Route path={ROUTES.RECURRING_EXPENSES} element={<RecurringExpensesPage />} />
             <Route path={ROUTES.BUDGETS} element={<BudgetsPage />} />
             <Route path={ROUTES.BUDGET_NEW} element={<BudgetWizardPage />} />
             <Route path={ROUTES.BUDGET_DETAIL} element={<BudgetDetailPage />} />
             <Route path={ROUTES.BUDGET_TODO} element={<TodoListPage />} />
             <Route path="*" element={<NotFoundPage />} />
           </Routes>
         </BrowserRouter>
         <ReactQueryDevtools initialIsOpen={false} />
       </QueryClientProvider>
     )
   }

   export default App
   ```

### File Structure After Completion

```
src/
├── hooks/
│   ├── index.ts
│   ├── query-keys.ts
│   ├── use-accounts.ts
│   ├── use-budgets.ts
│   ├── use-recurring-expenses.ts
│   └── use-todo.ts
└── App.tsx (updated)
```

### Definition of Done

- [ ] React Query DevTools visible in browser (bottom-right icon)
- [ ] Hooks can be imported from `@/hooks`
- [ ] No TypeScript errors
- [ ] `useAccounts()` hook works (will show loading state until backend is available)

---

## Story 1.5: Layout Shell

**As a** user  
**I want to** see consistent navigation across all pages  
**So that** I can easily move between different sections of the app

### Acceptance Criteria

- [ ] Sidebar navigation visible on desktop (≥1024px)
- [ ] Hamburger menu on mobile/tablet (<1024px)
- [ ] Active nav item highlighted
- [ ] Navigation links work for all main sections
- [ ] Page content area scrolls independently
- [ ] Clean, Apple-inspired aesthetic

### Navigation Items

| Label | Path | Icon (optional) |
|-------|------|-----------------|
| Budgets | `/budgets` | 📊 or similar |
| Accounts | `/accounts` | 🏦 or similar |
| Recurring | `/recurring-expenses` | 🔄 or similar |

### Implementation Steps

1. **Install lucide-react for icons**
   ```bash
   npm install lucide-react
   ```

2. **Create sidebar component `src/components/layout/Sidebar.tsx`**
   ```typescript
   import { NavLink } from 'react-router-dom'
   import { LayoutDashboard, Wallet, RefreshCw, X } from 'lucide-react'
   import { cn } from '@/lib/utils'
   import { ROUTES } from '@/routes'

   const navItems = [
     { label: 'Budgets', path: ROUTES.BUDGETS, icon: LayoutDashboard },
     { label: 'Accounts', path: ROUTES.ACCOUNTS, icon: Wallet },
     { label: 'Recurring', path: ROUTES.RECURRING_EXPENSES, icon: RefreshCw },
   ]

   interface SidebarProps {
     open: boolean
     onClose: () => void
   }

   export function Sidebar({ open, onClose }: SidebarProps) {
     return (
       <>
         {/* Mobile overlay */}
         {open && (
           <div
             className="fixed inset-0 bg-black/50 z-40 lg:hidden"
             onClick={onClose}
           />
         )}

         {/* Sidebar */}
         <aside
           className={cn(
             'fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-200 z-50',
             'transform transition-transform duration-200 ease-in-out',
             'lg:translate-x-0 lg:static lg:z-auto',
             open ? 'translate-x-0' : '-translate-x-full'
           )}
         >
           {/* Header */}
           <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
             <h1 className="text-xl font-semibold text-gray-900">Balance</h1>
             <button
               onClick={onClose}
               className="p-2 rounded-md hover:bg-gray-100 lg:hidden"
             >
               <X className="w-5 h-5" />
             </button>
           </div>

           {/* Navigation */}
           <nav className="p-4 space-y-1">
             {navItems.map((item) => (
               <NavLink
                 key={item.path}
                 to={item.path}
                 onClick={onClose}
                 className={({ isActive }) =>
                   cn(
                     'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium',
                     'transition-colors duration-150',
                     isActive
                       ? 'bg-blue-50 text-blue-700'
                       : 'text-gray-700 hover:bg-gray-100'
                   )
                 }
               >
                 <item.icon className="w-5 h-5" />
                 {item.label}
               </NavLink>
             ))}
           </nav>
         </aside>
       </>
     )
   }
   ```

3. **Create header component `src/components/layout/Header.tsx`**
   ```typescript
   import { Menu } from 'lucide-react'

   interface HeaderProps {
     onMenuClick: () => void
   }

   export function Header({ onMenuClick }: HeaderProps) {
     return (
       <header className="sticky top-0 h-16 bg-white border-b border-gray-200 lg:hidden">
         <div className="flex items-center h-full px-4">
           <button
             onClick={onMenuClick}
             className="p-2 -ml-2 rounded-md hover:bg-gray-100"
           >
             <Menu className="w-6 h-6" />
           </button>
           <h1 className="ml-3 text-lg font-semibold text-gray-900">Balance</h1>
         </div>
       </header>
     )
   }
   ```

4. **Create main layout component `src/components/layout/AppLayout.tsx`**
   ```typescript
   import { useState } from 'react'
   import { Outlet } from 'react-router-dom'
   import { Sidebar } from './Sidebar'
   import { Header } from './Header'

   export function AppLayout() {
     const [sidebarOpen, setSidebarOpen] = useState(false)

     return (
       <div className="min-h-screen bg-gray-50">
         <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
         
         <div className="lg:pl-64">
           <Header onMenuClick={() => setSidebarOpen(true)} />
           
           <main className="p-4 md:p-6 lg:p-8">
             <Outlet />
           </main>
         </div>
       </div>
     )
   }
   ```

5. **Create layout barrel export `src/components/layout/index.ts`**
   ```typescript
   export { AppLayout } from './AppLayout'
   export { Sidebar } from './Sidebar'
   export { Header } from './Header'
   ```

6. **Update `src/App.tsx`** to use layout with nested routes
   ```typescript
   import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
   import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
   import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
   import { ROUTES } from './routes'
   import { AppLayout } from './components/layout'
   import {
     AccountsPage,
     RecurringExpensesPage,
     BudgetsPage,
     BudgetWizardPage,
     BudgetDetailPage,
     TodoListPage,
     NotFoundPage,
   } from './pages'

   const queryClient = new QueryClient({
     defaultOptions: {
       queries: {
         staleTime: 1000 * 60,
         refetchOnWindowFocus: true,
         retry: 1,
       },
     },
   })

   function App() {
     return (
       <QueryClientProvider client={queryClient}>
         <BrowserRouter>
           <Routes>
             <Route element={<AppLayout />}>
               <Route path={ROUTES.HOME} element={<Navigate to={ROUTES.BUDGETS} replace />} />
               <Route path={ROUTES.ACCOUNTS} element={<AccountsPage />} />
               <Route path={ROUTES.RECURRING_EXPENSES} element={<RecurringExpensesPage />} />
               <Route path={ROUTES.BUDGETS} element={<BudgetsPage />} />
               <Route path={ROUTES.BUDGET_NEW} element={<BudgetWizardPage />} />
               <Route path={ROUTES.BUDGET_DETAIL} element={<BudgetDetailPage />} />
               <Route path={ROUTES.BUDGET_TODO} element={<TodoListPage />} />
             </Route>
             <Route path="*" element={<NotFoundPage />} />
           </Routes>
         </BrowserRouter>
         <ReactQueryDevtools initialIsOpen={false} />
       </QueryClientProvider>
     )
   }

   export default App
   ```

### File Structure After Completion

```
src/
├── components/
│   └── layout/
│       ├── AppLayout.tsx
│       ├── Header.tsx
│       ├── index.ts
│       └── Sidebar.tsx
└── App.tsx (updated)
```

### Definition of Done

- [ ] Desktop: Sidebar always visible on left
- [ ] Mobile: Hamburger menu opens/closes sidebar
- [ ] Clicking nav item navigates to correct page
- [ ] Active nav item is visually highlighted
- [ ] Clicking outside sidebar on mobile closes it
- [ ] Page content displays in main area
- [ ] iOS safe areas handled properly
- [ ] Mobile modals work correctly (full-screen or bottom sheet)

### Mobile Navigation Implementation

**Breakpoints:**
- Mobile: < 768px (md)
- Tablet: 768px - 1023px
- Desktop: ≥ 1024px (lg)

**Create `src/components/layout/MobileHeader.tsx`:**

```typescript
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'

interface MobileHeaderProps {
  onMenuClick: () => void
}

export function MobileHeader({ onMenuClick }: MobileHeaderProps) {
  return (
    <header className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-white border-b border-gray-200 z-40">
      <div className="flex items-center justify-between h-full px-4">
        <Button variant="ghost" size="icon" onClick={onMenuClick} aria-label="Öppna meny">
          <Menu className="w-6 h-6" />
        </Button>
        <Link to="/budgets" className="font-semibold text-lg">Balance</Link>
        <div className="w-10" /> {/* Spacer to center title */}
      </div>
    </header>
  )
}
```

**Create `src/components/layout/MobileSidebar.tsx`:**

```typescript
import { BarChart3, CreditCard, Repeat } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

interface MobileSidebarProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const navItems = [
  { path: '/budgets', label: 'Budgetar', icon: BarChart3 },
  { path: '/accounts', label: 'Konton', icon: CreditCard },
  { path: '/recurring-expenses', label: 'Återkommande utgifter', icon: Repeat },
]

export function MobileSidebar({ open, onOpenChange }: MobileSidebarProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-72 p-0">
        <SheetHeader className="p-4 border-b">
          <SheetTitle className="text-left">Balance</SheetTitle>
        </SheetHeader>
        <nav className="p-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => onOpenChange(false)} // Close on navigation
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-semibold'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                )
              }
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  )
}
```

**Update `src/components/layout/AppLayout.tsx`:**

```typescript
import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { MobileHeader } from './MobileHeader'
import { MobileSidebar } from './MobileSidebar'

export function AppLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Mobile Header */}
      <MobileHeader onMenuClick={() => setIsMobileMenuOpen(true)} />

      {/* Mobile Sidebar Drawer */}
      <MobileSidebar open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen} />

      {/* Main Content */}
      <main className="lg:ml-64 pt-14 lg:pt-0">
        <div className="p-4 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
```

**iOS Safe Areas (add to `src/index.css`):**

```css
@supports (padding-top: env(safe-area-inset-top)) {
  .mobile-header {
    padding-top: env(safe-area-inset-top);
    height: calc(3.5rem + env(safe-area-inset-top));
  }

  .mobile-sidebar {
    padding-bottom: env(safe-area-inset-bottom);
  }

  .mobile-content {
    padding-bottom: env(safe-area-inset-bottom);
  }
}
```

**Mobile Modal Behavior:**

```typescript
// Modals on mobile should be full-screen or bottom sheet
<DialogContent className="w-full max-w-lg sm:max-w-lg max-h-screen sm:max-h-[90vh] sm:rounded-lg">
```

---

## Story 1.6: Shared UI Components

**As a** developer  
**I want to** have reusable UI components  
**So that** I can build consistent interfaces quickly

### Acceptance Criteria

- [ ] shadcn/ui initialized and configured
- [ ] Core shadcn components installed (Button, Dialog, Sheet, Input, Select, etc.)
- [ ] Custom app components created: PageHeader, LoadingState, ErrorState, EmptyState, ConfirmDialog
- [ ] Sonner toast library configured

### Implementation Steps

1. **Initialize shadcn/ui**
   ```bash
   npx shadcn@latest init
   ```
   
   When prompted, select:
   - Style: Default
   - Base color: Slate
   - CSS variables: Yes

2. **Install required shadcn components**
   ```bash
   npx shadcn@latest add button
   npx shadcn@latest add dialog
   npx shadcn@latest add sheet
   npx shadcn@latest add input
   npx shadcn@latest add label
   npx shadcn@latest add select
   npx shadcn@latest add checkbox
   npx shadcn@latest add card
   npx shadcn@latest add accordion
   npx shadcn@latest add skeleton
   npx shadcn@latest add table
   npx shadcn@latest add badge
   npx shadcn@latest add sonner
   ```

3. **Create PageHeader component `src/components/shared/PageHeader.tsx`**
   ```typescript
   import { ReactNode } from 'react'

   interface PageHeaderProps {
     title: string
     description?: string
     action?: ReactNode
   }

   export function PageHeader({ title, description, action }: PageHeaderProps) {
     return (
       <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between mb-6">
         <div>
           <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
           {description && (
             <p className="text-sm text-gray-500 mt-1">{description}</p>
           )}
         </div>
         {action && <div className="mt-4 sm:mt-0">{action}</div>}
       </div>
     )
   }
   ```

4. **Create LoadingState component `src/components/shared/LoadingState.tsx`**
   ```typescript
   import { Skeleton } from '@/components/ui/skeleton'

   interface LoadingStateProps {
     /** Number of skeleton rows to show */
     rows?: number
     /** Type of loading state */
     variant?: 'table' | 'cards' | 'detail'
   }

   export function LoadingState({ rows = 3, variant = 'table' }: LoadingStateProps) {
     if (variant === 'cards') {
       return (
         <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
           {Array.from({ length: rows }).map((_, i) => (
             <div key={i} className="p-4 bg-white rounded-lg border border-gray-200">
               <Skeleton className="h-5 w-24 mb-2" />
               <Skeleton className="h-4 w-16 mb-4" />
               <Skeleton className="h-4 w-32" />
               <Skeleton className="h-4 w-28 mt-1" />
               <Skeleton className="h-4 w-24 mt-1" />
             </div>
           ))}
         </div>
       )
     }

     if (variant === 'detail') {
       return (
         <div className="space-y-6">
           <Skeleton className="h-8 w-48" />
           <div className="space-y-4">
             {Array.from({ length: rows }).map((_, i) => (
               <div key={i} className="p-4 bg-white rounded-lg border border-gray-200">
                 <Skeleton className="h-5 w-32 mb-3" />
                 <Skeleton className="h-4 w-full" />
                 <Skeleton className="h-4 w-3/4 mt-2" />
               </div>
             ))}
           </div>
         </div>
       )
     }

     // Default: table variant
     return (
       <div className="bg-white rounded-lg border border-gray-200">
         <div className="p-4 border-b border-gray-200">
           <Skeleton className="h-5 w-32" />
         </div>
         {Array.from({ length: rows }).map((_, i) => (
           <div key={i} className="flex items-center gap-4 p-4 border-b border-gray-100 last:border-b-0">
             <Skeleton className="h-4 w-24" />
             <Skeleton className="h-4 w-32" />
             <Skeleton className="h-4 w-20 ml-auto" />
           </div>
         ))}
       </div>
     )
   }
   ```

5. **Create ErrorState component `src/components/shared/ErrorState.tsx`**
   ```typescript
   import { AlertCircle } from 'lucide-react'
   import { Button } from '@/components/ui/button'

   interface ErrorStateProps {
     title?: string
     message?: string
     onRetry?: () => void
   }

   export function ErrorState({
     title = 'Something went wrong',
     message = 'An error occurred while loading. Please try again.',
     onRetry,
   }: ErrorStateProps) {
     return (
       <div className="flex flex-col items-center justify-center py-12 text-center">
         <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
         <h2 className="text-lg font-semibold text-gray-900 mb-1">{title}</h2>
         <p className="text-sm text-gray-500 mb-4 max-w-sm">{message}</p>
         {onRetry && (
           <Button onClick={onRetry} variant="outline">
             Try again
           </Button>
         )}
       </div>
     )
   }
   ```

6. **Create EmptyState component `src/components/shared/EmptyState.tsx`**
   ```typescript
   import { ReactNode } from 'react'
   import { Inbox } from 'lucide-react'

   interface EmptyStateProps {
     icon?: ReactNode
     title: string
     description: string
     action?: ReactNode
   }

   export function EmptyState({
     icon,
     title,
     description,
     action,
   }: EmptyStateProps) {
     return (
       <div className="flex flex-col items-center justify-center py-12 text-center">
         <div className="mb-4 text-gray-400">
           {icon || <Inbox className="w-12 h-12" />}
         </div>
         <h2 className="text-lg font-semibold text-gray-900 mb-1">{title}</h2>
         <p className="text-sm text-gray-500 mb-4 max-w-sm">{description}</p>
         {action}
       </div>
     )
   }
   ```

7. **Create ConfirmDialog component `src/components/shared/ConfirmDialog.tsx`**
   ```typescript
   import {
     AlertDialog,
     AlertDialogAction,
     AlertDialogCancel,
     AlertDialogContent,
     AlertDialogDescription,
     AlertDialogFooter,
     AlertDialogHeader,
     AlertDialogTitle,
   } from '@/components/ui/alert-dialog'

   interface ConfirmDialogProps {
     open: boolean
     onOpenChange: (open: boolean) => void
     title: string
     description: string
     confirmLabel?: string
     cancelLabel?: string
     variant?: 'default' | 'destructive'
     onConfirm: () => void
     loading?: boolean
   }

   export function ConfirmDialog({
     open,
     onOpenChange,
     title,
     description,
     confirmLabel = 'Confirm',
     cancelLabel = 'Cancel',
     variant = 'default',
     onConfirm,
     loading = false,
   }: ConfirmDialogProps) {
     return (
       <AlertDialog open={open} onOpenChange={onOpenChange}>
         <AlertDialogContent>
           <AlertDialogHeader>
             <AlertDialogTitle>{title}</AlertDialogTitle>
             <AlertDialogDescription>{description}</AlertDialogDescription>
           </AlertDialogHeader>
           <AlertDialogFooter>
             <AlertDialogCancel disabled={loading}>{cancelLabel}</AlertDialogCancel>
             <AlertDialogAction
               onClick={onConfirm}
               disabled={loading}
               className={variant === 'destructive' ? 'bg-red-600 hover:bg-red-700' : ''}
             >
               {loading ? 'Loading...' : confirmLabel}
             </AlertDialogAction>
           </AlertDialogFooter>
         </AlertDialogContent>
       </AlertDialog>
     )
   }
   ```

   Note: Also need to install alert-dialog:
   ```bash
   npx shadcn@latest add alert-dialog
   ```

8. **Create shared components barrel export `src/components/shared/index.ts`**
   ```typescript
   export { PageHeader } from './PageHeader'
   export { LoadingState } from './LoadingState'
   export { ErrorState } from './ErrorState'
   export { EmptyState } from './EmptyState'
   export { ConfirmDialog } from './ConfirmDialog'
   ```

9. **Add Toaster to App.tsx**
   ```typescript
   import { Toaster } from '@/components/ui/sonner'
   
   // Inside App component, after Routes:
   <Toaster position="top-right" />
   ```

### File Structure After Completion

```
src/
├── components/
│   ├── layout/
│   │   └── ...
│   ├── shared/
│   │   ├── ConfirmDialog.tsx
│   │   ├── EmptyState.tsx
│   │   ├── ErrorState.tsx
│   │   ├── index.ts
│   │   ├── LoadingState.tsx
│   │   └── PageHeader.tsx
│   └── ui/
│       ├── accordion.tsx
│       ├── alert-dialog.tsx
│       ├── badge.tsx
│       ├── button.tsx
│       ├── card.tsx
│       ├── checkbox.tsx
│       ├── dialog.tsx
│       ├── input.tsx
│       ├── label.tsx
│       ├── select.tsx
│       ├── sheet.tsx
│       ├── skeleton.tsx
│       ├── sonner.tsx
│       └── table.tsx
└── App.tsx (updated with Toaster)
```

### Definition of Done

- [ ] All shadcn components installed without errors
- [ ] PageHeader renders title and optional action button
- [ ] LoadingState shows skeleton UI
- [ ] ErrorState shows error message with retry button
- [ ] EmptyState shows message with CTA
- [ ] ConfirmDialog opens and closes properly
- [ ] Toast notifications work (`toast.success('Test')` shows toast)

---

## Epic 1 Complete File Structure

After completing all stories, the project structure should be:

```
balance-frontend/
├── src/
│   ├── api/
│   │   ├── accounts.ts
│   │   ├── budgets.ts
│   │   ├── client.ts
│   │   ├── index.ts
│   │   ├── recurring-expenses.ts
│   │   ├── todo.ts
│   │   └── types.ts
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppLayout.tsx
│   │   │   ├── Header.tsx
│   │   │   ├── index.ts
│   │   │   └── Sidebar.tsx
│   │   ├── shared/
│   │   │   ├── ConfirmDialog.tsx
│   │   │   ├── EmptyState.tsx
│   │   │   ├── ErrorState.tsx
│   │   │   ├── index.ts
│   │   │   ├── LoadingState.tsx
│   │   │   └── PageHeader.tsx
│   │   └── ui/
│   │       └── (shadcn components)
│   ├── hooks/
│   │   ├── index.ts
│   │   ├── query-keys.ts
│   │   ├── use-accounts.ts
│   │   ├── use-budgets.ts
│   │   ├── use-recurring-expenses.ts
│   │   └── use-todo.ts
│   ├── lib/
│   │   └── utils.ts
│   ├── pages/
│   │   ├── AccountsPage.tsx
│   │   ├── BudgetDetailPage.tsx
│   │   ├── BudgetsPage.tsx
│   │   ├── BudgetWizardPage.tsx
│   │   ├── index.ts
│   │   ├── NotFoundPage.tsx
│   │   ├── RecurringExpensesPage.tsx
│   │   └── TodoListPage.tsx
│   ├── App.tsx
│   ├── index.css
│   ├── main.tsx
│   └── routes.ts
├── components.json (shadcn config)
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

---

## Next Steps

After completing Epic 1:

1. Test that all routes work
2. Verify hooks compile (won't return data until backend is available)
3. Test toast notifications
4. Test responsive layout (sidebar behavior)
5. Proceed to Epic 2: Accounts

---

*Last updated: December 2024*
