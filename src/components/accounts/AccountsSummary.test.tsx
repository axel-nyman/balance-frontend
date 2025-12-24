import { describe, it, expect } from 'vitest'
import { render, screen } from '@/test/test-utils'
import { AccountsSummary } from './AccountsSummary'

describe('AccountsSummary', () => {
  it('displays total balance formatted as SEK', () => {
    render(<AccountsSummary totalBalance={12500} accountCount={3} />)

    expect(screen.getByText(/12 500,00 kr/)).toBeInTheDocument()
  })

  it('displays account count with singular form', () => {
    render(<AccountsSummary totalBalance={1000} accountCount={1} />)

    expect(screen.getByText(/1 account/)).toBeInTheDocument()
  })

  it('displays account count with plural form', () => {
    render(<AccountsSummary totalBalance={1000} accountCount={3} />)

    expect(screen.getByText(/3 accounts/)).toBeInTheDocument()
  })

  it('shows skeleton when loading', () => {
    const { container } = render(
      <AccountsSummary totalBalance={0} accountCount={0} isLoading />
    )

    expect(container.querySelector('[class*="animate-pulse"]')).toBeInTheDocument()
  })
})
