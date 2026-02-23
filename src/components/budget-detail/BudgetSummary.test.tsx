import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@/test/test-utils'
import { BudgetSummary } from './BudgetSummary'
import type { BudgetDetail } from '@/api/types'

// Mock useTodoList
const mockUseTodoList = vi.fn()
vi.mock('@/hooks/use-todo', () => ({
  useTodoList: (...args: unknown[]) => mockUseTodoList(...args),
}))

function makeBudget(overrides: Partial<BudgetDetail> = {}): BudgetDetail {
  return {
    id: '1',
    month: 3,
    year: 2025,
    status: 'UNLOCKED',
    createdAt: '2025-03-01',
    lockedAt: null,
    income: [{ id: 'i1', name: 'Salary', amount: 50000, bankAccount: { id: 'a1', name: 'Main' } }],
    expenses: [{ id: 'e1', name: 'Rent', amount: 30000, bankAccount: { id: 'a1', name: 'Main' }, recurringExpenseId: null, deductedAt: null, isManual: false }],
    savings: [{ id: 's1', name: 'Savings', amount: 10000, bankAccount: { id: 'a2', name: 'Savings' } }],
    totals: { income: 50000, expenses: 30000, savings: 10000, balance: 10000 },
    ...overrides,
  }
}

describe('BudgetSummary', () => {
  beforeEach(() => {
    mockUseTodoList.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
    })
  })

  // Stage 1: Draft — Empty
  it('shows empty state when budget has no items', () => {
    const budget = makeBudget({
      income: [],
      expenses: [],
      savings: [],
      totals: { income: 0, expenses: 0, savings: 0, balance: 0 },
    })

    render(<BudgetSummary budget={budget} />)

    expect(screen.getByText('Start building your budget')).toBeInTheDocument()
    expect(screen.getByText('Add income, expenses, and savings below')).toBeInTheDocument()
  })

  // Stage 2: Draft — Building
  it('shows allocation bar and stats for draft with items', () => {
    const budget = makeBudget()

    render(<BudgetSummary budget={budget} />)

    expect(screen.getAllByText('Income').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('Expenses')).toBeInTheDocument()
    expect(screen.getByText('Savings')).toBeInTheDocument()
    expect(screen.getByText('Balance')).toBeInTheDocument()
    expect(screen.getByText('50 000,00 kr')).toBeInTheDocument()
  })

  it('shows balance with semantic color', () => {
    const budget = makeBudget()

    const { container } = render(<BudgetSummary budget={budget} />)

    // Positive balance = income color
    const incomeElements = container.querySelectorAll('.text-income')
    expect(incomeElements.length).toBeGreaterThanOrEqual(1)
  })

  it('shows negative balance in red', () => {
    const budget = makeBudget({
      totals: { income: 30000, expenses: 40000, savings: 0, balance: -10000 },
    })

    const { container } = render(<BudgetSummary budget={budget} />)

    const redElements = container.querySelectorAll('.text-expense')
    expect(redElements.length).toBeGreaterThanOrEqual(1)
  })

  it('shows red-tinted bar when over-allocated', () => {
    const budget = makeBudget({
      totals: { income: 30000, expenses: 30000, savings: 5000, balance: -5000 },
    })

    const { container } = render(<BudgetSummary budget={budget} />)

    const tintedBar = container.querySelector('.bg-expense-muted')
    expect(tintedBar).toBeInTheDocument()
  })

  // Stage 3: Draft — Balanced
  it('shows balanced indicator when balance is 0', () => {
    const budget = makeBudget({
      totals: { income: 50000, expenses: 40000, savings: 10000, balance: 0 },
    })

    render(<BudgetSummary budget={budget} />)

    expect(screen.getByText('Budget balanced')).toBeInTheDocument()
    expect(screen.getByText('Ready to lock and start tracking')).toBeInTheDocument()
  })

  it('omits balance column in balanced state', () => {
    const budget = makeBudget({
      totals: { income: 50000, expenses: 40000, savings: 10000, balance: 0 },
    })

    render(<BudgetSummary budget={budget} />)

    expect(screen.queryByText('Balance')).not.toBeInTheDocument()
  })

  // Stage 4: Locked — In Progress
  it('shows todo progress for locked budget with incomplete todos', () => {
    const budget = makeBudget({
      status: 'LOCKED',
      lockedAt: '2025-03-31',
    })

    mockUseTodoList.mockReturnValue({
      data: {
        id: 'todo-1',
        budgetId: '1',
        createdAt: '2025-03-31',
        items: [],
        summary: { totalItems: 7, completedItems: 3, pendingItems: 4 },
      },
      isLoading: false,
      isError: false,
    })

    render(<BudgetSummary budget={budget} />)

    expect(screen.getByText('3 of 7 todos done')).toBeInTheDocument()
  })

  // Stage 5: Locked — Complete
  it('shows celebration for locked budget with all todos complete', () => {
    const budget = makeBudget({
      status: 'LOCKED',
      lockedAt: '2025-03-31',
      totals: { income: 50000, expenses: 40000, savings: 10000, balance: 0 },
    })

    mockUseTodoList.mockReturnValue({
      data: {
        id: 'todo-1',
        budgetId: '1',
        createdAt: '2025-03-31',
        items: [],
        summary: { totalItems: 5, completedItems: 5, pendingItems: 0 },
      },
      isLoading: false,
      isError: false,
    })

    render(<BudgetSummary budget={budget} />)

    expect(screen.getByText(/All done for mars!/i)).toBeInTheDocument()
    expect(screen.getByText(/Saved 20% of income this month/)).toBeInTheDocument()
  })

  // Loading state
  it('shows skeleton while todo data is loading', () => {
    const budget = makeBudget({
      status: 'LOCKED',
      lockedAt: '2025-03-31',
    })

    mockUseTodoList.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    })

    render(<BudgetSummary budget={budget} />)

    const pulse = document.querySelector('.animate-pulse')
    expect(pulse).toBeInTheDocument()
  })

  // Error fallback
  it('shows stats without balance row on todo fetch error', () => {
    const budget = makeBudget({
      status: 'LOCKED',
      lockedAt: '2025-03-31',
    })

    mockUseTodoList.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    })

    render(<BudgetSummary budget={budget} />)

    expect(screen.getAllByText('Income').length).toBeGreaterThanOrEqual(1)
    expect(screen.queryByText('Balance')).not.toBeInTheDocument()
  })

  // useTodoList options
  it('calls useTodoList with enabled=false for draft budgets', () => {
    const budget = makeBudget()

    render(<BudgetSummary budget={budget} />)

    expect(mockUseTodoList).toHaveBeenCalledWith('1', {
      enabled: false,
      staleTime: 5 * 60 * 1000,
    })
  })

  it('calls useTodoList with enabled=true for locked budgets', () => {
    const budget = makeBudget({
      status: 'LOCKED',
      lockedAt: '2025-03-31',
    })

    render(<BudgetSummary budget={budget} />)

    expect(mockUseTodoList).toHaveBeenCalledWith('1', {
      enabled: true,
      staleTime: 5 * 60 * 1000,
    })
  })
})
