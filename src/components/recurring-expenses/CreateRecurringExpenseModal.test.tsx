import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import { CreateRecurringExpenseModal } from './CreateRecurringExpenseModal'
import { server } from '@/test/mocks/server'
import { http, HttpResponse } from 'msw'

describe('CreateRecurringExpenseModal', () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders form fields when open', () => {
    render(<CreateRecurringExpenseModal {...defaultProps} />)

    expect(screen.getByLabelText(/name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/amount/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/interval/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/manual payment/i)).toBeInTheDocument()
  })

  it('does not render when closed', () => {
    render(<CreateRecurringExpenseModal {...defaultProps} open={false} />)

    expect(screen.queryByLabelText(/name/i)).not.toBeInTheDocument()
  })

  it('shows validation error when name is empty', async () => {
    render(<CreateRecurringExpenseModal {...defaultProps} />)

    await userEvent.click(screen.getByRole('button', { name: /create/i }))

    expect(await screen.findByText(/name is required/i)).toBeInTheDocument()
  })

  it('shows validation error for invalid amount', async () => {
    render(<CreateRecurringExpenseModal {...defaultProps} />)

    await userEvent.type(screen.getByLabelText(/name/i), 'Test')
    await userEvent.type(screen.getByLabelText(/amount/i), '-100')
    await userEvent.click(screen.getByRole('button', { name: /create/i }))

    expect(await screen.findByText(/must be greater than 0/i)).toBeInTheDocument()
  })

  it('defaults interval to Monthly', () => {
    render(<CreateRecurringExpenseModal {...defaultProps} />)

    // The select trigger shows "Monthly" as the selected value
    const selectTrigger = screen.getByRole('combobox')
    expect(selectTrigger).toHaveTextContent('Monthly')
  })

  it('submits form with valid data', async () => {
    let requestBody: unknown
    server.use(
      http.post('/api/recurring-expenses', async ({ request }) => {
        requestBody = await request.json()
        return HttpResponse.json({ id: '123', name: 'Rent' }, { status: 201 })
      })
    )

    const onOpenChange = vi.fn()
    render(<CreateRecurringExpenseModal open={true} onOpenChange={onOpenChange} />)

    await userEvent.type(screen.getByLabelText(/name/i), 'Rent')
    await userEvent.type(screen.getByLabelText(/amount/i), '8000')
    await userEvent.click(screen.getByLabelText(/manual payment/i))
    await userEvent.click(screen.getByRole('button', { name: /create/i }))

    await waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledWith(false)
    })

    expect(requestBody).toEqual({
      name: 'Rent',
      amount: 8000,
      recurrenceInterval: 'MONTHLY',
      isManual: true,
    })
  })

  it('allows selecting different intervals', async () => {
    render(<CreateRecurringExpenseModal {...defaultProps} />)

    await userEvent.click(screen.getByRole('combobox'))
    // Click the option in the dropdown (role="option")
    await userEvent.click(screen.getByRole('option', { name: 'Yearly' }))

    // The select trigger should now show "Yearly"
    const selectTrigger = screen.getByRole('combobox')
    expect(selectTrigger).toHaveTextContent('Yearly')
  })

  it('shows error message on API failure', async () => {
    server.use(
      http.post('/api/recurring-expenses', () => {
        return HttpResponse.json(
          { error: 'Recurring expense with this name already exists' },
          { status: 400 }
        )
      })
    )

    render(<CreateRecurringExpenseModal {...defaultProps} />)

    await userEvent.type(screen.getByLabelText(/name/i), 'Existing')
    await userEvent.type(screen.getByLabelText(/amount/i), '100')
    await userEvent.click(screen.getByRole('button', { name: /create/i }))

    expect(await screen.findByText(/already exists/i)).toBeInTheDocument()
  })

  it('closes modal when cancel is clicked', async () => {
    const onOpenChange = vi.fn()
    render(<CreateRecurringExpenseModal open={true} onOpenChange={onOpenChange} />)

    await userEvent.click(screen.getByRole('button', { name: /cancel/i }))

    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('disables submit button while submitting', async () => {
    server.use(
      http.post('/api/recurring-expenses', async () => {
        await new Promise(resolve => setTimeout(resolve, 100))
        return HttpResponse.json({ id: '123' }, { status: 201 })
      })
    )

    render(<CreateRecurringExpenseModal {...defaultProps} />)

    await userEvent.type(screen.getByLabelText(/name/i), 'Test')
    await userEvent.type(screen.getByLabelText(/amount/i), '100')
    await userEvent.click(screen.getByRole('button', { name: /create/i }))

    expect(screen.getByRole('button', { name: /creating/i })).toBeDisabled()
  })
})
