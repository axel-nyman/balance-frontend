import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import { BudgetGrid } from './BudgetGrid'
import type { BudgetSummary } from '@/api/types'

// Mock useNavigate for BudgetCard
vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router')
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  }
})

const mockBudgets: BudgetSummary[] = [
  {
    id: '1',
    month: 1,
    year: 2025,
    status: 'LOCKED',
    createdAt: '2025-01-01',
    lockedAt: '2025-01-31',
    totals: {
      income: 50000,
      expenses: 35000,
      savings: 10000,
      balance: 5000,
    },
  },
  {
    id: '2',
    month: 3,
    year: 2025,
    status: 'UNLOCKED',
    createdAt: '2025-03-01',
    lockedAt: null,
    totals: {
      income: 50000,
      expenses: 30000,
      savings: 15000,
      balance: 5000,
    },
  },
  {
    id: '3',
    month: 12,
    year: 2024,
    status: 'LOCKED',
    createdAt: '2024-12-01',
    lockedAt: '2024-12-31',
    totals: {
      income: 48000,
      expenses: 32000,
      savings: 10000,
      balance: 6000,
    },
  },
]

const defaultProps = {
  budgets: mockBudgets,
  isLoading: false,
  isError: false,
  onRetry: vi.fn(),
  onCreateNew: vi.fn(),
}

describe('BudgetGrid', () => {
  it('renders loading state', () => {
    render(<BudgetGrid {...defaultProps} isLoading={true} budgets={[]} />)

    // Should show skeleton loading
    expect(screen.queryByText(/mars 2025/i)).not.toBeInTheDocument()
  })

  it('renders error state with retry button', async () => {
    const onRetry = vi.fn()
    render(<BudgetGrid {...defaultProps} isError={true} budgets={[]} onRetry={onRetry} />)

    expect(screen.getByText(/failed to load/i)).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /try again/i }))
    expect(onRetry).toHaveBeenCalled()
  })

  it('renders empty state when no budgets', () => {
    render(<BudgetGrid {...defaultProps} budgets={[]} />)

    expect(screen.getByText(/no budgets yet/i)).toBeInTheDocument()
  })

  it('renders empty state with create button', async () => {
    const onCreateNew = vi.fn()
    render(<BudgetGrid {...defaultProps} budgets={[]} onCreateNew={onCreateNew} />)

    await userEvent.click(screen.getByRole('button', { name: /create your first budget/i }))
    expect(onCreateNew).toHaveBeenCalled()
  })

  it('renders all budget cards', () => {
    render(<BudgetGrid {...defaultProps} />)

    expect(screen.getByText(/januari 2025/i)).toBeInTheDocument()
    expect(screen.getByText(/mars 2025/i)).toBeInTheDocument()
    expect(screen.getByText(/december 2024/i)).toBeInTheDocument()
  })

  it('sorts budgets by date descending (newest first)', () => {
    render(<BudgetGrid {...defaultProps} />)

    const headings = screen.getAllByRole('heading', { level: 3 })

    // March 2025 should come before January 2025, which should come before December 2024
    const texts = headings.map((h) => h.textContent)
    expect(texts[0]).toMatch(/mars 2025/i)
    expect(texts[1]).toMatch(/januari 2025/i)
    expect(texts[2]).toMatch(/december 2024/i)
  })

  it('shows status badges', () => {
    render(<BudgetGrid {...defaultProps} />)

    expect(screen.getByText('Draft')).toBeInTheDocument()
    expect(screen.getAllByText('Locked')).toHaveLength(2)
  })
})
