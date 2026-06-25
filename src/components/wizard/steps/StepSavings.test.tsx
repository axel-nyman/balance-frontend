import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import { WizardProvider, useWizard } from '../WizardContext'
import { StepSavings } from './StepSavings'
import { server } from '@/test/mocks/server'
import { http, HttpResponse } from 'msw'
import { useEffect } from 'react'

// Helper to set up wizard state with income/expenses
function WizardWithState({ children }: { children: React.ReactNode }) {
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
    dispatch({
      type: 'SET_EXPENSE_ITEMS',
      items: [
        {
          id: '1',
          name: 'Rent',
          amount: 20000,
          bankAccountId: 'acc-1',
          bankAccountName: 'Checking',
          isManual: false,
        },
      ],
    })
  }, [dispatch])

  return <>{children}</>
}

function renderWithWizard(withState = false) {
  if (withState) {
    return render(
      <WizardProvider>
        <WizardWithState>
          <StepSavings />
        </WizardWithState>
      </WizardProvider>
    )
  }
  return render(
    <WizardProvider>
      <StepSavings />
    </WizardProvider>
  )
}

describe('StepSavings', () => {
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
            {
              id: 'acc-1',
              name: 'Checking',
              description: null,
              currentBalance: 5000,
              createdAt: '2025-01-01',
            },
            {
              id: 'acc-2',
              name: 'Savings Account',
              description: null,
              currentBalance: 5000,
              createdAt: '2025-01-01',
            },
          ],
        })
      })
    )
  })

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

  it('renders savings table with headers', async () => {
    renderWithWizard()

    // Wait for accounts to load (table only appears when accounts exist)
    await waitFor(() => {
      expect(screen.getByText('Name')).toBeInTheDocument()
    })

    expect(screen.getByText('Account')).toBeInTheDocument()
    expect(screen.getByText('Goal')).toBeInTheDocument()
    expect(screen.getByText('Amount')).toBeInTheDocument()
  })

  it('persists a selected goal on the savings item', async () => {
    mockGoals()
    renderWithWizard()

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /add savings/i })
      ).toBeInTheDocument()
    })

    await userEvent.click(screen.getByRole('button', { name: /add savings/i }))

    // Row comboboxes are [account, goal]; pick a goal on the second one.
    await userEvent.click(screen.getAllByRole('combobox')[1])
    await userEvent.click(await screen.findByRole('option', { name: 'Vacation' }))

    // The goal select now reflects the persisted link.
    expect(screen.getByRole('combobox', { name: /goal/i })).toHaveTextContent(
      'Vacation'
    )
  })

  it('shows empty state message when no items', async () => {
    renderWithWizard()

    await waitFor(() => {
      expect(screen.getAllByText(/no savings planned/i).length).toBeGreaterThanOrEqual(1)
    })
  })

  it('shows running balance summary', async () => {
    renderWithWizard(true)

    await waitFor(() => {
      expect(screen.getByText('Income')).toBeInTheDocument()
      expect(screen.getByText('Expenses')).toBeInTheDocument()
      // Use getAllByText since 'Savings' appears both in heading and summary
      expect(screen.getAllByText('Savings').length).toBeGreaterThanOrEqual(1)
      expect(screen.getByText('Remaining')).toBeInTheDocument()
    })
  })

  it('calculates remaining balance correctly', async () => {
    renderWithWizard(true)

    // Income 50000 - Expenses 20000 - Savings 0 = 30000 remaining
    await waitFor(() => {
      expect(screen.getByText(/30 000,00 kr/)).toBeInTheDocument()
    })
  })

  it('adds savings item when add button clicked', async () => {
    renderWithWizard()

    // Wait for accounts to load
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /add savings/i })
      ).toBeInTheDocument()
    })

    await userEvent.click(screen.getByRole('button', { name: /add savings/i }))

    expect(screen.getByPlaceholderText(/emergency fund/i)).toBeInTheDocument()
  })

  it('allows editing savings name', async () => {
    renderWithWizard()

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /add savings/i })
      ).toBeInTheDocument()
    })

    await userEvent.click(screen.getByRole('button', { name: /add savings/i }))

    const nameInput = screen.getByPlaceholderText(/emergency fund/i)
    await userEvent.type(nameInput, 'Vacation Fund')

    expect(nameInput).toHaveValue('Vacation Fund')
  })

  it('allows editing savings amount', async () => {
    renderWithWizard()

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /add savings/i })
      ).toBeInTheDocument()
    })

    await userEvent.click(screen.getByRole('button', { name: /add savings/i }))

    const amountInput = screen.getByPlaceholderText('0')
    await userEvent.type(amountInput, '5000')

    expect(amountInput).toHaveValue(5000)
  })

  it('removes savings item when delete clicked', async () => {
    renderWithWizard()

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /add savings/i })
      ).toBeInTheDocument()
    })

    await userEvent.click(screen.getByRole('button', { name: /add savings/i }))
    expect(screen.getByPlaceholderText(/emergency fund/i)).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /remove/i }))

    expect(
      screen.queryByPlaceholderText(/emergency fund/i)
    ).not.toBeInTheDocument()
  })

  it('shows total savings', async () => {
    renderWithWizard()

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /add savings/i })
      ).toBeInTheDocument()
    })

    await userEvent.click(screen.getByRole('button', { name: /add savings/i }))
    const amountInput = screen.getByPlaceholderText('0')
    await userEvent.type(amountInput, '5000')

    // Wait for total to appear in table footer
    await waitFor(() => {
      const totals = screen.getAllByText(/5 000,00 kr/)
      expect(totals.length).toBeGreaterThanOrEqual(1)
    })
  })

  it('shows account dropdown with available accounts', async () => {
    renderWithWizard()

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /add savings/i })
      ).toBeInTheDocument()
    })

    await userEvent.click(screen.getByRole('button', { name: /add savings/i }))

    // First combobox in the row is the account select (goal select follows).
    const accountSelect = screen.getAllByRole('combobox')[0]
    await userEvent.click(accountSelect)

    await waitFor(() => {
      expect(screen.getByText('Checking')).toBeInTheDocument()
      expect(screen.getByText('Savings Account')).toBeInTheDocument()
    })
  })

  it('allows selecting account for savings item', async () => {
    renderWithWizard()

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /add savings/i })
      ).toBeInTheDocument()
    })

    await userEvent.click(screen.getByRole('button', { name: /add savings/i }))

    const accountSelects = screen.getAllByRole('combobox')
    await userEvent.click(accountSelects[0])

    await waitFor(() => {
      expect(screen.getAllByText('Savings Account').length).toBeGreaterThanOrEqual(1)
    })

    await userEvent.click(screen.getAllByText('Savings Account')[0])

    expect(screen.getAllByText('Savings Account').length).toBeGreaterThanOrEqual(1)
  })

  it('shows warning when no accounts exist', async () => {
    server.use(
      http.get('/api/bank-accounts', () => {
        return HttpResponse.json({
          totalBalance: 0,
          accountCount: 0,
          accounts: [],
        })
      })
    )

    renderWithWizard()

    await waitFor(() => {
      expect(screen.getByText(/no bank accounts found/i)).toBeInTheDocument()
    })
  })

  it('shows warning when balance goes negative', async () => {
    renderWithWizard(true)

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /add savings/i })
      ).toBeInTheDocument()
    })

    // Add savings that exceeds remaining balance (30000)
    await userEvent.click(screen.getByRole('button', { name: /add savings/i }))

    const amountInput = screen.getByPlaceholderText('0')
    await userEvent.type(amountInput, '40000')

    await waitFor(() => {
      expect(screen.getByText(/exceed/i)).toBeInTheDocument()
    })
  })

  it('allows using same account for multiple savings items', async () => {
    renderWithWizard()

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /add savings/i })
      ).toBeInTheDocument()
    })

    // Add first savings item and select an account
    await userEvent.click(screen.getByRole('button', { name: /add savings/i }))
    // Each row has an account select then a goal select, so the account
    // select for the first row is the first combobox.
    const firstSelect = screen.getAllByRole('combobox')[0]
    await userEvent.click(firstSelect)
    await waitFor(() => {
      expect(screen.getByText('Savings Account')).toBeInTheDocument()
    })
    await userEvent.click(screen.getByText('Savings Account'))

    // Add second savings item
    await userEvent.click(screen.getByRole('button', { name: /add savings/i }))

    // Comboboxes are now [account1, goal1, account2, goal2]; the second row's
    // account select is index 2.
    const selects = screen.getAllByRole('combobox')
    await userEvent.click(selects[2])

    await waitFor(() => {
      // Both accounts should be available in the dropdown
      expect(screen.getByText('Checking')).toBeInTheDocument()
      // Savings Account appears twice: once in the first (already selected) and once in dropdown options
      expect(screen.getAllByText('Savings Account').length).toBeGreaterThanOrEqual(2)
    })
  })

  it('shows copy from last budget section when budget exists', async () => {
    server.use(
      http.get('/api/budgets', () => {
        return HttpResponse.json({
          budgets: [
            {
              id: 'budget-1',
              month: 1,
              year: 2025,
              status: 'LOCKED',
              totals: { income: 50000, expenses: 20000, savings: 5000, balance: 25000 },
            },
          ],
        })
      }),
      http.get('/api/budgets/budget-1', () => {
        return HttpResponse.json({
          id: 'budget-1',
          month: 1,
          year: 2025,
          status: 'LOCKED',
          income: [],
          expenses: [],
          savings: [
            {
              id: 'sav-1',
              name: 'Emergency Fund',
              amount: 5000,
              bankAccount: { id: 'acc-2', name: 'Savings Account' },
            },
          ],
          totals: { income: 50000, expenses: 20000, savings: 5000, balance: 25000 },
        })
      })
    )

    renderWithWizard()

    await waitFor(() => {
      expect(screen.getAllByText(/from last budget/i).length).toBeGreaterThanOrEqual(1)
      expect(screen.getAllByText('Emergency Fund').length).toBeGreaterThanOrEqual(1)
    })
  })

  it('copies savings item from last budget when clicked', async () => {
    server.use(
      http.get('/api/budgets', () => {
        return HttpResponse.json({
          budgets: [
            {
              id: 'budget-1',
              month: 1,
              year: 2025,
              status: 'LOCKED',
              totals: { income: 50000, expenses: 20000, savings: 5000, balance: 25000 },
            },
          ],
        })
      }),
      http.get('/api/budgets/budget-1', () => {
        return HttpResponse.json({
          id: 'budget-1',
          month: 1,
          year: 2025,
          status: 'LOCKED',
          income: [],
          expenses: [],
          savings: [
            {
              id: 'sav-1',
              name: 'Emergency Fund',
              amount: 5000,
              bankAccount: { id: 'acc-2', name: 'Savings Account' },
            },
          ],
          totals: { income: 50000, expenses: 20000, savings: 5000, balance: 25000 },
        })
      })
    )

    renderWithWizard()

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /add emergency fund/i })).toBeInTheDocument()
    })

    await userEvent.click(screen.getByRole('button', { name: /add emergency fund/i }))

    await waitFor(() => {
      expect(screen.getByDisplayValue('Emergency Fund')).toBeInTheDocument()
      expect(screen.getByDisplayValue('5000')).toBeInTheDocument()
    })
  })

  it('removes copied item from list after copying', async () => {
    server.use(
      http.get('/api/budgets', () => {
        return HttpResponse.json({
          budgets: [
            {
              id: 'budget-1',
              month: 1,
              year: 2025,
              status: 'LOCKED',
              totals: { income: 50000, expenses: 20000, savings: 5000, balance: 25000 },
            },
          ],
        })
      }),
      http.get('/api/budgets/budget-1', () => {
        return HttpResponse.json({
          id: 'budget-1',
          month: 1,
          year: 2025,
          status: 'LOCKED',
          income: [],
          expenses: [],
          savings: [
            {
              id: 'sav-1',
              name: 'Emergency Fund',
              amount: 5000,
              bankAccount: { id: 'acc-2', name: 'Savings Account' },
            },
          ],
          totals: { income: 50000, expenses: 20000, savings: 5000, balance: 25000 },
        })
      })
    )

    renderWithWizard()

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /add emergency fund/i })).toBeInTheDocument()
    })

    await userEvent.click(screen.getByRole('button', { name: /add emergency fund/i }))

    // Wait for animation to complete and item to be removed
    await waitFor(
      () => {
        expect(
          screen.queryByRole('button', { name: /add emergency fund/i })
        ).not.toBeInTheDocument()
      },
      { timeout: 1000 }
    )
  })

  it('does not show copy section when no previous budgets', async () => {
    renderWithWizard()

    // Wait for data to load
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /add savings/i })
      ).toBeInTheDocument()
    })

    expect(screen.queryByText(/from last budget/i)).not.toBeInTheDocument()
  })

  it('filters out savings with non-existent accounts', async () => {
    server.use(
      http.get('/api/budgets', () => {
        return HttpResponse.json({
          budgets: [
            {
              id: 'budget-1',
              month: 1,
              year: 2025,
              status: 'LOCKED',
              totals: { income: 50000, expenses: 20000, savings: 5000, balance: 25000 },
            },
          ],
        })
      }),
      http.get('/api/budgets/budget-1', () => {
        return HttpResponse.json({
          id: 'budget-1',
          month: 1,
          year: 2025,
          status: 'LOCKED',
          income: [],
          expenses: [],
          savings: [
            {
              id: 'sav-1',
              name: 'Old Fund',
              amount: 5000,
              bankAccount: { id: 'deleted-account', name: 'Deleted Account' },
            },
          ],
          totals: { income: 50000, expenses: 20000, savings: 5000, balance: 25000 },
        })
      })
    )

    renderWithWizard()

    // Wait for data to load
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /add savings/i })
      ).toBeInTheDocument()
    })

    // The "from last budget" section should not appear since the account doesn't exist
    expect(screen.queryByText(/from last budget/i)).not.toBeInTheDocument()
  })
})
