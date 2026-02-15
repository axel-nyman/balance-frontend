import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import { DeleteRecurringExpenseDialog } from './DeleteRecurringExpenseDialog'
import { server } from '@/test/mocks/server'
import { http, HttpResponse } from 'msw'
import type { RecurringExpense } from '@/api/types'

const mockExpense: RecurringExpense = {
  id: '123',
  name: 'Netflix',
  amount: 169,
  recurrenceInterval: 'MONTHLY',
  isManual: false,
  bankAccount: null,
  dueMonth: 3,
  dueYear: 2025,
  dueDisplay: 'March 2025',
  createdAt: '2025-01-01',
}

describe('DeleteRecurringExpenseDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders when expense is provided', () => {
    render(<DeleteRecurringExpenseDialog expense={mockExpense} onClose={vi.fn()} />)

    expect(screen.getByText(/delete recurring expense/i)).toBeInTheDocument()
  })

  it('does not render when expense is null', () => {
    render(<DeleteRecurringExpenseDialog expense={null} onClose={vi.fn()} />)

    expect(screen.queryByText(/delete recurring expense/i)).not.toBeInTheDocument()
  })

  it('shows expense name in confirmation message', () => {
    render(<DeleteRecurringExpenseDialog expense={mockExpense} onClose={vi.fn()} />)

    expect(screen.getByText(/Netflix/)).toBeInTheDocument()
  })

  it('mentions that existing expenses are not affected', () => {
    render(<DeleteRecurringExpenseDialog expense={mockExpense} onClose={vi.fn()} />)

    expect(screen.getByText(/will not affect/i)).toBeInTheDocument()
  })

  it('deletes expense on confirm', async () => {
    server.use(
      http.delete('/api/recurring-expenses/123', () => {
        return new HttpResponse(null, { status: 204 })
      })
    )

    const onClose = vi.fn()
    render(<DeleteRecurringExpenseDialog expense={mockExpense} onClose={onClose} />)

    await userEvent.click(screen.getByRole('button', { name: /delete/i }))

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled()
    })
  })

  it('calls onClose when cancel is clicked', async () => {
    const onClose = vi.fn()
    render(<DeleteRecurringExpenseDialog expense={mockExpense} onClose={onClose} />)

    await userEvent.click(screen.getByRole('button', { name: /cancel/i }))

    expect(onClose).toHaveBeenCalled()
  })
})
