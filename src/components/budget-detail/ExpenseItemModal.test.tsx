import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import { ExpenseItemModal } from './ExpenseItemModal'
import { server } from '@/test/mocks/server'
import { http, HttpResponse } from 'msw'

describe('ExpenseItemModal', () => {
  const defaultProps = {
    budgetId: 'budget-123',
    item: null,
    open: true,
    onOpenChange: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders Add Expense title when creating', () => {
    render(<ExpenseItemModal {...defaultProps} />)

    expect(screen.getByText('Add Expense')).toBeInTheDocument()
  })

  it('renders Edit Expense title when editing', () => {
    render(
      <ExpenseItemModal
        {...defaultProps}
        item={{
          id: '1',
          name: 'Rent',
          amount: 8000,
          bankAccount: { id: '1', name: 'Checking' },
          recurringExpenseId: null,
          deductedAt: null,
          isManual: false,
        }}
      />
    )

    expect(screen.getByText('Edit Expense')).toBeInTheDocument()
  })

  it('pre-fills form when editing', () => {
    render(
      <ExpenseItemModal
        {...defaultProps}
        item={{
          id: '1',
          name: 'Rent',
          amount: 8000,
          bankAccount: { id: '1', name: 'Checking' },
          recurringExpenseId: null,
          deductedAt: null,
          isManual: true,
        }}
      />
    )

    expect(screen.getByDisplayValue('Rent')).toBeInTheDocument()
    expect(screen.getByDisplayValue('8000')).toBeInTheDocument()
    expect(screen.getByRole('checkbox')).toBeChecked()
  })

  it('shows validation error for empty name', async () => {
    render(<ExpenseItemModal {...defaultProps} />)

    await userEvent.click(screen.getByRole('button', { name: /save/i }))

    expect(await screen.findByText(/name is required/i)).toBeInTheDocument()
  })

  it('shows validation error for invalid amount', async () => {
    render(<ExpenseItemModal {...defaultProps} />)

    await userEvent.type(screen.getByLabelText(/name/i), 'Test')
    await userEvent.type(screen.getByLabelText(/amount/i), '-100')
    await userEvent.click(screen.getByRole('button', { name: /save/i }))

    expect(await screen.findByText(/must be greater than 0/i)).toBeInTheDocument()
  })

  it('calls API to create expense', async () => {
    let requestBody: unknown
    server.use(
      http.post('/api/budgets/budget-123/expenses', async ({ request }) => {
        requestBody = await request.json()
        return HttpResponse.json({ id: 'new-1' }, { status: 201 })
      })
    )

    const onOpenChange = vi.fn()
    render(<ExpenseItemModal {...defaultProps} onOpenChange={onOpenChange} />)

    await userEvent.type(screen.getByLabelText(/name/i), 'Groceries')
    await userEvent.type(screen.getByLabelText(/amount/i), '5000')

    // Select account
    await userEvent.click(screen.getByRole('combobox', { name: /account/i }))
    await userEvent.click(screen.getByRole('option', { name: 'Checking' }))

    await userEvent.click(screen.getByRole('button', { name: /save/i }))

    await waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledWith(false)
    })

    expect(requestBody).toEqual({
      name: 'Groceries',
      amount: 5000,
      bankAccountId: '1',
      isManual: false,
    })
  })

  it('calls API to update expense', async () => {
    let requestBody: unknown
    server.use(
      http.put('/api/budgets/budget-123/expenses/1', async ({ request }) => {
        requestBody = await request.json()
        return HttpResponse.json({ id: '1' })
      })
    )

    const onOpenChange = vi.fn()
    render(
      <ExpenseItemModal
        {...defaultProps}
        item={{
          id: '1',
          name: 'Rent',
          amount: 8000,
          bankAccount: { id: '1', name: 'Checking' },
          recurringExpenseId: null,
          deductedAt: null,
          isManual: false,
        }}
        onOpenChange={onOpenChange}
      />
    )

    await userEvent.clear(screen.getByLabelText(/amount/i))
    await userEvent.type(screen.getByLabelText(/amount/i), '8500')
    await userEvent.click(screen.getByRole('button', { name: /save/i }))

    await waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledWith(false)
    })

    expect(requestBody).toEqual({
      name: 'Rent',
      amount: 8500,
      bankAccountId: '1',
      isManual: false,
    })
  })

  it('closes on cancel', async () => {
    const onOpenChange = vi.fn()
    render(<ExpenseItemModal {...defaultProps} onOpenChange={onOpenChange} />)

    await userEvent.click(screen.getByRole('button', { name: /cancel/i }))

    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('toggles manual payment checkbox', async () => {
    render(<ExpenseItemModal {...defaultProps} />)

    const checkbox = screen.getByRole('checkbox')
    expect(checkbox).not.toBeChecked()

    await userEvent.click(checkbox)
    expect(checkbox).toBeChecked()
  })
})
