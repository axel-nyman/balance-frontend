# Story 1.4: React Query Setup

**As a** developer
**I want to** have React Query configured with reusable hooks
**So that** I can fetch and cache data consistently across the app

## Acceptance Criteria

- [x] QueryClient configured with sensible defaults
- [x] QueryClientProvider wraps the app
- [x] React Query DevTools available in development
- [x] Query key constants defined
- [x] Custom hooks created for each data domain

## Implementation Steps

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

## File Structure After Completion

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

## Definition of Done

- [ ] React Query DevTools visible in browser (bottom-right icon)
- [x] Hooks can be imported from `@/hooks`
- [x] No TypeScript errors
- [ ] `useAccounts()` hook works (will show loading state until backend is available)
