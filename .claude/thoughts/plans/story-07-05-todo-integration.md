# Story 7.5: Optimistic Updates for Todo Toggle

**As a** user  
**I want to** see immediate feedback when toggling todo items  
**So that** the interface feels responsive

### Acceptance Criteria

- [x] Checkbox state updates immediately on click
- [x] Progress bar updates immediately
- [x] If API fails, state reverts
- [x] Error toast shown on failure

### Implementation

Update the React Query hook to use optimistic updates. This is already implemented in the hooks from Epic 1.

**Update `src/hooks/use-todo.ts`:**

```typescript
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getTodoList, updateTodoItem } from '@/api/todo'
import { queryKeys } from './query-keys'
import type { TodoList, TodoItem } from '@/api/types'

export function useBudgetTodo(budgetId: string) {
  return useQuery({
    queryKey: queryKeys.budgetTodo(budgetId),
    queryFn: () => getTodoList(budgetId),
    enabled: !!budgetId,
  })
}

export function useUpdateTodoItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      budgetId,
      itemId,
      data,
    }: {
      budgetId: string
      itemId: string
      data: { status: 'PENDING' | 'COMPLETED' }
    }) => updateTodoItem(budgetId, itemId, data),

    // Optimistic update
    onMutate: async ({ budgetId, itemId, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.budgetTodo(budgetId) })

      // Snapshot previous value
      const previousTodo = queryClient.getQueryData<TodoList>(queryKeys.budgetTodo(budgetId))

      // Optimistically update
      if (previousTodo) {
        queryClient.setQueryData<TodoList>(queryKeys.budgetTodo(budgetId), {
          ...previousTodo,
          items: previousTodo.items.map((item) =>
            item.id === itemId ? { ...item, status: data.status } : item
          ),
        })
      }

      return { previousTodo }
    },

    // Revert on error
    onError: (err, { budgetId }, context) => {
      if (context?.previousTodo) {
        queryClient.setQueryData(queryKeys.budgetTodo(budgetId), context.previousTodo)
      }
    },

    // Refetch after success or error
    onSettled: (data, error, { budgetId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.budgetTodo(budgetId) })
    },
  })
}
```

### Test File: `src/hooks/use-todo.test.tsx`

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useBudgetTodo, useUpdateTodoItem } from './use-todo'
import { server } from '@/test/mocks/server'
import { http, HttpResponse } from 'msw'
import type { ReactNode } from 'react'

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    )
  }
}

