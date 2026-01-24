import { describe, it, expect } from 'vitest'
import { render, screen } from '@/test/test-utils'
import { BudgetSummary } from './BudgetSummary'

describe('BudgetSummary', () => {
  it('displays all totals', () => {
    render(
      <BudgetSummary
        totalIncome={50000}
        totalExpenses={30000}
        totalSavings={15000}
      />
    )

    expect(screen.getByText('50 000,00 kr')).toBeInTheDocument()
    expect(screen.getByText('30 000,00 kr')).toBeInTheDocument()
    expect(screen.getByText('15 000,00 kr')).toBeInTheDocument()
    // Balance = 50000 - 30000 - 15000 = 5000
    expect(screen.getByText('5 000,00 kr')).toBeInTheDocument()
  })

  it('calculates balance correctly', () => {
    render(
      <BudgetSummary
        totalIncome={50000}
        totalExpenses={30000}
        totalSavings={10000}
      />
    )

    // Balance = 50000 - 30000 - 10000 = 10000
    expect(screen.getAllByText(/10 000,00 kr/)).toHaveLength(2) // savings and balance
  })

  it('shows positive balance in green', () => {
    const { container } = render(
      <BudgetSummary
        totalIncome={50000}
        totalExpenses={30000}
        totalSavings={10000}
      />
    )

    const balanceElements = container.querySelectorAll('.text-income')
    expect(balanceElements.length).toBeGreaterThanOrEqual(2) // income and balance
  })

  it('shows negative balance in red', () => {
    const { container } = render(
      <BudgetSummary
        totalIncome={30000}
        totalExpenses={40000}
        totalSavings={0}
      />
    )

    // Balance = -10000, should be red
    const redElements = container.querySelectorAll('.text-expense')
    expect(redElements.length).toBeGreaterThanOrEqual(2) // expenses and balance
  })
})
