import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import { WizardProvider, useWizard } from '../WizardContext'
import { StepReview } from './StepReview'
import { useEffect, useState } from 'react'

// Helper to set up wizard state with full budget data
function WizardWithFullState({ children }: { children: React.ReactNode }) {
  const { dispatch } = useWizard()

  useEffect(() => {
    dispatch({ type: 'SET_MONTH_YEAR', month: 3, year: 2025 })
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
        {
          id: '2',
          name: 'Bonus',
          amount: 5000,
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
          amount: 8000,
          bankAccountId: 'acc-1',
          bankAccountName: 'Checking',
          isManual: true,
        },
        {
          id: '2',
          name: 'Groceries',
          amount: 5000,
          bankAccountId: 'acc-1',
          bankAccountName: 'Checking',
          isManual: false,
        },
      ],
    })
    dispatch({
      type: 'SET_SAVINGS_ITEMS',
      items: [
        {
          id: '1',
          name: 'Emergency Fund',
          amount: 10000,
          bankAccountId: 'acc-2',
          bankAccountName: 'Savings Account',
        },
      ],
    })
  }, [dispatch])

  return <>{children}</>
}

// Wrapper component to manage lockAfterSave state
function StepReviewWrapper() {
  const [lockAfterSave, setLockAfterSave] = useState(false)
  return (
    <StepReview
      lockAfterSave={lockAfterSave}
      onLockAfterSaveChange={setLockAfterSave}
    />
  )
}

function renderWithWizard() {
  return render(
    <WizardProvider>
      <WizardWithFullState>
        <StepReviewWrapper />
      </WizardWithFullState>
    </WizardProvider>
  )
}

