import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@/test/test-utils'
import { WizardItemEditModal } from './WizardItemEditModal'
import type { WizardIncomeItem } from './types'

const incomeItem: WizardIncomeItem = {
  id: 'income-1',
  name: 'Salary',
  amount: 30000,
  bankAccountId: '1',
  bankAccountName: 'Checking',
}

function renderModal(open = true) {
  return render(
    <WizardItemEditModal
      itemType="income"
      item={incomeItem}
      open={open}
      onOpenChange={vi.fn()}
      onSave={vi.fn()}
      onDelete={vi.fn()}
    />
  )
}

describe('WizardItemEditModal', () => {
  it('renders the Done and Delete action buttons when open', () => {
    renderModal()

    expect(screen.getByRole('button', { name: 'Done' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument()
  })

  it('pads the footer by the bottom safe-area inset while preserving the 0.5rem floor', () => {
    renderModal()

    const footer = document.querySelector('[data-slot="sheet-footer"]')
    expect(footer).not.toBeNull()
    // max() keeps the existing pb-2 (0.5rem) on devices without an inset (desktop)
    // and grows to env(safe-area-inset-bottom) on notched/rounded phones.
    expect(footer).toHaveClass('pb-[max(0.5rem,env(safe-area-inset-bottom))]')
  })
})
