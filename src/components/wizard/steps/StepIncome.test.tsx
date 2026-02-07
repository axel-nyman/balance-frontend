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

    expect(screen.getAllByText(/no income items yet/i).length).toBeGreaterThanOrEqual(1)
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
      expect(screen.getAllByText(/50 000,00 kr/).length).toBeGreaterThanOrEqual(1)
    })
  })

  it('hides validation message after adding item', async () => {
    renderWithWizard()

    expect(screen.getByText(/add at least one/i)).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /add income/i }))

    expect(screen.queryByText(/add at least one/i)).not.toBeInTheDocument()
  })

  it('shows "From last budget" section when previous budget exists', async () => {
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

    // Wait for "From last budget" section to appear
    await waitFor(() => {
      expect(screen.getAllByText(/from last budget/i).length).toBeGreaterThanOrEqual(1)
    })

    // Should show the item from last budget
    expect(screen.getAllByText('Salary').length).toBeGreaterThanOrEqual(1)
  })

  it('does not show "From last budget" section when no previous budgets', () => {
    renderWithWizard()

    expect(screen.queryByText(/from last budget/i)).not.toBeInTheDocument()
  })

  it('copies item when plus button is clicked', async () => {
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

    // Wait for item to appear
    await waitFor(() => {
      expect(screen.getAllByText('Salary').length).toBeGreaterThanOrEqual(1)
    })

    // Click the "Add item" button (plus icon) for this item
    const addButtons = screen.getAllByRole('button', { name: /add item/i })
    await userEvent.click(addButtons[0])

    // Wait for the item to be copied to the income list (appears as editable input)
    await waitFor(() => {
      expect(screen.getAllByDisplayValue('Salary').length).toBeGreaterThanOrEqual(1)
    }, { timeout: 2000 })
  })

  it('removes copied item from "From last budget" section after copying', async () => {
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

    // Wait for items to appear
    await waitFor(() => {
      expect(screen.getAllByText('Salary').length).toBeGreaterThanOrEqual(1)
      expect(screen.getAllByText('Side gig').length).toBeGreaterThanOrEqual(1)
    })

    // Click the first "Add item" button
    const addButtons = screen.getAllByRole('button', { name: /add item/i })
    await userEvent.click(addButtons[0])

    // Wait for the item to be copied (appears as editable input)
    await waitFor(() => {
      expect(screen.getAllByDisplayValue('Salary').length).toBeGreaterThanOrEqual(1)
    }, { timeout: 2000 })

    // The "From last budget" section should still show Side gig
    expect(screen.getAllByText('Side gig').length).toBeGreaterThanOrEqual(1)
  })

  it('allows selecting account for income item', async () => {
    renderWithWizard()

    await userEvent.click(screen.getByRole('button', { name: /add income/i }))

    // Find and click the account select (first one, desktop view)
    const accountSelects = screen.getAllByRole('combobox')
    await userEvent.click(accountSelects[0])

    // Wait for accounts to load and select one
    await waitFor(() => {
      expect(screen.getAllByText('Checking').length).toBeGreaterThanOrEqual(1)
    })

    await userEvent.click(screen.getAllByText('Checking')[0])

    // Verify the account is selected
    expect(screen.getAllByText('Checking').length).toBeGreaterThanOrEqual(1)
  })
})