// Helper for empty state
function WizardWithEmptyState({ children }: { children: React.ReactNode }) {
  const { dispatch } = useWizard()

  useEffect(() => {
    dispatch({ type: 'SET_MONTH_YEAR', month: 3, year: 2025 })
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

function renderWithEmptyState() {
  return render(
    <WizardProvider>
      <WizardWithEmptyState>
        <StepReviewWrapper />
      </WizardWithEmptyState>
    </WizardProvider>
  )
}

// Helper for negative balance state
function WizardWithNegativeBalance({ children }: { children: React.ReactNode }) {
  const { dispatch } = useWizard()

  useEffect(() => {
    dispatch({ type: 'SET_MONTH_YEAR', month: 3, year: 2025 })
    dispatch({
      type: 'SET_INCOME_ITEMS',
      items: [
        {
          id: '1',
          name: 'Salary',
          amount: 30000,
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
          amount: 40000,
          bankAccountId: 'acc-1',
          bankAccountName: 'Checking',
          isManual: true,
        },
      ],
    })
  }, [dispatch])

  return <>{children}</>
}

function renderWithNegativeBalance() {
  return render(
    <WizardProvider>
      <WizardWithNegativeBalance>
        <StepReviewWrapper />
      </WizardWithNegativeBalance>
    </WizardProvider>
  )
}

describe('StepReview', () => {
  it('shows budget month and year', async () => {
    renderWithWizard()

    await waitFor(() => {
      expect(screen.getByText(/mars 2025/i)).toBeInTheDocument()
    })
  })

  it('shows income section with total', async () => {
    renderWithWizard()

    await waitFor(() => {
      expect(screen.getByText('Income')).toBeInTheDocument()
      // 50000 + 5000 = 55000
      expect(screen.getByText(/55 000,00 kr/)).toBeInTheDocument()
    })
  })

  it('shows expense section with total', async () => {
    renderWithWizard()

    await waitFor(() => {
      expect(screen.getByText('Expenses')).toBeInTheDocument()
      // 8000 + 5000 = 13000
      expect(screen.getByText(/13 000,00 kr/)).toBeInTheDocument()
    })
  })

  it('shows savings section with total', async () => {
    renderWithWizard()

    await waitFor(() => {
      expect(screen.getByText('Savings')).toBeInTheDocument()
      // 10 000,00 kr appears twice (section total and individual item)
      expect(screen.getAllByText(/10 000,00 kr/).length).toBeGreaterThanOrEqual(1)
    })
  })

  it('calculates and shows remaining balance', async () => {
    renderWithWizard()

    await waitFor(() => {
      // 55000 - 13000 - 10000 = 32000
      expect(screen.getByText(/32 000,00 kr/)).toBeInTheDocument()
    })
  })

  it('shows income items when expanded', async () => {
    renderWithWizard()

    // Sections are collapsed by default, expand income section
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /income/i })).toBeInTheDocument()
    })
    await userEvent.click(screen.getByRole('button', { name: /income/i }))

    await waitFor(() => {
      expect(screen.getByText('Salary')).toBeInTheDocument()
      expect(screen.getByText('Bonus')).toBeInTheDocument()
    })
  })

  it('shows expense items when expanded', async () => {
    renderWithWizard()

    // Sections are collapsed by default, expand expenses section
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /expenses/i })).toBeInTheDocument()
    })
    await userEvent.click(screen.getByRole('button', { name: /expenses/i }))

    await waitFor(() => {
      expect(screen.getByText('Rent')).toBeInTheDocument()
      expect(screen.getByText('Groceries')).toBeInTheDocument()
    })
  })

  it('shows savings items when expanded', async () => {
    renderWithWizard()

    // Sections are collapsed by default, expand savings section
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /savings/i })).toBeInTheDocument()
    })
    await userEvent.click(screen.getByRole('button', { name: /savings/i }))

    await waitFor(() => {
      expect(screen.getByText('Emergency Fund')).toBeInTheDocument()
    })
  })

  it('shows bank account names for items', async () => {
    renderWithWizard()

    // Expand income section to see account names
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /income/i })).toBeInTheDocument()
    })
    await userEvent.click(screen.getByRole('button', { name: /income/i }))

    await waitFor(() => {
      // Checking appears for income items
      expect(screen.getAllByText('Checking').length).toBeGreaterThanOrEqual(1)
    })

    // Expand savings section to see Savings Account
    await userEvent.click(screen.getByRole('button', { name: /savings/i }))

    await waitFor(() => {
      expect(screen.getByText('Savings Account')).toBeInTheDocument()
    })
  })

  it('has lock after save checkbox', async () => {
    renderWithWizard()

    await waitFor(() => {
      expect(screen.getByLabelText(/lock budget/i)).toBeInTheDocument()
    })
  })

  it('can toggle lock after save checkbox', async () => {
    renderWithWizard()

    await waitFor(() => {
      expect(screen.getByLabelText(/lock budget/i)).toBeInTheDocument()
    })

    const checkbox = screen.getByLabelText(/lock budget/i)
    expect(checkbox).not.toBeChecked()

    await userEvent.click(checkbox)
    expect(checkbox).toBeChecked()

    await userEvent.click(checkbox)
    expect(checkbox).not.toBeChecked()
  })

  it('can toggle collapsible sections', async () => {
    renderWithWizard()

    // Sections start collapsed by default
    await waitFor(() => {
      const incomeButton = screen.getByRole('button', { name: /income/i })
      expect(incomeButton).toHaveAttribute('aria-expanded', 'false')
    })

    // Click to expand income section
    await userEvent.click(screen.getByRole('button', { name: /income/i }))

    // The collapsible should be expanded now
    await waitFor(() => {
      const incomeButton = screen.getByRole('button', { name: /income/i })
      expect(incomeButton).toHaveAttribute('aria-expanded', 'true')
    })

    // Click again to collapse
    await userEvent.click(screen.getByRole('button', { name: /income/i }))

    await waitFor(() => {
      const incomeButton = screen.getByRole('button', { name: /income/i })
      expect(incomeButton).toHaveAttribute('aria-expanded', 'false')
    })
  })

  it('shows empty state for expenses when none added', async () => {
    renderWithEmptyState()

    // Expand expenses section to see empty state
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /expenses/i })).toBeInTheDocument()
    })
    await userEvent.click(screen.getByRole('button', { name: /expenses/i }))

    await waitFor(() => {
      expect(screen.getByText(/no expenses added/i)).toBeInTheDocument()
    })
  })

  it('shows empty state for savings when none added', async () => {
    renderWithEmptyState()

    // Expand savings section to see empty state
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /savings/i })).toBeInTheDocument()
    })
    await userEvent.click(screen.getByRole('button', { name: /savings/i }))

    await waitFor(() => {
      expect(screen.getByText(/no savings planned/i)).toBeInTheDocument()
    })
  })

  it('shows warning for negative balance', async () => {
    renderWithNegativeBalance()

    await waitFor(() => {
      expect(screen.getByText(/exceed your income/i)).toBeInTheDocument()
    })
  })

  it('shows unallocated income warning for positive balance', async () => {
    renderWithWizard()

    await waitFor(() => {
      expect(screen.getByText(/unallocated income/i)).toBeInTheDocument()
    })
  })

  it('shows item count for each section', async () => {
    renderWithWizard()

    await waitFor(() => {
      // Income and Expenses both have 2 items
      const twoItemsCounts = screen.getAllByText('(2 items)')
      expect(twoItemsCounts.length).toBe(2)
      // Savings has 1 item
      expect(screen.getByText('(1 items)')).toBeInTheDocument()
    })
  })

  it('shows lock description text', async () => {
    renderWithWizard()

    await waitFor(() => {
      expect(screen.getByText(/applies savings to account balances/i)).toBeInTheDocument()
    })
  })

  it('displays remaining balance label', async () => {
    renderWithWizard()

    await waitFor(() => {
      expect(screen.getByText('Remaining Balance')).toBeInTheDocument()
    })
  })
})