describe('useBudgetTodo', () => {
  const mockTodoItem = {
    id: 'todo-1',
    type: 'PAYMENT',
    name: 'Pay Rent',
    amount: 8000,
    status: 'PENDING',
    fromAccount: { id: 'acc-main', name: 'Main Account' },
    toAccount: null,
    completedAt: null,
    createdAt: '2025-03-01T00:00:00Z',
  }

  beforeEach(() => {
    server.use(
      http.get('/api/budgets/123/todo-list', () => {
        return HttpResponse.json({
          id: 'todolist-1',
          budgetId: '123',
          createdAt: '2025-03-01T00:00:00Z',
          items: [mockTodoItem],
          summary: { totalItems: 1, pendingItems: 1, completedItems: 0 },
        })
      })
    )
  })

  it('fetches todo list', async () => {
    const { result } = renderHook(() => useBudgetTodo('123'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data?.items).toHaveLength(1)
    expect(result.current.data?.items[0].name).toBe('Pay Rent')
  })
})

describe('useUpdateTodoItem', () => {
  const mockTodoItem = {
    id: 'todo-1',
    type: 'PAYMENT',
    name: 'Pay Rent',
    amount: 8000,
    status: 'PENDING',
    fromAccount: { id: 'acc-main', name: 'Main Account' },
    toAccount: null,
    completedAt: null,
    createdAt: '2025-03-01T00:00:00Z',
  }

  beforeEach(() => {
    server.use(
      http.get('/api/budgets/123/todo-list', () => {
        return HttpResponse.json({
          id: 'todolist-1',
          budgetId: '123',
          createdAt: '2025-03-01T00:00:00Z',
          items: [mockTodoItem],
          summary: { totalItems: 1, pendingItems: 1, completedItems: 0 },
        })
      }),
      http.put('/api/budgets/123/todo-list/items/todo-1', () => {
        return HttpResponse.json({ ...mockTodoItem, status: 'COMPLETED', completedAt: '2025-03-15T10:30:00Z' })
      })
    )
  })

  it('updates todo item optimistically', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })

    // Pre-populate the cache
    queryClient.setQueryData(['budgets', '123', 'todo'], {
      id: 'todolist-1',
      budgetId: '123',
      createdAt: '2025-03-01T00:00:00Z',
      items: [mockTodoItem],
      summary: { totalItems: 1, pendingItems: 1, completedItems: 0 },
    })

    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    )

    const { result } = renderHook(() => useUpdateTodoItem(), { wrapper })

    result.current.mutate({
      budgetId: '123',
      itemId: 'todo-1',
      data: { status: 'COMPLETED' },
    })

    // Check optimistic update happened
    await waitFor(() => {
      const cachedData = queryClient.getQueryData(['budgets', '123', 'todo']) as { items: Array<{ status: string }> }
      expect(cachedData.items[0].status).toBe('COMPLETED')
    })
  })

  it('reverts on error', async () => {
    server.use(
      http.put('/api/budgets/123/todo-list/items/todo-1', () => {
        return HttpResponse.json({ error: 'Failed' }, { status: 500 })
      })
    )

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })

    // Pre-populate the cache
    queryClient.setQueryData(['budgets', '123', 'todo'], {
      id: 'todolist-1',
      budgetId: '123',
      createdAt: '2025-03-01T00:00:00Z',
      items: [mockTodoItem],
      summary: { totalItems: 1, pendingItems: 1, completedItems: 0 },
    })

    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    )

    const { result } = renderHook(() => useUpdateTodoItem(), { wrapper })

    result.current.mutate({
      budgetId: '123',
      itemId: 'todo-1',
      data: { status: 'COMPLETED' },
    })

    // Wait for error and revert
    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    // Check it reverted
    await waitFor(() => {
      const cachedData = queryClient.getQueryData(['budgets', '123', 'todo']) as { items: Array<{ status: string }> }
      expect(cachedData.items[0].status).toBe('PENDING')
    })
  })
})
```

### Definition of Done

- [x] Tests pass
- [x] Checkbox updates immediately
- [x] Progress updates immediately
- [x] Error reverts the update

---

## Epic 7 Complete File Structure

```
src/
├── api/
│   └── todo.ts
├── components/
│   └── todo/
│       ├── index.ts
│       ├── TodoItemList.tsx
│       ├── TodoItemRow.tsx
│       ├── TodoProgress.tsx
│       └── UpdateBalanceModal.tsx
├── hooks/
│   └── use-todo.ts
└── pages/
    └── TodoListPage.tsx
```

**Create API file `src/api/todo.ts`:**

```typescript
import { apiGet, apiPut } from './client'
import type { TodoList, TodoItem, UpdateTodoItemRequest } from './types'

export async function getTodoList(budgetId: string): Promise<TodoList> {
  return apiGet<TodoList>(`/budgets/${budgetId}/todo-list`)
}

export async function updateTodoItem(
  budgetId: string,
  itemId: string,
  data: UpdateTodoItemRequest
): Promise<TodoItem> {
  return apiPut<TodoItem>(
    `/budgets/${budgetId}/todo-list/items/${itemId}`,
    data
  )
}
```

**Note:** The TodoItem and TodoList types are already defined in Epic 1 (`src/api/types.ts`). Epic 7 uses these existing types:

```typescript
// Already defined in Epic 1 - DO NOT DUPLICATE

