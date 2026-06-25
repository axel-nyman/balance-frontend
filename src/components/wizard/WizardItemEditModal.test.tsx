import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/mocks/server'
import { WizardItemEditModal } from './WizardItemEditModal'
import type { WizardIncomeItem, WizardSavingsItem } from './types'

const incomeItem: WizardIncomeItem = {
  id: 'income-1',
  name: 'Salary',
  amount: 30000,
  bankAccountId: '1',
  bankAccountName: 'Checking',
}

const savingsItem: WizardSavingsItem = {
  id: 'savings-1',
  name: 'Emergency Fund',
  amount: 2000,
  bankAccountId: '1',
  bankAccountName: 'Checking',
}

function mockGoals() {
  server.use(
    http.get('/api/savings-goals', () =>
      HttpResponse.json({
        goalCount: 1,
        goals: [
          {
            id: 'goal-1',
            name: 'Vacation',
            targetAmount: null,
            endDate: null,
            status: 'ACTIVE',
            totalAllocated: 0,
            progressPercentage: null,
            completed: false,
            allocations: [],
            archivedAt: null,
            createdAt: '2026-01-01T00:00:00Z',
            updatedAt: '2026-01-01T00:00:00Z',
          },
        ],
      })
    )
  )
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

  it('insets the footer buttons horizontally on mobile to clear the rounded screen corners, leaving desktop unchanged', () => {
    renderModal()

    const footer = document.querySelector('[data-slot="sheet-footer"]')
    expect(footer).not.toBeNull()
    // On mobile the full-width buttons get horizontal + extra bottom padding so
    // their edges clear the phone's rounded corners; sm:* restores the original
    // edge-to-edge desktop spacing (px-0 / pb-2 floor), keeping desktop unchanged.
    expect(footer).toHaveClass('px-4', 'pb-4', 'sm:px-0', 'sm:pb-2')
  })

  it('does not render a goal selector for income items', () => {
    renderModal()

    expect(
      screen.queryByRole('combobox', { name: /goal/i })
    ).not.toBeInTheDocument()
  })

  it('renders a goal selector for savings items and saves the chosen goal', async () => {
    mockGoals()
    const onSave = vi.fn()
    render(
      <WizardItemEditModal
        itemType="savings"
        item={savingsItem}
        open
        onOpenChange={vi.fn()}
        onSave={onSave}
        onDelete={vi.fn()}
      />
    )

    await userEvent.click(screen.getByRole('combobox', { name: /goal/i }))
    await userEvent.click(await screen.findByRole('option', { name: 'Vacation' }))
    await userEvent.click(screen.getByRole('button', { name: 'Done' }))

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith(
        'savings-1',
        expect.objectContaining({
          savingsGoalId: 'goal-1',
          savingsGoalName: 'Vacation',
        })
      )
    })
  })

  it('clears the goal link when switched back to No goal', async () => {
    mockGoals()
    const onSave = vi.fn()
    render(
      <WizardItemEditModal
        itemType="savings"
        item={{ ...savingsItem, savingsGoalId: 'goal-1', savingsGoalName: 'Vacation' }}
        open
        onOpenChange={vi.fn()}
        onSave={onSave}
        onDelete={vi.fn()}
      />
    )

    await userEvent.click(await screen.findByRole('combobox', { name: /goal/i }))
    await userEvent.click(await screen.findByRole('option', { name: 'No goal' }))
    await userEvent.click(screen.getByRole('button', { name: 'Done' }))

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith(
        'savings-1',
        expect.objectContaining({
          savingsGoalId: undefined,
          savingsGoalName: undefined,
        })
      )
    })
  })
})
