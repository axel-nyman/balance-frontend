import { describe, it, expect } from 'vitest'
import { render, screen } from '@/test/test-utils'
import { DueStatusIndicator } from './DueStatusIndicator'

describe('DueStatusIndicator', () => {
  it('shows "Never used" for items without lastUsedDate', () => {
    render(
      <DueStatusIndicator
        isDue={false}
        nextDueDate={null}
        lastUsedDate={null}
      />
    )

    expect(screen.getByText(/never used/i)).toBeInTheDocument()
  })

  it('shows warning indicator for never used items', () => {
    const { container } = render(
      <DueStatusIndicator
        isDue={false}
        nextDueDate={null}
        lastUsedDate={null}
      />
    )

    expect(container.querySelector('.bg-warning')).toBeInTheDocument()
  })

  it('shows "Due now" for due items', () => {
    render(
      <DueStatusIndicator
        isDue={true}
        nextDueDate="2025-01-01"
        lastUsedDate="2024-12-01"
      />
    )

    expect(screen.getByText(/due now/i)).toBeInTheDocument()
  })

  it('shows red indicator for due items', () => {
    const { container } = render(
      <DueStatusIndicator
        isDue={true}
        nextDueDate="2025-01-01"
        lastUsedDate="2024-12-01"
      />
    )

    expect(container.querySelector('.bg-expense')).toBeInTheDocument()
  })

  it('shows next due date for not-due items', () => {
    render(
      <DueStatusIndicator
        isDue={false}
        nextDueDate="2025-06-01"
        lastUsedDate="2025-01-01"
      />
    )

    // Should show month/year format
    expect(screen.getByText(/juni 2025/i)).toBeInTheDocument()
  })

  it('shows green indicator for not-due items', () => {
    const { container } = render(
      <DueStatusIndicator
        isDue={false}
        nextDueDate="2025-06-01"
        lastUsedDate="2025-01-01"
      />
    )

    expect(container.querySelector('.bg-income')).toBeInTheDocument()
  })
})
