import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import { BudgetActions } from './BudgetActions'
import { server } from '@/test/mocks/server'
import { http, HttpResponse } from 'msw'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

const mockBudget = {
  id: '123',
  month: 1,
  year: 2025,
  status: 'LOCKED',
  createdAt: '2025-01-01T00:00:00Z',
  lockedAt: '2025-01-02T00:00:00Z',
  income: [],
  expenses: [],
  savings: [],
  totals: { income: 0, expenses: 0, savings: 0, balance: 0 },
}

describe('BudgetActions', () => {
  beforeEach(() => {
    mockNavigate.mockClear()
  })

  it('shows Lock button for unlocked budgets', () => {
    render(<BudgetActions budgetId="123" status="UNLOCKED" />)

    expect(screen.getByRole('button', { name: /lock budget/i })).toBeInTheDocument()
  })

  it('shows Unlock button for locked budgets', () => {
    render(<BudgetActions budgetId="123" status="LOCKED" />)

    expect(screen.getByRole('button', { name: /unlock budget/i })).toBeInTheDocument()
  })

  it('shows Delete button for unlocked budgets', () => {
    render(<BudgetActions budgetId="123" status="UNLOCKED" />)

    expect(screen.getByRole('button', { name: /delete budget/i })).toBeInTheDocument()
  })

  it('hides Delete button for locked budgets', () => {
    render(<BudgetActions budgetId="123" status="LOCKED" />)

    expect(screen.queryByRole('button', { name: /delete budget/i })).not.toBeInTheDocument()
  })

  it('opens lock confirmation dialog', async () => {
    render(<BudgetActions budgetId="123" status="UNLOCKED" />)

    await userEvent.click(screen.getByRole('button', { name: /lock budget/i }))

    expect(screen.getByText(/locking this budget will/i)).toBeInTheDocument()
  })

  it('locks budget when confirmed', async () => {
    server.use(
      http.put('/api/budgets/123/lock', () => {
        return HttpResponse.json({ ...mockBudget, status: 'LOCKED', lockedAt: new Date().toISOString() })
      })
    )

    render(<BudgetActions budgetId="123" status="UNLOCKED" />)

    await userEvent.click(screen.getByRole('button', { name: /lock budget/i }))

    // Find the confirm button in the dialog
    const confirmButtons = screen.getAllByRole('button', { name: /lock budget/i })
    await userEvent.click(confirmButtons[confirmButtons.length - 1])

    await waitFor(() => {
      expect(screen.queryByText(/locking this budget will/i)).not.toBeInTheDocument()
    })
  })

  it('opens unlock confirmation dialog', async () => {
    render(<BudgetActions budgetId="123" status="LOCKED" />)

    await userEvent.click(screen.getByRole('button', { name: /unlock budget/i }))

    expect(screen.getByText(/unlocking this budget will/i)).toBeInTheDocument()
  })

  it('unlocks budget when confirmed', async () => {
    server.use(
      http.put('/api/budgets/123/unlock', () => {
        return HttpResponse.json({ ...mockBudget, status: 'UNLOCKED', lockedAt: null })
      })
    )

    render(<BudgetActions budgetId="123" status="LOCKED" />)

    await userEvent.click(screen.getByRole('button', { name: /unlock budget/i }))

    const confirmButtons = screen.getAllByRole('button', { name: /unlock budget/i })
    await userEvent.click(confirmButtons[confirmButtons.length - 1])

    await waitFor(() => {
      expect(screen.queryByText(/unlocking this budget will/i)).not.toBeInTheDocument()
    })
  })

  it('opens delete confirmation dialog', async () => {
    render(<BudgetActions budgetId="123" status="UNLOCKED" />)

    await userEvent.click(screen.getByRole('button', { name: /delete budget/i }))

    expect(screen.getByText(/are you sure you want to delete/i)).toBeInTheDocument()
  })

  it('deletes budget and navigates to list', async () => {
    server.use(
      http.delete('/api/budgets/123', () => {
        return new HttpResponse(null, { status: 204 })
      })
    )

    render(<BudgetActions budgetId="123" status="UNLOCKED" />)

    await userEvent.click(screen.getByRole('button', { name: /delete budget/i }))
    await userEvent.click(screen.getByRole('button', { name: /^delete$/i }))

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/budgets')
    })
  })
})