export type TodoItemType = 'TRANSFER' | 'PAYMENT'
export type TodoItemStatus = 'PENDING' | 'COMPLETED'

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
```

**Create barrel export `src/components/todo/index.ts`:**

```typescript
export { TodoProgress } from './TodoProgress'
export { TodoItemList } from './TodoItemList'
export { TodoItemRow } from './TodoItemRow'
export { UpdateBalanceModal } from './UpdateBalanceModal'
```

**Update query keys `src/hooks/query-keys.ts`:**

```typescript
export const queryKeys = {
  // ... existing keys
  budgetTodo: (budgetId: string) => ['budgets', budgetId, 'todo'] as const,
}
```

---

## Test Summary

| Component | Test File | Tests (approx) |
|-----------|-----------|----------------|
| TodoListPage | TodoListPage.test.tsx | 6 |
| TodoProgress | TodoProgress.test.tsx | 6 |
| TodoItemList | TodoItemList.test.tsx | 6 |
| TodoItemRow | TodoItemRow.test.tsx | 11 |
| UpdateBalanceModal | UpdateBalanceModal.test.tsx | 7 |
| use-todo hooks | use-todo.test.tsx | 3 |

**Total: ~39 tests for Epic 7**

---

## MSW Handlers Update

Add these handlers to `src/test/mocks/handlers.ts`:

```typescript
// Get todo list
http.get('/api/budgets/:id/todo-list', ({ params }) => {
  return HttpResponse.json({
    id: 'todolist-1',
    budgetId: params.id,
    createdAt: '2025-03-01T00:00:00Z',
    items: [
      {
        id: 'todo-1',
        type: 'PAYMENT',
        name: 'Pay Rent',
        amount: 8000,
        status: 'PENDING',
        fromAccount: { id: 'acc-main', name: 'Main Account' },
        toAccount: null,
        completedAt: null,
        createdAt: '2025-03-01T00:00:00Z',
      },
      {
        id: 'todo-2',
        type: 'TRANSFER',
        name: 'Transfer to Savings',
        amount: 5000,
        status: 'COMPLETED',
        fromAccount: { id: 'acc-main', name: 'Main Account' },
        toAccount: { id: 'acc-savings', name: 'Savings Account' },
        completedAt: '2025-03-15T10:30:00Z',
        createdAt: '2025-03-01T00:00:00Z',
      },
    ],
    summary: {
      totalItems: 2,
      pendingItems: 1,
      completedItems: 1,
    },
  })
}),

