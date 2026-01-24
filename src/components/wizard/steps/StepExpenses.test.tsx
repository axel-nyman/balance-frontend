import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import { WizardProvider, useWizard } from '../WizardContext'
import { StepExpenses } from './StepExpenses'
import { server } from '@/test/mocks/server'
import { http, HttpResponse } from 'msw'
import { useEffect } from 'react'

// Helper to set up wizard state with income
function WizardWithIncome({ children }: { children: React.ReactNode }) {
  const { dispatch } = useWizard()

  useEffect(() => {
    dispatch({
      type: 'SET_INCOME_ITEMS',
      items: [
        {
          id: '1',
          name: 'Salary',
          amount: 50000,
          bankAccountId: 'acc-1',
          bankAccountName: 'Checking',
        },
      ],
    })
  }, [dispatch])

  return <>{children}</>
}

function renderWithWizard(withIncome = false) {
  if (withIncome) {
    return render(
      <WizardProvider>
        <WizardWithIncome>
          <StepExpenses />
        </WizardWithIncome>
      </WizardProvider>
    )
  }
  return render(
    <WizardProvider>
      <StepExpenses />
    </WizardProvider>
  )
}

describe('StepExpenses', () => {
  beforeEach(() => {
    server.use(
      http.get('/api/bank-accounts', () => {
        return HttpResponse.json({
          totalBalance: 10000,
          accountCount: 2,
          accounts: [
            { id: 'acc-1', name: 'Checking', description: null, currentBalance: 5000, createdAt: '2025-01-01' },
            { id: 'acc-2', name: 'Savings', description: null, currentBalance: 5000, createdAt: '2025-01-01' },
          ],
        })
      }),
      http.get('/api/recurring-expenses', () => {
        return HttpResponse.json({ expenses: [] })
      })
    )
  })

  it('renders expense table with headers', () => {
    renderWithWizard()

    expect(screen.getByText('Name')).toBeInTheDocument()
    expect(screen.getByText('Account')).toBeInTheDocument()
    expect(screen.getByText('Amount')).toBeInTheDocument()
    expect(screen.getByText('Manual')).toBeInTheDocument()
  })

  it('shows empty state message when no items', () => {
    renderWithWizard()

    expect(screen.getByText(/no expenses yet/i)).toBeInTheDocument()
  })

  it('adds expense item when add button clicked', async () => {
    renderWithWizard()

    await userEvent.click(screen.getByRole('button', { name: /add expense/i }))

    expect(screen.getByPlaceholderText(/rent/i)).toBeInTheDocument()
  })

  it('allows editing expense name', async () => {
    renderWithWizard()

    await userEvent.click(screen.getByRole('button', { name: /add expense/i }))

    const nameInput = screen.getByPlaceholderText(/rent/i)
    await userEvent.type(nameInput, 'Monthly Rent')

    expect(nameInput).toHaveValue('Monthly Rent')
  })

  it('allows editing expense amount', async () => {
    renderWithWizard()

    await userEvent.click(screen.getByRole('button', { name: /add expense/i }))

    const amountInput = screen.getByPlaceholderText('0')
    await userEvent.type(amountInput, '8000')

    expect(amountInput).toHaveValue(8000)
  })

  it('removes expense item when delete clicked', async () => {
    renderWithWizard()

    await userEvent.click(screen.getByRole('button', { name: /add expense/i }))
    expect(screen.getByPlaceholderText(/rent/i)).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /remove/i }))

    expect(screen.queryByPlaceholderText(/rent/i)).not.toBeInTheDocument()
  })

  it('shows total expenses', async () => {
    renderWithWizard()

    await userEvent.click(screen.getByRole('button', { name: /add expense/i }))
    const amountInput = screen.getByPlaceholderText('0')
    await userEvent.type(amountInput, '8000')

    await waitFor(() => {
      // Amount appears in balance display and table footer
      const amounts = screen.getAllByText(/8 000,00 kr/)
      expect(amounts.length).toBeGreaterThanOrEqual(1)
    })
  })

  it('allows selecting account for expense item', async () => {
    renderWithWizard()

    await userEvent.click(screen.getByRole('button', { name: /add expense/i }))

    const accountSelect = screen.getByRole('combobox')
    await userEvent.click(accountSelect)

    await waitFor(() => {
      expect(screen.getByText('Checking')).toBeInTheDocument()
    })

    await userEvent.click(screen.getByText('Checking'))

    expect(screen.getByText('Checking')).toBeInTheDocument()
  })

  it('allows toggling manual checkbox', async () => {
    renderWithWizard()

    await userEvent.click(screen.getByRole('button', { name: /add expense/i }))

    const checkbox = screen.getByRole('checkbox', { name: /manual payment/i })
    expect(checkbox).not.toBeChecked()

    await userEvent.click(checkbox)

    expect(checkbox).toBeChecked()
  })

  it('shows quick-add section when recurring expenses exist', async () => {
    server.use(
      http.get('/api/recurring-expenses', () => {
        return HttpResponse.json({
          expenses: [
            { id: 're-1', name: 'Rent', amount: 8000, recurrenceInterval: 'MONTHLY', isManual: false, isDue: false, lastUsedDate: null, nextDueDate: null, createdAt: '2025-01-01' },
            { id: 're-2', name: 'Netflix', amount: 169, recurrenceInterval: 'MONTHLY', isManual: true, isDue: true, lastUsedDate: null, nextDueDate: null, createdAt: '2025-01-01' },
          ],
        })
      })
    )

    renderWithWizard()

    await waitFor(() => {
      expect(screen.getByText(/quick add/i)).toBeInTheDocument()
      expect(screen.getByText('Rent')).toBeInTheDocument()
      expect(screen.getByText('Netflix')).toBeInTheDocument()
    })
  })

  it('shows "Due" badge on due recurring expenses', async () => {
    server.use(
      http.get('/api/recurring-expenses', () => {
        return HttpResponse.json({
          expenses: [
            { id: 're-1', name: 'Rent', amount: 8000, recurrenceInterval: 'MONTHLY', isManual: false, isDue: true, lastUsedDate: null, nextDueDate: null, createdAt: '2025-01-01' },
          ],
        })
      })
    )

    renderWithWizard()

    await waitFor(() => {
      expect(screen.getByText('Due')).toBeInTheDocument()
    })
  })

  it('shows "Manual" badge on manual recurring expenses', async () => {
    server.use(
      http.get('/api/recurring-expenses', () => {
        return HttpResponse.json({
          expenses: [
            { id: 're-1', name: 'Utility Bill', amount: 500, recurrenceInterval: 'MONTHLY', isManual: true, isDue: false, lastUsedDate: null, nextDueDate: null, createdAt: '2025-01-01' },
          ],
        })
      })
    )

    renderWithWizard()

    await waitFor(() => {
      expect(screen.getByText('Manual')).toBeInTheDocument()
    })
  })

  it('adds recurring expense to table when quick-add clicked', async () => {
    server.use(
      http.get('/api/recurring-expenses', () => {
        return HttpResponse.json({
          expenses: [
            { id: 're-1', name: 'Rent', amount: 8000, recurrenceInterval: 'MONTHLY', isManual: false, isDue: false, lastUsedDate: null, nextDueDate: null, createdAt: '2025-01-01' },
          ],
        })
      })
    )

    renderWithWizard()

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /add rent/i })).toBeInTheDocument()
    })

    await userEvent.click(screen.getByRole('button', { name: /add rent/i }))

    await waitFor(() => {
      expect(screen.getByDisplayValue('Rent')).toBeInTheDocument()
      expect(screen.getByDisplayValue('8000')).toBeInTheDocument()
    })
  })

  it('removes recurring expense from quick-add after adding', async () => {
    server.use(
      http.get('/api/recurring-expenses', () => {
        return HttpResponse.json({
          expenses: [
            { id: 're-1', name: 'Rent', amount: 8000, recurrenceInterval: 'MONTHLY', isManual: false, isDue: false, lastUsedDate: null, nextDueDate: null, createdAt: '2025-01-01' },
          ],
        })
      })
    )

    renderWithWizard()

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /add rent/i })).toBeInTheDocument()
    })

    await userEvent.click(screen.getByRole('button', { name: /add rent/i }))

    // Wait for animation and state update
    await waitFor(() => {
      expect(screen.getByDisplayValue('Rent')).toBeInTheDocument()
    }, { timeout: 1000 })

    // The quick-add button should be gone after animation
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /add rent/i })).not.toBeInTheDocument()
    }, { timeout: 1000 })
  })

  it('does not show quick-add section when no recurring expenses', () => {
    renderWithWizard()

    expect(screen.queryByText(/quick add/i)).not.toBeInTheDocument()
  })

  it('shows message when all recurring expenses added', async () => {
    server.use(
      http.get('/api/recurring-expenses', () => {
        return HttpResponse.json({
          expenses: [
            { id: 're-1', name: 'Rent', amount: 8000, recurrenceInterval: 'MONTHLY', isManual: false, isDue: false, lastUsedDate: null, nextDueDate: null, createdAt: '2025-01-01' },
          ],
        })
      })
    )

    renderWithWizard()

    // Wait for quick-add to appear
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /add rent/i })).toBeInTheDocument()
    })

    // Add the only recurring expense
    await userEvent.click(screen.getByRole('button', { name: /add rent/i }))

    // Wait for the item to be added and animation to complete
    await waitFor(() => {
      expect(screen.getByText(/all recurring expenses have been added/i)).toBeInTheDocument()
    }, { timeout: 1000 })
  })

  it('preserves isManual setting when adding from recurring', async () => {
    server.use(
      http.get('/api/recurring-expenses', () => {
        return HttpResponse.json({
          expenses: [
            { id: 're-1', name: 'Utility Bill', amount: 500, recurrenceInterval: 'MONTHLY', isManual: true, isDue: false, lastUsedDate: null, nextDueDate: null, createdAt: '2025-01-01' },
          ],
        })
      })
    )

    renderWithWizard()

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /add utility/i })).toBeInTheDocument()
    })

    await userEvent.click(screen.getByRole('button', { name: /add utility/i }))

    await waitFor(() => {
      const checkbox = screen.getByRole('checkbox', { name: /manual payment/i })
      expect(checkbox).toBeChecked()
    })
  })

  it('groups due expenses separately from other recurring', async () => {
    server.use(
      http.get('/api/recurring-expenses', () => {
        return HttpResponse.json({
          expenses: [
            { id: 're-1', name: 'Rent', amount: 8000, recurrenceInterval: 'MONTHLY', isManual: false, isDue: true, lastUsedDate: null, nextDueDate: null, createdAt: '2025-01-01' },
            { id: 're-2', name: 'Netflix', amount: 169, recurrenceInterval: 'MONTHLY', isManual: false, isDue: false, lastUsedDate: null, nextDueDate: null, createdAt: '2025-01-01' },
          ],
        })
      })
    )

    renderWithWizard()

    await waitFor(() => {
      expect(screen.getByText(/due this month/i)).toBeInTheDocument()
      expect(screen.getByText(/other recurring/i)).toBeInTheDocument()
    })
  })

  it('shows running balance summary', async () => {
    renderWithWizard(true)

    await waitFor(() => {
      expect(screen.getByText('Income')).toBeInTheDocument()
      expect(screen.getByText('Remaining')).toBeInTheDocument()
    })
  })

  it('displays income from previous step', async () => {
    renderWithWizard(true)

    await waitFor(() => {
      // Income appears in both Income and Remaining columns (both 50000 at start)
      const amounts = screen.getAllByText(/50 000,00 kr/)
      expect(amounts.length).toBeGreaterThanOrEqual(1)
    })
  })

  it('calculates remaining balance correctly', async () => {
    renderWithWizard(true)

    // Add expense
    await userEvent.click(screen.getByRole('button', { name: /add expense/i }))
    const amountInput = screen.getByPlaceholderText('0')
    await userEvent.type(amountInput, '20000')

    // Income 50000 - Expenses 20000 = 30000 remaining
    await waitFor(() => {
      expect(screen.getByText(/30 000,00 kr/)).toBeInTheDocument()
    })
  })

  it('shows warning when expenses exceed income', async () => {
    renderWithWizard(true)

    await userEvent.click(screen.getByRole('button', { name: /add expense/i }))

    const amountInput = screen.getByPlaceholderText('0')
    await userEvent.type(amountInput, '60000')

    await waitFor(() => {
      expect(screen.getByText(/exceed/i)).toBeInTheDocument()
    })
  })

  it('shows remaining in red when negative', async () => {
    renderWithWizard(true)

    await userEvent.click(screen.getByRole('button', { name: /add expense/i }))

    const amountInput = screen.getByPlaceholderText('0')
    await userEvent.type(amountInput, '60000')

    await waitFor(() => {
      // Find the remaining balance element - it's the one with the negative sign
      const remainingText = screen.getByText(/−10 000,00 kr/)
      expect(remainingText).toHaveClass('text-expense')
    })
  })
})
