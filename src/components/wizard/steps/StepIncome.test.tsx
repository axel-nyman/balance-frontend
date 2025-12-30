import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import { WizardProvider } from '../WizardContext'
import { StepIncome } from './StepIncome'
import { server } from '@/test/mocks/server'
import { http, HttpResponse } from 'msw'

function renderWithWizard() {
  return render(
    <WizardProvider>
      <StepIncome />
    </WizardProvider>
  )
}

describe('StepIncome', () => {
  beforeEach(() => {
    server.use(
      http.get('/api/budgets', () => {
        return HttpResponse.json({ budgets: [] })
      }),
      http.get('/api/bank-accounts', () => {
        return HttpResponse.json({
          totalBalance: 10000,
          accountCount: 2,
          accounts: [
            { id: 'acc-1', name: 'Checking', description: null, currentBalance: 5000, createdAt: '2025-01-01' },
            { id: 'acc-2', name: 'Savings', description: null, currentBalance: 5000, createdAt: '2025-01-01' },
          ],
        })
      })
    )
  })

  it('renders income table with headers', () => {
    renderWithWizard()

    expect(screen.getByText('Name')).toBeInTheDocument()
    expect(screen.getByText('Account')).toBeInTheDocument()
    expect(screen.getByText('Amount')).toBeInTheDocument()
  })

  it('shows empty state message when no items', () => {
    renderWithWizard()

    expect(screen.getByText(/no income items yet/i)).toBeInTheDocument()
  })

  it('shows validation message when no items', () => {
    renderWithWizard()

    expect(screen.getByText(/add at least one income source/i)).toBeInTheDocument()
  })

  it('adds income item when add button clicked', async () => {
    renderWithWizard()

    await userEvent.click(screen.getByRole('button', { name: /add income/i }))

    expect(screen.getByPlaceholderText(/salary/i)).toBeInTheDocument()
  })

  it('allows editing income name', async () => {
    renderWithWizard()

    await userEvent.click(screen.getByRole('button', { name: /add income/i }))

    const nameInput = screen.getByPlaceholderText(/salary/i)
    await userEvent.type(nameInput, 'My Salary')

    expect(nameInput).toHaveValue('My Salary')
  })

  it('allows editing income amount', async () => {
    renderWithWizard()

    await userEvent.click(screen.getByRole('button', { name: /add income/i }))

    const amountInput = screen.getByPlaceholderText('0')
    await userEvent.type(amountInput, '50000')

    expect(amountInput).toHaveValue(50000)
  })

  it('removes income item when delete clicked', async () => {
    renderWithWizard()

    await userEvent.click(screen.getByRole('button', { name: /add income/i }))
    expect(screen.getByPlaceholderText(/salary/i)).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /remove/i }))

    expect(screen.queryByPlaceholderText(/salary/i)).not.toBeInTheDocument()
  })

  it('shows total income', async () => {
    renderWithWizard()

    await userEvent.click(screen.getByRole('button', { name: /add income/i }))
    const amountInput = screen.getByPlaceholderText('0')
    await userEvent.type(amountInput, '50000')

    await waitFor(() => {
      expect(screen.getByText(/50 000,00 kr/)).toBeInTheDocument()
    })
  })

  it('hides validation message after adding item', async () => {
    renderWithWizard()

    expect(screen.getByText(/add at least one/i)).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /add income/i }))

    expect(screen.queryByText(/add at least one/i)).not.toBeInTheDocument()
  })

  it('shows copy from last budget button when budget exists', async () => {
    server.use(
      http.get('/api/budgets', () => {
        return HttpResponse.json({
          budgets: [{ id: 'budget-1', month: 1, year: 2025, status: 'LOCKED' }],
        })
      })
    )

    renderWithWizard()

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /copy from last/i })).toBeInTheDocument()
    })
  })

  it('does not show copy button when no previous budgets', () => {
    renderWithWizard()

    expect(screen.queryByRole('button', { name: /copy from last/i })).not.toBeInTheDocument()
  })

  it('opens copy modal when copy button clicked', async () => {
    server.use(
      http.get('/api/budgets', () => {
        return HttpResponse.json({
          budgets: [{ id: 'budget-1', month: 1, year: 2025, status: 'LOCKED' }],
        })
      }),
      http.get('/api/budgets/budget-1', () => {
        return HttpResponse.json({
          id: 'budget-1',
          month: 1,
          year: 2025,
          status: 'LOCKED',
          income: [
            { id: 'inc-1', name: 'Salary', amount: 50000, bankAccount: { id: 'acc-1', name: 'Checking' } },
          ],
          expenses: [],
          savings: [],
          totals: { income: 50000, expenses: 0, savings: 0, balance: 50000 },
        })
      })
    )

    renderWithWizard()

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /copy from last/i })).toBeInTheDocument()
    })

    await userEvent.click(screen.getByRole('button', { name: /copy from last/i }))

    await waitFor(() => {
      expect(screen.getByText(/copy income from last budget/i)).toBeInTheDocument()
    })
  })

  it('copies selected income items from modal', async () => {
    server.use(
      http.get('/api/budgets', () => {
        return HttpResponse.json({
          budgets: [{ id: 'budget-1', month: 1, year: 2025, status: 'LOCKED' }],
        })
      }),
      http.get('/api/budgets/budget-1', () => {
        return HttpResponse.json({
          id: 'budget-1',
          month: 1,
          year: 2025,
          status: 'LOCKED',
          income: [
            { id: 'inc-1', name: 'Salary', amount: 50000, bankAccount: { id: 'acc-1', name: 'Checking' } },
            { id: 'inc-2', name: 'Side gig', amount: 5000, bankAccount: { id: 'acc-1', name: 'Checking' } },
          ],
          expenses: [],
          savings: [],
          totals: { income: 55000, expenses: 0, savings: 0, balance: 55000 },
        })
      })
    )

    renderWithWizard()

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /copy from last/i })).toBeInTheDocument()
    })

    await userEvent.click(screen.getByRole('button', { name: /copy from last/i }))

    // Wait for modal content to load - look for "Select all" which indicates items loaded
    await waitFor(() => {
      expect(screen.getByText(/select all/i)).toBeInTheDocument()
    })

    // Select both items using "Select all" checkbox
    const checkboxes = screen.getAllByRole('checkbox')
    await userEvent.click(checkboxes[0]) // First checkbox is "Select all"

    // Wait for Copy button to show count
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /copy \(2\)/i })).toBeInTheDocument()
    })

    // Click copy button
    await userEvent.click(screen.getByRole('button', { name: /copy \(2\)/i }))

    // Verify items were added
    await waitFor(() => {
      expect(screen.getByDisplayValue('Salary')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Side gig')).toBeInTheDocument()
    })
  })

  it('allows selecting account for income item', async () => {
    renderWithWizard()

    await userEvent.click(screen.getByRole('button', { name: /add income/i }))

    // Find and click the account select
    const accountSelect = screen.getByRole('combobox')
    await userEvent.click(accountSelect)

    // Wait for accounts to load and select one
    await waitFor(() => {
      expect(screen.getByText('Checking')).toBeInTheDocument()
    })

    await userEvent.click(screen.getByText('Checking'))

    // Verify the account is selected
    expect(screen.getByText('Checking')).toBeInTheDocument()
  })
})
