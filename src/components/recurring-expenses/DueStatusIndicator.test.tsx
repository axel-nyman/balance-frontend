import { describe, it, expect } from 'vitest'
import { render, screen } from '@/test/test-utils'
import { DueStatusIndicator } from './DueStatusIndicator'
import { getCurrentMonthYear } from '@/lib/utils'

describe('DueStatusIndicator', () => {
  it('shows "Never used" when dueMonth is null', () => {
    render(
      <DueStatusIndicator
        dueMonth={null}
        dueYear={null}
        dueDisplay={null}
      />
    )

    expect(screen.getByText(/never used/i)).toBeInTheDocument()
  })

  it('shows warning indicator for never used items', () => {
    const { container } = render(
      <DueStatusIndicator
        dueMonth={null}
        dueYear={null}
        dueDisplay={null}
      />
    )

    expect(container.querySelector('.bg-warning')).toBeInTheDocument()
  })

  it('shows "Due now" when dueMonth/dueYear matches current month', () => {
    const { month, year } = getCurrentMonthYear()
    render(
      <DueStatusIndicator
        dueMonth={month}
        dueYear={year}
        dueDisplay="February"
      />
    )

    expect(screen.getByText(/due now/i)).toBeInTheDocument()
  })

  it('shows red indicator for due items', () => {
    const { month, year } = getCurrentMonthYear()
    const { container } = render(
      <DueStatusIndicator
        dueMonth={month}
        dueYear={year}
        dueDisplay="February"
      />
    )

    expect(container.querySelector('.bg-expense')).toBeInTheDocument()
  })

  it('shows dueDisplay text for not-due items', () => {
    render(
      <DueStatusIndicator
        dueMonth={6}
        dueYear={2025}
        dueDisplay="June 2025"
      />
    )

    expect(screen.getByText('June 2025')).toBeInTheDocument()
  })

  it('shows green indicator for not-due items', () => {
    const { container } = render(
      <DueStatusIndicator
        dueMonth={6}
        dueYear={2025}
        dueDisplay="June 2025"
      />
    )

    expect(container.querySelector('.bg-income')).toBeInTheDocument()
  })
})
