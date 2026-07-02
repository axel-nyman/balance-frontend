import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import { EditBudgetMonthModal } from './EditBudgetMonthModal'
import { server } from '@/test/mocks/server'
import { http, HttpResponse } from 'msw'
import type { BudgetSummary } from '@/api/types'

function summary(overrides: Partial<BudgetSummary>): BudgetSummary {
  return {
    id: 'budget-123',
    month: 3,
    year: 2025,
    status: 'UNLOCKED',
    createdAt: '2025-03-01T00:00:00Z',
    lockedAt: null,
    totals: { income: 0, expenses: 0, savings: 0, balance: 0 },
    ...overrides,
  }
}

describe('EditBudgetMonthModal', () => {
  const defaultProps = {
    budgetId: 'budget-123',
    month: 3,
    year: 2025,
    open: true,
    onOpenChange: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the Edit Month title', () => {
    render(<EditBudgetMonthModal {...defaultProps} />)

    expect(screen.getByText('Edit Month')).toBeInTheDocument()
  })

  it('pre-fills the budget current month and year', () => {
    render(<EditBudgetMonthModal {...defaultProps} />)

    expect(screen.getByRole('combobox', { name: /month/i })).toHaveTextContent('March')
    expect(screen.getByRole('combobox', { name: /year/i })).toHaveTextContent('2025')
  })

  it('saves the month/year via PUT and closes', async () => {
    let requestBody: unknown
    server.use(
      http.put('/api/budgets/budget-123', async ({ request }) => {
        requestBody = await request.json()
        return HttpResponse.json(summary({}))
      })
    )
    const onOpenChange = vi.fn()
    render(<EditBudgetMonthModal {...defaultProps} onOpenChange={onOpenChange} />)

    await userEvent.click(screen.getByRole('button', { name: /save/i }))

    await waitFor(() => expect(requestBody).toEqual({ month: 3, year: 2025 }))
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false))
  })

  it('blocks saving onto a month/year that already has a budget', async () => {
    server.use(
      http.get('/api/budgets', () =>
        HttpResponse.json({
          budgets: [
            summary({ id: 'budget-123', month: 3, year: 2025 }),
            summary({ id: 'other', month: 4, year: 2025, status: 'LOCKED' }),
          ],
        })
      )
    )
    render(<EditBudgetMonthModal {...defaultProps} />)

    // Move the month onto the locked April budget
    await userEvent.click(screen.getByRole('combobox', { name: /month/i }))
    await userEvent.click(screen.getByRole('option', { name: 'April' }))

    expect(await screen.findByText(/a budget already exists/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /save/i })).toBeDisabled()
  })
})