// Update todo item
http.put('/api/budgets/:budgetId/todo-list/items/:itemId', async ({ request, params }) => {
  const body = await request.json() as { status: string }
  return HttpResponse.json({
    id: params.itemId,
    type: 'PAYMENT',
    name: 'Pay Rent',
    amount: 8000,
    status: body.status,
    fromAccount: { id: 'acc-main', name: 'Main Account' },
    toAccount: null,
    completedAt: body.status === 'COMPLETED' ? new Date().toISOString() : null,
    createdAt: '2025-03-01T00:00:00Z',
  })
}),
```

---

## Final Progress Summary

| Epic | Stories | Tests |
|------|---------|-------|
| Epic 1: Infrastructure | 6 | ~50 |
| Epic 2: Accounts | 7 | ~46 |
| Epic 3: Recurring Expenses | 5 | ~42 |
| Epic 4: Budget List | 3 | ~24 |
| Epic 5: Budget Wizard | 7 | ~83 |
| Epic 6: Budget Detail | 9 | ~58 |
| **Epic 7: Todo List** | **5** | **~39** |
| **TOTAL** | **42** | **~342** |

---

## Complete Frontend Architecture

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
├── components/
│   ├── accounts/
│   │   ├── AccountCard.tsx
│   │   ├── AccountRow.tsx
│   │   ├── AccountsList.tsx
│   │   ├── AccountsSummary.tsx
│   │   ├── BalanceHistoryDrawer.tsx
│   │   ├── CreateAccountModal.tsx
│   │   ├── DeleteAccountDialog.tsx
│   │   ├── EditAccountModal.tsx
│   │   ├── UpdateBalanceModal.tsx
│   │   ├── schemas.ts
│   │   └── index.ts
│   ├── budget-detail/
│   │   ├── BudgetActions.tsx
│   │   ├── BudgetSection.tsx
│   │   ├── BudgetSummary.tsx
│   │   ├── DeleteItemDialog.tsx
│   │   ├── ExpenseItemModal.tsx
│   │   ├── IncomeItemModal.tsx
│   │   ├── SavingsItemModal.tsx
│   │   ├── schemas.ts
│   │   └── index.ts
│   ├── budgets/
│   │   ├── BudgetCard.tsx
│   │   ├── BudgetGrid.tsx
│   │   └── index.ts
│   ├── layout/
│   │   ├── AppLayout.tsx
│   │   ├── Header.tsx
│   │   └── Sidebar.tsx
│   ├── recurring-expenses/
│   │   ├── CreateRecurringExpenseModal.tsx
│   │   ├── DeleteRecurringExpenseDialog.tsx
│   │   ├── DueStatusIndicator.tsx
│   │   ├── EditRecurringExpenseModal.tsx
│   │   ├── RecurringExpenseCard.tsx
│   │   ├── RecurringExpenseRow.tsx
│   │   ├── RecurringExpensesList.tsx
│   │   ├── schemas.ts
│   │   └── index.ts
│   ├── shared/
│   │   ├── ConfirmDialog.tsx
│   │   ├── EmptyState.tsx
│   │   ├── ErrorState.tsx
│   │   ├── LoadingState.tsx
│   │   ├── PageHeader.tsx
│   │   └── index.ts
│   ├── todo/
│   │   ├── TodoItemList.tsx
│   │   ├── TodoItemRow.tsx
│   │   ├── TodoProgress.tsx
│   │   ├── UpdateBalanceModal.tsx
│   │   └── index.ts
│   ├── ui/ (shadcn components)
│   │   └── ...
│   └── wizard/
│       ├── WizardContext.tsx
│       ├── WizardNavigation.tsx
│       ├── WizardShell.tsx
│       ├── StepIndicator.tsx
│       ├── types.ts
│       ├── wizardReducer.ts
│       ├── steps/
│       │   ├── StepMonthYear.tsx
│       │   ├── StepIncome.tsx
│       │   ├── StepExpenses.tsx
│       │   ├── StepSavings.tsx
│       │   └── StepReview.tsx
│       └── index.ts
├── hooks/
│   ├── query-keys.ts
│   ├── use-accounts.ts
│   ├── use-budgets.ts
│   ├── use-recurring-expenses.ts
│   └── use-todo.ts
├── lib/
│   └── utils.ts
├── pages/
│   ├── AccountsPage.tsx
│   ├── BudgetDetailPage.tsx
│   ├── BudgetsPage.tsx
│   ├── BudgetWizardPage.tsx
│   ├── NotFoundPage.tsx
│   ├── RecurringExpensesPage.tsx
│   └── TodoListPage.tsx
├── test/
│   ├── mocks/
│   │   ├── handlers.ts
│   │   └── server.ts
│   ├── setup.ts
│   └── test-utils.tsx
├── App.tsx
├── index.css
├── main.tsx
└── routes.ts
```

---

## All Stories Complete! 🎉

You now have detailed, implementable stories for the entire Balance frontend:

| Document | Epics | Stories | Tests |
|----------|-------|---------|-------|
| FRONTEND_STORIES_EPIC1.md | Infrastructure | 6 | ~50 |
| FRONTEND_STORIES_EPIC2.md | Accounts | 7 | ~46 |
| FRONTEND_STORIES_EPIC3.md | Recurring Expenses | 5 | ~42 |
| FRONTEND_STORIES_EPIC4.md | Budget List | 3 | ~24 |
| FRONTEND_STORIES_EPIC5.md | Budget Wizard | 7 | ~83 |
| FRONTEND_STORIES_EPIC6.md | Budget Detail | 9 | ~58 |
| FRONTEND_STORIES_EPIC7.md | Todo List | 5 | ~39 |
| **TOTAL** | **7 Epics** | **42 Stories** | **~342 Tests** |

---

## Implementation Order

1. **Epic 1: Infrastructure** — Foundation, must be first
2. **Epic 2: Accounts** — No dependencies on other features
3. **Epic 3: Recurring Expenses** — No dependencies on other features
4. **Epic 4: Budget List** — Simple, sets up routing
5. **Epic 5: Budget Wizard** — Depends on Accounts, Recurring Expenses
6. **Epic 6: Budget Detail** — Depends on Budget Wizard patterns
7. **Epic 7: Todo List** — Depends on Budget Detail (locked budgets)

Each epic can be developed independently after Epic 1, though the order above represents logical dependencies.

---

*Frontend Stories Complete — December 2024*