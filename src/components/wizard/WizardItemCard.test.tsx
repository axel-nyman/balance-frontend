import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import { WizardItemCard } from './WizardItemCard'

describe('WizardItemCard — quick-add variant', () => {
  it('shows the name, amount and add control but defers the account', () => {
    render(
      <WizardItemCard
        variant="quick-add"
        name="Rent"
        amount={8000}
        bankAccountName="Checking"
        amountColorClass="text-expense"
        onQuickAdd={() => {}}
      />
    )

    expect(screen.getByText('Rent')).toBeInTheDocument()
    expect(screen.getByText(/8 000,00 kr/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /add rent/i })).toBeInTheDocument()
    // Account is not shown at scan time — it's set on add and editable later
    expect(screen.queryByText(/Checking/)).not.toBeInTheDocument()
  })

  it('fires onQuickAdd when the add control is clicked', async () => {
    const onQuickAdd = vi.fn()
    render(
      <WizardItemCard
        variant="quick-add"
        name="Netflix"
        amount={169}
        bankAccountName=""
        amountColorClass="text-expense"
        onQuickAdd={onQuickAdd}
      />
    )

    await userEvent.click(screen.getByRole('button', { name: /add netflix/i }))

    expect(onQuickAdd).toHaveBeenCalledTimes(1)
  })

  it('uses tighter padding at md+ while keeping comfortable mobile padding', () => {
    const { container } = render(
      <WizardItemCard
        variant="quick-add"
        name="Rent"
        amount={8000}
        bankAccountName="Checking"
        amountColorClass="text-expense"
        onQuickAdd={() => {}}
      />
    )

    // Mobile keeps p-4; desktop tightens via md: overrides (visibly more compact)
    const card = container.firstElementChild as HTMLElement
    expect(card).toHaveClass('p-4')
    expect(card).toHaveClass('md:px-3')
    expect(card).toHaveClass('md:py-2')
  })

  it('keeps the full-size add tap target', () => {
    render(
      <WizardItemCard
        variant="quick-add"
        name="Rent"
        amount={8000}
        bankAccountName="Checking"
        amountColorClass="text-expense"
        onQuickAdd={() => {}}
      />
    )

    const addButton = screen.getByRole('button', { name: /add rent/i })
    expect(addButton).toHaveClass('h-8')
    expect(addButton).toHaveClass('w-8')
  })
})
