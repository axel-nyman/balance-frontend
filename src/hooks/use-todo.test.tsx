import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useTodoList, useUpdateTodoItem } from './use-todo'
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

describe('useTodoList', () => {
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
    const { result } = renderHook(() => useTodoList('123'), {
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

    const { result } = renderHook(() => useUpdateTodoItem('123'), { wrapper })

    result.current.mutate({
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

    const { result } = renderHook(() => useUpdateTodoItem('123'), { wrapper })

    result.current.mutate({
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
