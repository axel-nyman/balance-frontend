import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import { BudgetCard } from './BudgetCard'
import type { BudgetSummary } from '@/api/types'

// Mock useNavigate
const mockNavigate = vi.fn()
vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

// Mock useTodoList
const mockUseTodoList = vi.fn()
vi.mock('@/hooks/use-todo', () => ({
  useTodoList: (...args: unknown[]) => mockUseTodoList(...args),
}))

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

const mockBalancedDraftBudget: BudgetSummary = {
  ...mockDraftBudget,
  id: '789',
  totals: {
    income: 50000,
    expenses: 40000,
    savings: 10000,
    balance: 0,
  },
}

const mockLockedBudget: BudgetSummary = {
  ...mockDraftBudget,
  id: '456',
  status: 'LOCKED',
  lockedAt: '2025-03-31',
  totals: {
    income: 50000,
    expenses: 35000,
    savings: 10000,
    balance: 5000,
  },
}

const mockLockedBalancedBudget: BudgetSummary = {
  ...mockLockedBudget,
  id: '999',
  totals: {
    income: 50000,
    expenses: 40000,
    savings: 10000,
    balance: 0,
  },
}

describe('BudgetCard', () => {
  beforeEach(() => {
    mockNavigate.mockClear()
    mockUseTodoList.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
    })
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

    expect(screen.getByText(/50 000 kr/)).toBeInTheDocument()
  })

  it('displays expenses formatted as SEK', () => {
    render(<BudgetCard budget={mockDraftBudget} />)

    expect(screen.getByText(/35 000 kr/)).toBeInTheDocument()
  })

  it('displays savings formatted as SEK', () => {
    render(<BudgetCard budget={mockDraftBudget} />)

    expect(screen.getByText(/10 000 kr/)).toBeInTheDocument()
  })

  it('displays balance for draft unbalanced budget', () => {
    render(<BudgetCard budget={mockDraftBudget} />)

    const balanceLabel = screen.getByText('Balance')
    const balanceRow = balanceLabel.closest('div')
    expect(balanceRow).toHaveTextContent('5 000 kr')
  })

  it('shows positive balance in green', () => {
    render(<BudgetCard budget={mockDraftBudget} />)

    const balanceLabel = screen.getByText('Balance')
    const balanceRow = balanceLabel.closest('div')
    const balanceValue = balanceRow?.querySelector('.text-income')

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

    const balanceLabel = screen.getByText('Balance')
    const balanceRow = balanceLabel.closest('div')
    const balanceValue = balanceRow?.querySelector('.text-expense')

    expect(balanceValue).toBeInTheDocument()
  })

  it('navigates to budget detail on click', async () => {
    render(<BudgetCard budget={mockDraftBudget} />)

    await userEvent.click(screen.getByText(/mars 2025/i))

    expect(mockNavigate).toHaveBeenCalledWith('/budgets/123')
  })

  // Draft balanced state
  it('shows "Balanced" with check icon for balanced draft budget', () => {
    render(<BudgetCard budget={mockBalancedDraftBudget} />)

    expect(screen.getByText('Balanced')).toBeInTheDocument()
    expect(screen.getByText('Balance')).toBeInTheDocument()
  })

  it('shows "Balanced" in green for balanced draft', () => {
    render(<BudgetCard budget={mockBalancedDraftBudget} />)

    const balanced = screen.getByText('Balanced')
    expect(balanced.closest('span')).toHaveClass('text-income')
  })

  // Locked, todos in progress
  it('shows todo progress for locked budget with incomplete todos', () => {
    mockUseTodoList.mockReturnValue({
      data: {
        id: 'todo-1',
        budgetId: '456',
        createdAt: '2025-03-31',
        items: [],
        summary: { totalItems: 7, completedItems: 3, pendingItems: 4 },
      },
      isLoading: false,
      isError: false,
    })

    render(<BudgetCard budget={mockLockedBudget} />)

    expect(screen.getByText('Todos')).toBeInTheDocument()
    expect(screen.getByText(/3\/7 done/)).toBeInTheDocument()
  })

  // Locked, complete
  it('shows savings rate for locked budget with all todos complete', () => {
    mockUseTodoList.mockReturnValue({
      data: {
        id: 'todo-1',
        budgetId: '999',
        createdAt: '2025-03-31',
        items: [],
        summary: { totalItems: 5, completedItems: 5, pendingItems: 0 },
      },
      isLoading: false,
      isError: false,
    })

    render(<BudgetCard budget={mockLockedBalancedBudget} />)

    expect(screen.getByText('Saved')).toBeInTheDocument()
    expect(screen.getByText(/20%/)).toBeInTheDocument()
  })

  // Loading state
  it('shows skeleton while todo data is loading', () => {
    mockUseTodoList.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    })

    render(<BudgetCard budget={mockLockedBudget} />)

    expect(screen.getByText('Todos')).toBeInTheDocument()
    const pulse = document.querySelector('.animate-pulse')
    expect(pulse).toBeInTheDocument()
  })

  // Error fallback
  it('falls back to balance display on todo fetch error', () => {
    mockUseTodoList.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    })

    render(<BudgetCard budget={mockLockedBudget} />)

    expect(screen.getByText('Balance')).toBeInTheDocument()
    const balanceRow = screen.getByText('Balance').closest('div')
    expect(balanceRow).toHaveTextContent('5 000 kr')
  })

  // Edge case: locked with 0 todo items = complete
  it('treats locked budget with 0 todos as complete', () => {
    mockUseTodoList.mockReturnValue({
      data: {
        id: 'todo-1',
        budgetId: '999',
        createdAt: '2025-03-31',
        items: [],
        summary: { totalItems: 0, completedItems: 0, pendingItems: 0 },
      },
      isLoading: false,
      isError: false,
    })

    render(<BudgetCard budget={mockLockedBalancedBudget} />)

    expect(screen.getByText('Saved')).toBeInTheDocument()
    expect(screen.getByText(/20%/)).toBeInTheDocument()
  })

  // Edge case: income = 0
  it('shows 0% savings rate when income is zero', () => {
    const zeroIncomeBudget: BudgetSummary = {
      ...mockLockedBudget,
      totals: { income: 0, expenses: 0, savings: 0, balance: 0 },
    }

    mockUseTodoList.mockReturnValue({
      data: {
        id: 'todo-1',
        budgetId: '456',
        createdAt: '2025-03-31',
        items: [],
        summary: { totalItems: 2, completedItems: 2, pendingItems: 0 },
      },
      isLoading: false,
      isError: false,
    })

    render(<BudgetCard budget={zeroIncomeBudget} />)

    expect(screen.getByText(/0%/)).toBeInTheDocument()
  })

  // useTodoList is called with correct options
  it('calls useTodoList with enabled=false for draft budgets', () => {
    render(<BudgetCard budget={mockDraftBudget} />)

    expect(mockUseTodoList).toHaveBeenCalledWith('123', {
      enabled: false,
      staleTime: 5 * 60 * 1000,
    })
  })

  it('calls useTodoList with enabled=true for locked budgets', () => {
    render(<BudgetCard budget={mockLockedBudget} />)

    expect(mockUseTodoList).toHaveBeenCalledWith('456', {
      enabled: true,
      staleTime: 5 * 60 * 1000,
    })
  })
})
