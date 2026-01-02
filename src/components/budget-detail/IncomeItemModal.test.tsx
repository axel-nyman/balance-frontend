import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import { IncomeItemModal } from './IncomeItemModal'
import { server } from '@/test/mocks/server'
import { http, HttpResponse } from 'msw'

describe('IncomeItemModal', () => {
  const defaultProps = {
    budgetId: 'budget-123',
    item: null,
    open: true,
    onOpenChange: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders Add Income title when creating', () => {
    render(<IncomeItemModal {...defaultProps} />)

    expect(screen.getByText('Add Income')).toBeInTheDocument()
  })

  it('renders Edit Income title when editing', () => {
    render(
      <IncomeItemModal
        {...defaultProps}
        item={{ id: '1', name: 'Salary', amount: 50000, bankAccount: { id: '1', name: 'Checking' } }}
      />
    )

    expect(screen.getByText('Edit Income')).toBeInTheDocument()
  })

  it('pre-fills form when editing', () => {
    render(
      <IncomeItemModal
        {...defaultProps}
        item={{ id: '1', name: 'Salary', amount: 50000, bankAccount: { id: '1', name: 'Checking' } }}
      />
    )

    expect(screen.getByDisplayValue('Salary')).toBeInTheDocument()
    expect(screen.getByDisplayValue('50000')).toBeInTheDocument()
  })

  it('shows validation error for empty name', async () => {
    render(<IncomeItemModal {...defaultProps} />)

    await userEvent.click(screen.getByRole('button', { name: /save/i }))

    expect(await screen.findByText(/name is required/i)).toBeInTheDocument()
  })

  it('shows validation error for invalid amount', async () => {
    render(<IncomeItemModal {...defaultProps} />)

    await userEvent.type(screen.getByLabelText(/name/i), 'Test')
    await userEvent.type(screen.getByLabelText(/amount/i), '-100')
    await userEvent.click(screen.getByRole('button', { name: /save/i }))

    expect(await screen.findByText(/must be greater than 0/i)).toBeInTheDocument()
  })

  it('calls API to create income', async () => {
    let requestBody: unknown
    server.use(
      http.post('/api/budgets/budget-123/income', async ({ request }) => {
        requestBody = await request.json()
        return HttpResponse.json({ id: 'new-1' }, { status: 201 })
      })
    )

    const onOpenChange = vi.fn()
    render(<IncomeItemModal {...defaultProps} onOpenChange={onOpenChange} />)

    await userEvent.type(screen.getByLabelText(/name/i), 'Salary')
    await userEvent.type(screen.getByLabelText(/amount/i), '50000')

    // Select account
    await userEvent.click(screen.getByRole('combobox', { name: /account/i }))
    await userEvent.click(screen.getByRole('option', { name: 'Checking' }))

    await userEvent.click(screen.getByRole('button', { name: /save/i }))

    await waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledWith(false)
    })

    expect(requestBody).toEqual({
      name: 'Salary',
      amount: 50000,
      bankAccountId: '1',
    })
  })

  it('calls API to update income', async () => {
    let requestBody: unknown
    server.use(
      http.put('/api/budgets/budget-123/income/1', async ({ request }) => {
        requestBody = await request.json()
        return HttpResponse.json({ id: '1' })
      })
    )

    const onOpenChange = vi.fn()
    render(
      <IncomeItemModal
        {...defaultProps}
        item={{ id: '1', name: 'Salary', amount: 50000, bankAccount: { id: '1', name: 'Checking' } }}
        onOpenChange={onOpenChange}
      />
    )

    await userEvent.clear(screen.getByLabelText(/amount/i))
    await userEvent.type(screen.getByLabelText(/amount/i), '55000')
    await userEvent.click(screen.getByRole('button', { name: /save/i }))

    await waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledWith(false)
    })

    expect(requestBody).toEqual({
      name: 'Salary',
      amount: 55000,
      bankAccountId: '1',
    })
  })

  it('closes on cancel', async () => {
    const onOpenChange = vi.fn()
    render(<IncomeItemModal {...defaultProps} onOpenChange={onOpenChange} />)

    await userEvent.click(screen.getByRole('button', { name: /cancel/i }))

    expect(onOpenChange).toHaveBeenCalledWith(false)
  })
})
