import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import { BudgetsPage } from './BudgetsPage'
import { server } from '@/test/mocks/server'
import { http, HttpResponse } from 'msw'
import type { BudgetSummary } from '@/api/types'

// Mock useNavigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

const mockBudgetsResponse = {
  budgets: [
    {
      id: '1',
      month: 3,
      year: 2025,
      status: 'UNLOCKED',
      createdAt: '2025-03-01',
      lockedAt: null,
      totals: {
        income: 50000,
        expenses: 35000,
        savings: 10000,
        balance: 5000,
      },
    } satisfies BudgetSummary,
  ],
}

describe('BudgetsPage', () => {
  beforeEach(() => {
    mockNavigate.mockClear()
    server.use(
      http.get('/api/budgets', () => {
        return HttpResponse.json(mockBudgetsResponse)
      })
    )
  })

  it('renders page header with title', () => {
    render(<BudgetsPage />)

    expect(screen.getByRole('heading', { name: /budgets/i })).toBeInTheDocument()
  })

  it('renders new budget button', () => {
    render(<BudgetsPage />)

    expect(screen.getByRole('button', { name: /new budget/i })).toBeInTheDocument()
  })

  it('navigates to wizard when new budget button is clicked', async () => {
    render(<BudgetsPage />)

    await userEvent.click(screen.getByRole('button', { name: /new budget/i }))

    expect(mockNavigate).toHaveBeenCalledWith('/budgets/new')
  })

  it('displays budgets from API', async () => {
    render(<BudgetsPage />)

    await waitFor(() => {
      expect(screen.getByText(/mars 2025/i)).toBeInTheDocument()
    })
  })

  it('shows empty state when no budgets', async () => {
    server.use(
      http.get('/api/budgets', () => {
        return HttpResponse.json({ budgets: [] })
      })
    )

    render(<BudgetsPage />)

    await waitFor(() => {
      expect(screen.getByText(/no budgets yet/i)).toBeInTheDocument()
    })
  })

  it('shows error state on API failure', async () => {
    server.use(
      http.get('/api/budgets', () => {
        return HttpResponse.error()
      })
    )

    render(<BudgetsPage />)

    await waitFor(() => {
      expect(screen.getByText(/failed to load/i)).toBeInTheDocument()
    })
  })

  it('retries on error', async () => {
    let callCount = 0
    server.use(
      http.get('/api/budgets', () => {
        callCount++
        if (callCount === 1) {
          return HttpResponse.error()
        }
        return HttpResponse.json(mockBudgetsResponse)
      })
    )

    render(<BudgetsPage />)

    await waitFor(() => {
      expect(screen.getByText(/failed to load/i)).toBeInTheDocument()
    })

    await userEvent.click(screen.getByRole('button', { name: /try again/i }))

    await waitFor(() => {
      expect(screen.getByText(/mars 2025/i)).toBeInTheDocument()
    })
  })
})
