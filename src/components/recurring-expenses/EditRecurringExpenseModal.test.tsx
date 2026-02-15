import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import { EditRecurringExpenseModal } from './EditRecurringExpenseModal'
import { server } from '@/test/mocks/server'
import { http, HttpResponse } from 'msw'
import type { RecurringExpense } from '@/api/types'

const mockExpense: RecurringExpense = {
  id: '123',
  name: 'Rent',
  amount: 8000,
  recurrenceInterval: 'MONTHLY',
  isManual: true,
  bankAccount: null,
  dueMonth: 3,
  dueYear: 2025,
  dueDisplay: 'March 2025',
  createdAt: '2025-01-01',
}

describe('EditRecurringExpenseModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders when expense is provided', () => {
    render(<EditRecurringExpenseModal expense={mockExpense} onClose={vi.fn()} />)

    expect(screen.getByText('Edit Recurring Expense')).toBeInTheDocument()
  })

  it('does not render when expense is null', () => {
    render(<EditRecurringExpenseModal expense={null} onClose={vi.fn()} />)

    expect(screen.queryByText('Edit Recurring Expense')).not.toBeInTheDocument()
  })

  it('pre-fills form with expense values', () => {
    render(<EditRecurringExpenseModal expense={mockExpense} onClose={vi.fn()} />)

    expect(screen.getByDisplayValue('Rent')).toBeInTheDocument()
    expect(screen.getByDisplayValue('8000')).toBeInTheDocument()
    // The select trigger shows "Monthly" as the selected value
    const selectTrigger = screen.getByLabelText(/interval/i)
    expect(selectTrigger).toHaveTextContent('Monthly')
  })

  it('shows manual checkbox as checked when isManual is true', () => {
    render(<EditRecurringExpenseModal expense={mockExpense} onClose={vi.fn()} />)

    const checkbox = screen.getByRole('checkbox')
    expect(checkbox).toBeChecked()
  })

  it('pre-fills bank account when expense has one', async () => {
    const expenseWithAccount = {
      ...mockExpense,
      bankAccount: { id: '1', name: 'Checking' },
    }
    render(<EditRecurringExpenseModal expense={expenseWithAccount} onClose={vi.fn()} />)

    // The AccountSelect should show "Checking" as the selected value
    // Accounts load asynchronously, so we need to wait for them
    // getAllByText because Radix renders both a visible span and hidden native option
    await waitFor(() => {
      expect(screen.getAllByText('Checking').length).toBeGreaterThanOrEqual(1)
    })
  })

  it('shows next due display value', () => {
    render(<EditRecurringExpenseModal expense={mockExpense} onClose={vi.fn()} />)

    expect(screen.getByText(/next due/i)).toBeInTheDocument()
    expect(screen.getByText('March 2025')).toBeInTheDocument()
  })

  it('shows "Never used" when dueDisplay is null', () => {
    const neverUsedExpense = { ...mockExpense, dueMonth: null, dueYear: null, dueDisplay: null }
    render(<EditRecurringExpenseModal expense={neverUsedExpense} onClose={vi.fn()} />)

    expect(screen.getByText('Never used')).toBeInTheDocument()
  })

  it('submits updated data', async () => {
    let requestBody: unknown
    server.use(
      http.put('/api/recurring-expenses/123', async ({ request }) => {
        requestBody = await request.json()
        return HttpResponse.json({ ...mockExpense, name: 'Updated' })
      })
    )

    const onClose = vi.fn()
    render(<EditRecurringExpenseModal expense={mockExpense} onClose={onClose} />)

    await userEvent.clear(screen.getByLabelText(/name/i))
    await userEvent.type(screen.getByLabelText(/name/i), 'Updated Rent')
    await userEvent.click(screen.getByRole('button', { name: /save/i }))

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled()
    })

    expect(requestBody).toMatchObject({
      name: 'Updated Rent',
    })
  })

  it('calls onClose when cancel is clicked', async () => {
    const onClose = vi.fn()
    render(<EditRecurringExpenseModal expense={mockExpense} onClose={onClose} />)

    await userEvent.click(screen.getByRole('button', { name: /cancel/i }))

    expect(onClose).toHaveBeenCalled()
  })

  it('shows validation error when name is cleared', async () => {
    render(<EditRecurringExpenseModal expense={mockExpense} onClose={vi.fn()} />)

    await userEvent.clear(screen.getByLabelText(/name/i))
    await userEvent.click(screen.getByRole('button', { name: /save/i }))

    expect(await screen.findByText(/name is required/i)).toBeInTheDocument()
  })

  it('shows error message on API failure', async () => {
    server.use(
      http.put('/api/recurring-expenses/123', () => {
        return HttpResponse.json(
          { error: 'Update failed' },
          { status: 400 }
        )
      })
    )

    render(<EditRecurringExpenseModal expense={mockExpense} onClose={vi.fn()} />)

    await userEvent.clear(screen.getByLabelText(/name/i))
    await userEvent.type(screen.getByLabelText(/name/i), 'Updated')
    await userEvent.click(screen.getByRole('button', { name: /save/i }))

    expect(await screen.findByText(/update failed/i)).toBeInTheDocument()
  })

  it('disables submit button while saving', async () => {
    server.use(
      http.put('/api/recurring-expenses/123', async () => {
        await new Promise(resolve => setTimeout(resolve, 100))
        return HttpResponse.json(mockExpense)
      })
    )

    render(<EditRecurringExpenseModal expense={mockExpense} onClose={vi.fn()} />)

    await userEvent.click(screen.getByRole('button', { name: /save/i }))

    expect(screen.getByRole('button', { name: /saving/i })).toBeDisabled()
  })
})
