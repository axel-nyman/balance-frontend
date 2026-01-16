import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import { WizardProvider } from './WizardContext'
import { WizardShell } from './WizardShell'
import { server } from '@/test/mocks/server'
import { http, HttpResponse } from 'msw'

const mockNavigate = vi.fn()
vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useBlocker: () => ({ state: 'unblocked', reset: vi.fn(), proceed: vi.fn() }),
  }
})

async function addIncomeItem(name: string, amount: string) {
  // Find the outline button with "Add Income" text (not the section header)
  const addIncomeButton = screen.getByRole('button', { name: /^Add Income$/i })
  await userEvent.click(addIncomeButton)

  // Wait for the row to be added
  const nameInput = await screen.findByPlaceholderText(/salary/i)
  await userEvent.type(nameInput, name)

  const amountInput = screen.getByPlaceholderText('0')
  await userEvent.type(amountInput, amount)

  // Select account - get all comboboxes and pick the last one (the income table one)
  // The first ones are month/year selects which are in the DOM but collapsed
  const allComboboxes = screen.getAllByRole('combobox')
  const accountSelect = allComboboxes[allComboboxes.length - 1]
  await userEvent.click(accountSelect)

  // Wait for dropdown to open and select option
  const option = await screen.findByRole('option', { name: 'Savings' })
  await userEvent.click(option)
}

describe('Wizard Integration', () => {
  beforeEach(() => {
    mockNavigate.mockClear()
    server.use(
      http.get('/api/budgets', () => {
        return HttpResponse.json({ budgets: [] })
      }),
      http.get('/api/recurring-expenses', () => {
        return HttpResponse.json({ expenses: [] })
      }),
      http.get('/api/bank-accounts', () => {
        return HttpResponse.json({
          totalBalance: 10000,
          accountCount: 1,
          accounts: [
            { id: 'acc-1', name: 'Savings', description: null, currentBalance: 10000, createdAt: '2025-01-01' },
          ],
        })
      }),
      http.post('/api/budgets', () => {
        return HttpResponse.json({ id: 'new-budget-123' }, { status: 201 })
      }),
      http.post('/api/budgets/:id/income', () => {
        return HttpResponse.json({ id: 'income-1' }, { status: 201 })
      }),
      http.post('/api/budgets/:id/expenses', () => {
        return HttpResponse.json({ id: 'expense-1' }, { status: 201 })
      }),
      http.post('/api/budgets/:id/savings', () => {
        return HttpResponse.json({ id: 'savings-1' }, { status: 201 })
      })
    )
  })

  it('completes full wizard flow and saves budget', async () => {
    render(
      <WizardProvider>
        <WizardShell />
      </WizardProvider>
    )

    // Step 1: Month selection (auto-selected)
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /continue/i })).not.toBeDisabled()
    })
    await userEvent.click(screen.getByRole('button', { name: /continue/i }))

    // Step 2: Income
    await waitFor(() => {
      expect(screen.getByText(/add your expected income sources/i)).toBeInTheDocument()
    })
    await addIncomeItem('Salary', '50000')

    // Verify income was added correctly by checking that continue is enabled
    // This ensures the item has name, amount and account
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /continue/i })).not.toBeDisabled()
    }, { timeout: 3000 })

    // Verify we can see the salary input with the value we entered
    expect(screen.getByDisplayValue('Salary')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /continue/i }))

    // Step 3: Expenses (optional, skip)
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /continue/i })).not.toBeDisabled()
    })
    await userEvent.click(screen.getByRole('button', { name: /continue/i }))

    // Step 4: Savings (optional, skip)
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /continue/i })).not.toBeDisabled()
    })
    await userEvent.click(screen.getByRole('button', { name: /continue/i }))

    // Step 5: Review
    await waitFor(() => {
      expect(screen.getByText(/review and create/i)).toBeInTheDocument()
    })

    // Verify income summary shows 1 item
    expect(screen.getByText('1 income source')).toBeInTheDocument()

    // Expand the Income section to see items (find by role button with exact Income match)
    const allIncomeButtons = screen.getAllByRole('button', { name: /income/i })
    // The last Income button is the collapsible trigger on the Review step
    const incomeCollapsible = allIncomeButtons[allIncomeButtons.length - 1]
    await userEvent.click(incomeCollapsible)

    await waitFor(() => {
      expect(screen.getByText('Salary')).toBeInTheDocument()
    })

    // Check that the formatted amount is displayed (there may be multiple - total and line item)
    expect(screen.getAllByText(/50 000,00 kr/).length).toBeGreaterThan(0)

    // Save
    await userEvent.click(screen.getByRole('button', { name: /create draft/i }))

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/budgets/new-budget-123')
    })
  })

  it('shows error when budget creation fails', async () => {
    server.use(
      http.post('/api/budgets', () => {
        return HttpResponse.json(
          { error: 'Budget already exists for this month' },
          { status: 400 }
        )
      })
    )

    render(
      <WizardProvider>
        <WizardShell />
      </WizardProvider>
    )

    // Navigate to review step
    // Step 1
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /continue/i })).not.toBeDisabled()
    })
    await userEvent.click(screen.getByRole('button', { name: /continue/i }))

    // Step 2: Add income
    await waitFor(() => {
      expect(screen.getByText(/add your expected income sources/i)).toBeInTheDocument()
    })
    await addIncomeItem('Salary', '50000')

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /continue/i })).not.toBeDisabled()
    })
    await userEvent.click(screen.getByRole('button', { name: /continue/i }))

    // Step 3
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /continue/i })).not.toBeDisabled()
    })
    await userEvent.click(screen.getByRole('button', { name: /continue/i }))

    // Step 4
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /continue/i })).not.toBeDisabled()
    })
    await userEvent.click(screen.getByRole('button', { name: /continue/i }))

    // Step 5: Review - save
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /create draft/i })).toBeInTheDocument()
    })
    await userEvent.click(screen.getByRole('button', { name: /create draft/i }))

    // Check that error is displayed (looking for the error message from the API)
    await waitFor(() => {
      expect(screen.getByText(/already exists/i)).toBeInTheDocument()
    })
  })

  it('shows loading state while saving', async () => {
    // Delay the response to test loading state
    server.use(
      http.post('/api/budgets', async () => {
        await new Promise((resolve) => setTimeout(resolve, 100))
        return HttpResponse.json({ id: 'new-budget-123' }, { status: 201 })
      })
    )

    render(
      <WizardProvider>
        <WizardShell />
      </WizardProvider>
    )

    // Navigate through all steps quickly
    // Step 1
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /continue/i })).not.toBeDisabled()
    })
    await userEvent.click(screen.getByRole('button', { name: /continue/i }))

    // Step 2
    await waitFor(() => {
      expect(screen.getByText(/add your expected income sources/i)).toBeInTheDocument()
    })
    await addIncomeItem('Salary', '50000')

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /continue/i })).not.toBeDisabled()
    })
    await userEvent.click(screen.getByRole('button', { name: /continue/i }))

    // Step 3
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /continue/i })).not.toBeDisabled()
    })
    await userEvent.click(screen.getByRole('button', { name: /continue/i }))

    // Step 4
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /continue/i })).not.toBeDisabled()
    })
    await userEvent.click(screen.getByRole('button', { name: /continue/i }))

    // Step 5: Click save
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /create draft/i })).toBeInTheDocument()
    })
    await userEvent.click(screen.getByRole('button', { name: /create draft/i }))

    // Check for loading state
    expect(screen.getByRole('button', { name: /creating/i })).toBeInTheDocument()

    // Wait for completion
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/budgets/new-budget-123')
    })
  })
})
