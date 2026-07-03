import { describe, it, expect } from 'vitest'
import { render, screen } from '@/test/test-utils'
import { BudgetTrendsCard } from './BudgetTrendsCard'
import { selectTrendBudgets, MAX_TREND_MONTHS } from '@/lib/budget-trends'
import type { BudgetSummary, BudgetStatus } from '@/api/types'

function makeBudget(
  month: number,
  year: number,
  status: BudgetStatus,
  totals: Partial<BudgetSummary['totals']> = {}
): BudgetSummary {
  return {
    id: `${year}-${month}`,
    month,
    year,
    status,
    createdAt: `${year}-${String(month).padStart(2, '0')}-01`,
    lockedAt: status === 'LOCKED' ? `${year}-${String(month).padStart(2, '0')}-28` : null,
    totals: { income: 50000, expenses: 35000, savings: 15000, balance: 0, ...totals },
  }
}

describe('selectTrendBudgets', () => {
  it('excludes UNLOCKED budgets regardless of their dates', () => {
    const result = selectTrendBudgets([
      makeBudget(1, 2025, 'LOCKED'),
      makeBudget(2, 2025, 'UNLOCKED'),
      makeBudget(3, 2025, 'LOCKED'),
    ])

    expect(result.map((b) => b.month)).toEqual([1, 3])
    expect(result.every((b) => b.status === 'LOCKED')).toBe(true)
  })

  it('orders budgets chronologically by (year, month), oldest first', () => {
    const result = selectTrendBudgets([
      makeBudget(2, 2025, 'LOCKED'),
      makeBudget(11, 2024, 'LOCKED'),
      makeBudget(1, 2025, 'LOCKED'),
      makeBudget(12, 2024, 'LOCKED'),
    ])

    expect(result.map((b) => `${b.year}-${b.month}`)).toEqual([
      '2024-11',
      '2024-12',
      '2025-1',
      '2025-2',
    ])
  })

  it('caps the result to the 12 most recent locked budgets', () => {
    // 14 consecutive locked months: Jan 2024 – Feb 2025
    const budgets = Array.from({ length: 14 }, (_, i) =>
      makeBudget((i % 12) + 1, 2024 + Math.floor(i / 12), 'LOCKED')
    )

    const result = selectTrendBudgets(budgets)

    expect(result).toHaveLength(MAX_TREND_MONTHS)
    expect(result[0]).toMatchObject({ month: 3, year: 2024 })
    expect(result[result.length - 1]).toMatchObject({ month: 2, year: 2025 })
  })
})

describe('BudgetTrendsCard', () => {
  it('renders nothing when there are no locked budgets', () => {
    render(<BudgetTrendsCard budgets={[makeBudget(1, 2025, 'UNLOCKED')]} />)

    expect(screen.queryByTestId('budget-trends-card')).not.toBeInTheDocument()
  })

  it('renders nothing with only one locked budget', () => {
    render(
      <BudgetTrendsCard
        budgets={[makeBudget(1, 2025, 'LOCKED'), makeBudget(2, 2025, 'UNLOCKED')]}
      />
    )

    expect(screen.queryByTestId('budget-trends-card')).not.toBeInTheDocument()
  })

  it('renders the card with two locked budgets', () => {
    render(
      <BudgetTrendsCard budgets={[makeBudget(1, 2025, 'LOCKED'), makeBudget(2, 2025, 'LOCKED')]} />
    )

    expect(screen.getByTestId('budget-trends-card')).toBeInTheDocument()
    expect(screen.getByText('Trends')).toBeInTheDocument()
  })

  it('plots one line per series with a legend', () => {
    render(
      <BudgetTrendsCard budgets={[makeBudget(1, 2025, 'LOCKED'), makeBudget(2, 2025, 'LOCKED')]} />
    )

    expect(screen.getByTestId('trends-line-income')).toBeInTheDocument()
    expect(screen.getByTestId('trends-line-expenses')).toBeInTheDocument()
    expect(screen.getByTestId('trends-line-savings')).toBeInTheDocument()
    expect(screen.getByText('Income')).toBeInTheDocument()
    expect(screen.getByText('Expenses')).toBeInTheDocument()
    expect(screen.getByText('Savings')).toBeInTheDocument()
  })

  it('labels the chart with the chronological month range in sv-SE, ignoring drafts', () => {
    render(
      <BudgetTrendsCard
        budgets={[
          makeBudget(3, 2025, 'UNLOCKED'), // newest, but a draft — must not appear
          makeBudget(2, 2025, 'LOCKED'),
          makeBudget(12, 2024, 'LOCKED'),
        ]}
      />
    )

    const chart = screen.getByRole('img')
    expect(chart).toHaveAccessibleName(
      'Income, expenses and savings per month for 2 locked budgets, dec. 2024 to feb. 2025'
    )
    expect(screen.getByText('dec. 2024')).toBeInTheDocument()
    expect(screen.getByText('feb. 2025')).toBeInTheDocument()
  })

  it('shows the latest savings rate, amounts in SEK, and the plotted-months average', () => {
    render(
      <BudgetTrendsCard
        budgets={[
          makeBudget(1, 2025, 'LOCKED', { income: 50000, savings: 5000 }), // 10%
          makeBudget(2, 2025, 'LOCKED', { income: 50000, savings: 10000 }), // 20% latest
        ]}
      />
    )

    const stat = screen.getByText(/savings rate/i)
    expect(stat).toHaveTextContent('Savings rate 20% in feb. 2025')
    expect(stat).toHaveTextContent('15% average over these 2 months')
    // sv-SE grouping uses non-breaking spaces — normalize before asserting
    const text = stat.textContent!.replace(/[\u00a0\u202f]/g, ' ')
    expect(text).toContain('10 000 kr')
    expect(text).toContain('50 000 kr')
  })

  it('treats a zero-income month as a 0% savings rate instead of dividing by zero', () => {
    render(
      <BudgetTrendsCard
        budgets={[
          makeBudget(1, 2025, 'LOCKED', { income: 0, savings: 0, expenses: 0 }),
          makeBudget(2, 2025, 'LOCKED', { income: 50000, savings: 10000 }),
        ]}
      />
    )

    expect(screen.getByText(/savings rate/i)).toHaveTextContent(
      '10% average over these 2 months'
    )
  })
})
