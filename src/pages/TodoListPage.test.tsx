import { describe, it, expect, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { renderWithRoute } from '@/test/test-utils'
import { TodoListPage } from './TodoListPage'
import { server } from '@/test/mocks/server'
import { http, HttpResponse } from 'msw'
import type { BudgetDetail, TodoList } from '@/api/types'

const mockBudget: BudgetDetail = {
  id: '123',
  month: 3,
  year: 2025,
  status: 'LOCKED',
  createdAt: '2025-03-01T00:00:00Z',
  lockedAt: '2025-03-01T12:00:00Z',
  income: [],
  expenses: [],
  savings: [],
  totals: { income: 0, expenses: 0, savings: 0, balance: 0 },
}

const mockTodoData: TodoList = {
  id: 'todolist-1',
  budgetId: '123',
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
      name: 'Transfer to Savings Account',
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
}

function renderTodoListPage(budgetId = '123') {
  return renderWithRoute(
    <TodoListPage />,
    {
      route: '/budgets/:id/todo',
      initialEntry: `/budgets/${budgetId}/todo`,
    }
  )
}

describe('TodoListPage', () => {
  beforeEach(() => {
    server.use(
      http.get('/api/budgets/123', () => {
        return HttpResponse.json(mockBudget)
      }),
      http.get('/api/budgets/123/todo-list', () => {
        return HttpResponse.json(mockTodoData)
      })
    )
  })

  it('shows loading state initially', () => {
    renderTodoListPage()

    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('displays budget month and year in title', async () => {
    renderTodoListPage()

    await waitFor(() => {
      expect(screen.getByText(/mars 2025/i)).toBeInTheDocument()
    })
  })

  it('shows back to budget link', async () => {
    renderTodoListPage()

    await waitFor(() => {
      expect(screen.getByRole('link', { name: /back to budget/i })).toBeInTheDocument()
    })
  })

  it('shows todo items', async () => {
    renderTodoListPage()

    await waitFor(() => {
      expect(screen.getByText('Rent')).toBeInTheDocument()
      expect(screen.getByText(/Main Account → Savings Account/)).toBeInTheDocument()
    })
  })

  it('shows error for non-locked budget', async () => {
    server.use(
      http.get('/api/budgets/123', () => {
        return HttpResponse.json({ ...mockBudget, status: 'UNLOCKED' })
      }),
      http.get('/api/budgets/123/todo-list', () => {
        return HttpResponse.json(
          { error: 'Budget is not locked' },
          { status: 400 }
        )
      })
    )

    renderTodoListPage()

    await waitFor(() => {
      expect(screen.getByText(/must be locked/i)).toBeInTheDocument()
    })
  })

  it('shows empty state when no todo items', async () => {
    server.use(
      http.get('/api/budgets/123', () => {
        return HttpResponse.json(mockBudget)
      }),
      http.get('/api/budgets/123/todo-list', () => {
        return HttpResponse.json({
          ...mockTodoData,
          items: [],
        })
      })
    )

    renderTodoListPage()

    await waitFor(() => {
      expect(screen.getByText(/no todo items/i)).toBeInTheDocument()
    })
  })
})
