import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import { BudgetCard } from './BudgetCard'
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

const mockDraftBudget: BudgetSummary = {
  id: '123',
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
}

const mockLockedBudget: BudgetSummary = {
  ...mockDraftBudget,
  id: '456',
  status: 'LOCKED',
  lockedAt: '2025-03-31',
}

describe('BudgetCard', () => {
  beforeEach(() => {
    mockNavigate.mockClear()
  })

  it('renders month and year', () => {
    render(<BudgetCard budget={mockDraftBudget} />)

    expect(screen.getByText(/mars 2025/i)).toBeInTheDocument()
  })

  it('shows Draft badge for draft budgets', () => {
    render(<BudgetCard budget={mockDraftBudget} />)

    expect(screen.getByText('Draft')).toBeInTheDocument()
  })

  it('shows Locked badge for locked budgets', () => {
    render(<BudgetCard budget={mockLockedBudget} />)

    expect(screen.getByText('Locked')).toBeInTheDocument()
  })

  it('displays income formatted as SEK', () => {
    render(<BudgetCard budget={mockDraftBudget} />)

    expect(screen.getByText(/50 000,00 kr/)).toBeInTheDocument()
  })

  it('displays expenses formatted as SEK', () => {
    render(<BudgetCard budget={mockDraftBudget} />)

    expect(screen.getByText(/35 000,00 kr/)).toBeInTheDocument()
  })

  it('displays savings formatted as SEK', () => {
    render(<BudgetCard budget={mockDraftBudget} />)

    expect(screen.getByText(/10 000,00 kr/)).toBeInTheDocument()
  })

  it('displays balance', () => {
    render(<BudgetCard budget={mockDraftBudget} />)

    // Find the balance row and check the value
    const balanceLabel = screen.getByText('Balance')
    const balanceRow = balanceLabel.closest('div')
    expect(balanceRow).toHaveTextContent('5 000,00 kr')
  })

  it('shows positive balance in green', () => {
    render(<BudgetCard budget={mockDraftBudget} />)

    // Find the balance row
    const balanceLabel = screen.getByText('Balance')
    const balanceRow = balanceLabel.closest('div')
    const balanceValue = balanceRow?.querySelector('.text-green-600')

    expect(balanceValue).toBeInTheDocument()
  })

  it('shows negative balance in red', () => {
    const negativeBudget: BudgetSummary = {
      ...mockDraftBudget,
      totals: {
        ...mockDraftBudget.totals,
        balance: -10000,
      },
    }
    render(<BudgetCard budget={negativeBudget} />)

    // Balance would be negative
    const balanceLabel = screen.getByText('Balance')
    const balanceRow = balanceLabel.closest('div')
    const balanceValue = balanceRow?.querySelector('.text-red-600')

    expect(balanceValue).toBeInTheDocument()
  })

  it('navigates to budget detail on click', async () => {
    render(<BudgetCard budget={mockDraftBudget} />)

    await userEvent.click(screen.getByText(/mars 2025/i))

    expect(mockNavigate).toHaveBeenCalledWith('/budgets/123')
  })
})
