import { describe, it, expect, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { renderWithRoute } from '@/test/test-utils'
import { BudgetDetailPage } from './BudgetDetailPage'
import { server } from '@/test/mocks/server'
import { http, HttpResponse } from 'msw'
import type { BudgetDetail } from '@/api/types'

const mockBudget: BudgetDetail = {
  id: '123',
  month: 3,
  year: 2025,
  status: 'UNLOCKED',
  createdAt: '2025-03-01T00:00:00Z',
  lockedAt: null,
  income: [
    { id: 'i1', name: 'Salary', amount: 50000, bankAccount: { id: 'acc-1', name: 'Main Account' } },
  ],
  expenses: [
    {
      id: 'e1',
      name: 'Rent',
      amount: 8000,
      bankAccount: { id: 'acc-1', name: 'Main Account' },
      recurringExpenseId: null,
      deductedAt: null,
      isManual: false,
    },
  ],
  savings: [],
  totals: {
    income: 50000,
    expenses: 8000,
    savings: 0,
    balance: 42000,
  },
}

function renderBudgetDetailPage(budgetId = '123') {
  return renderWithRoute(
    <BudgetDetailPage />,
    {
      route: '/budgets/:id',
      initialEntry: `/budgets/${budgetId}`,
    }
  )
}

describe('BudgetDetailPage', () => {
  beforeEach(() => {
    server.use(
      http.get('/api/budgets/123', () => {
        return HttpResponse.json(mockBudget)
      })
    )
  })

  it('shows loading state initially', () => {
    renderBudgetDetailPage()

    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('displays budget month and year as title', async () => {
    renderBudgetDetailPage()

    await waitFor(() => {
      expect(screen.getByText(/mars 2025/i)).toBeInTheDocument()
    })
  })

  it('shows Draft badge for draft budgets', async () => {
    renderBudgetDetailPage()

    await waitFor(() => {
      expect(screen.getByText('Draft')).toBeInTheDocument()
    })
  })

  it('shows Locked badge for locked budgets', async () => {
    server.use(
      http.get('/api/budgets/123', () => {
        return HttpResponse.json({ ...mockBudget, status: 'LOCKED' })
      })
    )

    renderBudgetDetailPage()

    await waitFor(() => {
      expect(screen.getByText('Locked')).toBeInTheDocument()
    })
  })

  it('shows Todo List button for locked budgets', async () => {
    server.use(
      http.get('/api/budgets/123', () => {
        return HttpResponse.json({ ...mockBudget, status: 'LOCKED' })
      })
    )

    renderBudgetDetailPage()

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /todo list/i })).toBeInTheDocument()
    })
  })

  it('shows error state for non-existent budget', async () => {
    server.use(
      http.get('/api/budgets/999', () => {
        return HttpResponse.json({ error: 'Not found' }, { status: 404 })
      })
    )

    renderBudgetDetailPage('999')

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: /budget not found/i })).toBeInTheDocument()
      expect(screen.getByText(/doesn't exist or has been deleted/i)).toBeInTheDocument()
    })
  })
})
