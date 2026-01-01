import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, within } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import { WizardProvider } from './WizardContext'
import { WizardShell } from './WizardShell'
import { server } from '@/test/mocks/server'
import { http, HttpResponse } from 'msw'

// Mock useNavigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useBlocker: () => ({ state: 'unblocked', reset: vi.fn(), proceed: vi.fn() }),
  }
})

function renderWizard() {
  return render(
    <WizardProvider>
      <WizardShell />
    </WizardProvider>
  )
}

describe('WizardShell', () => {
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
            { id: '1', name: 'Savings', description: null, currentBalance: 10000, createdAt: '2025-01-01' },
          ],
        })
      })
    )
  })

  it('renders progress header with 0% initially', () => {
    renderWizard()

    expect(screen.getByText('0% complete')).toBeInTheDocument()
  })

  it('starts on step 1 (month section)', () => {
    renderWizard()

    // Check that the month step content is visible
    expect(screen.getByText(/select the month and year/i)).toBeInTheDocument()
  })

  it('shows Continue button on step 1', () => {
    renderWizard()

    expect(screen.getByRole('button', { name: /continue/i })).toBeInTheDocument()
  })

  it('hides Back button on step 1', () => {
    renderWizard()

    expect(screen.queryByRole('button', { name: /back/i })).not.toBeInTheDocument()
  })

  it('advances to step 2 when Continue clicked with valid month', async () => {
    renderWizard()

    // Wait for month to be auto-selected (Next should be enabled)
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /continue/i })).not.toBeDisabled()
    })

    await userEvent.click(screen.getByRole('button', { name: /continue/i }))

    // Check that we're now on Income step - the Income content should be visible
    await waitFor(() => {
      expect(screen.getByText(/add your expected income sources/i)).toBeInTheDocument()
    })
  })

  it('shows Back button on step 2', async () => {
    renderWizard()

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /continue/i })).not.toBeDisabled()
    })

    await userEvent.click(screen.getByRole('button', { name: /continue/i }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument()
    })
  })

  it('goes back to step 1 when Back clicked', async () => {
    renderWizard()

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /continue/i })).not.toBeDisabled()
    })

    await userEvent.click(screen.getByRole('button', { name: /continue/i }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument()
    })

    await userEvent.click(screen.getByRole('button', { name: /back/i }))

    // Check we're back on step 1
    await waitFor(() => {
      expect(screen.getByText(/select the month and year/i)).toBeInTheDocument()
    })
  })

  it('disables Continue on step 2 until income is added', async () => {
    renderWizard()

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /continue/i })).not.toBeDisabled()
    })

    await userEvent.click(screen.getByRole('button', { name: /continue/i }))

    // Now on step 2, Continue should be disabled
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /continue/i })).toBeDisabled()
    })
  })

  it('enables Continue on step 2 after adding valid income', async () => {
    renderWizard()

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /continue/i })).not.toBeDisabled()
    })

    await userEvent.click(screen.getByRole('button', { name: /continue/i }))

    // Wait for income step to be visible, then add income
    await waitFor(() => {
      expect(screen.getByText(/add your expected income sources/i)).toBeInTheDocument()
    })

    // Find the outline button with "Add Income" text (not the section header)
    const addIncomeButton = screen.getByRole('button', { name: /^Add Income$/i })
    await userEvent.click(addIncomeButton)

    const nameInput = screen.getByPlaceholderText(/salary/i)
    await userEvent.type(nameInput, 'My Salary')

    const amountInput = screen.getByPlaceholderText('0')
    await userEvent.type(amountInput, '50000')

    // Select account - get all comboboxes and pick the last one (the income table one)
    // The first ones are month/year selects which are in the DOM but collapsed
    const allComboboxes = screen.getAllByRole('combobox')
    const accountSelect = allComboboxes[allComboboxes.length - 1]
    await userEvent.click(accountSelect)

    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'Savings' })).toBeInTheDocument()
    })
    await userEvent.click(screen.getByRole('option', { name: 'Savings' }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /continue/i })).not.toBeDisabled()
    })
  })

  it('updates progress bar as steps are completed', async () => {
    renderWizard()

    // Initially 0%
    expect(screen.getByText('0% complete')).toBeInTheDocument()

    // Complete step 1
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /continue/i })).not.toBeDisabled()
    })
    await userEvent.click(screen.getByRole('button', { name: /continue/i }))

    // Should be 20% after moving to step 2
    await waitFor(() => {
      expect(screen.getByText('20% complete')).toBeInTheDocument()
    })
  })
})
