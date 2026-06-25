import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import { SavingsItemModal } from './SavingsItemModal'
import { server } from '@/test/mocks/server'
import { http, HttpResponse } from 'msw'

describe('SavingsItemModal', () => {
  const defaultProps = {
    budgetId: 'budget-123',
    item: null,
    open: true,
    onOpenChange: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders Add Savings title when creating', () => {
    render(<SavingsItemModal {...defaultProps} />)

    expect(screen.getByText('Add Savings')).toBeInTheDocument()
  })

  it('renders Edit Savings title when editing', () => {
    render(
      <SavingsItemModal
        {...defaultProps}
        item={{ id: '1', name: 'Emergency Fund', amount: 5000, bankAccount: { id: '1', name: 'Savings' }, savingsGoalId: null }}
      />
    )

    expect(screen.getByText('Edit Savings')).toBeInTheDocument()
  })

  it('pre-fills form when editing', () => {
    render(
      <SavingsItemModal
        {...defaultProps}
        item={{ id: '1', name: 'Emergency Fund', amount: 5000, bankAccount: { id: '1', name: 'Savings' }, savingsGoalId: null }}
      />
    )

    expect(screen.getByDisplayValue('Emergency Fund')).toBeInTheDocument()
    expect(screen.getByDisplayValue('5000')).toBeInTheDocument()
  })

  it('shows validation error for empty name', async () => {
    render(<SavingsItemModal {...defaultProps} />)

    await userEvent.click(screen.getByRole('button', { name: /save/i }))

    expect(await screen.findByText(/name is required/i)).toBeInTheDocument()
  })

  it('shows validation error for invalid amount', async () => {
    render(<SavingsItemModal {...defaultProps} />)

    await userEvent.type(screen.getByLabelText(/name/i), 'Test')
    await userEvent.type(screen.getByLabelText(/amount/i), '-100')
    await userEvent.click(screen.getByRole('button', { name: /save/i }))

    expect(await screen.findByText(/must be greater than 0/i)).toBeInTheDocument()
  })

  it('calls API to create savings', async () => {
    let requestBody: unknown
    server.use(
      http.post('/api/budgets/budget-123/savings', async ({ request }) => {
        requestBody = await request.json()
        return HttpResponse.json({ id: 'new-1' }, { status: 201 })
      })
    )

    const onOpenChange = vi.fn()
    render(<SavingsItemModal {...defaultProps} onOpenChange={onOpenChange} />)

    await userEvent.type(screen.getByLabelText(/name/i), 'Emergency Fund')
    await userEvent.type(screen.getByLabelText(/amount/i), '5000')

    // Select account
    await userEvent.click(screen.getByRole('combobox', { name: /account/i }))
    await userEvent.click(screen.getByRole('option', { name: 'Checking' }))

    await userEvent.click(screen.getByRole('button', { name: /save/i }))

    await waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledWith(false)
    })

    expect(requestBody).toEqual({
      name: 'Emergency Fund',
      amount: 5000,
      bankAccountId: '1',
    })
  })

  it('calls API to update savings', async () => {
    let requestBody: unknown
    server.use(
      http.put('/api/budgets/budget-123/savings/1', async ({ request }) => {
        requestBody = await request.json()
        return HttpResponse.json({ id: '1' })
      })
    )

    const onOpenChange = vi.fn()
    render(
      <SavingsItemModal
        {...defaultProps}
        item={{ id: '1', name: 'Emergency Fund', amount: 5000, bankAccount: { id: '1', name: 'Savings' }, savingsGoalId: null }}
        onOpenChange={onOpenChange}
      />
    )

    await userEvent.clear(screen.getByLabelText(/amount/i))
    await userEvent.type(screen.getByLabelText(/amount/i), '6000')
    await userEvent.click(screen.getByRole('button', { name: /save/i }))

    await waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledWith(false)
    })

    expect(requestBody).toEqual({
      name: 'Emergency Fund',
      amount: 6000,
      bankAccountId: '1',
    })
  })

  it('closes on cancel', async () => {
    const onOpenChange = vi.fn()
    render(<SavingsItemModal {...defaultProps} onOpenChange={onOpenChange} />)

    await userEvent.click(screen.getByRole('button', { name: /cancel/i }))

    expect(onOpenChange).toHaveBeenCalledWith(false)
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

  it('sends savingsGoalId when a goal is selected', async () => {
    mockGoals()
    let requestBody: unknown
    server.use(
      http.post('/api/budgets/budget-123/savings', async ({ request }) => {
        requestBody = await request.json()
        return HttpResponse.json({ id: 'new-1' }, { status: 201 })
      })
    )

    const onOpenChange = vi.fn()
    render(<SavingsItemModal {...defaultProps} onOpenChange={onOpenChange} />)

    await userEvent.type(screen.getByLabelText(/name/i), 'Trip')
    await userEvent.type(screen.getByLabelText(/amount/i), '500')
    await userEvent.click(screen.getByRole('combobox', { name: /account/i }))
    await userEvent.click(screen.getByRole('option', { name: 'Checking' }))

    await userEvent.click(screen.getByRole('combobox', { name: /goal/i }))
    await userEvent.click(await screen.findByRole('option', { name: 'Vacation' }))

    await userEvent.click(screen.getByRole('button', { name: /save/i }))

    await waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledWith(false)
    })

    expect(requestBody).toEqual({
      name: 'Trip',
      amount: 500,
      bankAccountId: '1',
      savingsGoalId: 'goal-1',
    })
  })

  it('omits savingsGoalId when no goal is selected', async () => {
    mockGoals()
    let requestBody: unknown
    server.use(
      http.post('/api/budgets/budget-123/savings', async ({ request }) => {
        requestBody = await request.json()
        return HttpResponse.json({ id: 'new-1' }, { status: 201 })
      })
    )

    render(<SavingsItemModal {...defaultProps} />)

    await userEvent.type(screen.getByLabelText(/name/i), 'Trip')
    await userEvent.type(screen.getByLabelText(/amount/i), '500')
    await userEvent.click(screen.getByRole('combobox', { name: /account/i }))
    await userEvent.click(screen.getByRole('option', { name: 'Checking' }))

    await userEvent.click(screen.getByRole('button', { name: /save/i }))

    await waitFor(() => {
      expect(requestBody).toEqual({
        name: 'Trip',
        amount: 500,
        bankAccountId: '1',
      })
    })
  })

  it('keeps the linked goal when editing without changing it', async () => {
    mockGoals()
    let requestBody: unknown
    server.use(
      http.put('/api/budgets/budget-123/savings/1', async ({ request }) => {
        requestBody = await request.json()
        return HttpResponse.json({ id: '1' })
      })
    )

    render(
      <SavingsItemModal
        {...defaultProps}
        item={{
          id: '1',
          name: 'Trip',
          amount: 500,
          bankAccount: { id: '1', name: 'Savings' },
          savingsGoalId: 'goal-1',
        }}
      />
    )

    await userEvent.click(screen.getByRole('button', { name: /save/i }))

    await waitFor(() => {
      expect(requestBody).toEqual({
        name: 'Trip',
        amount: 500,
        bankAccountId: '1',
        savingsGoalId: 'goal-1',
      })
    })
  })

  it('unlinks the goal when switched back to No goal on update', async () => {
    mockGoals()
    let requestBody: unknown
    server.use(
      http.put('/api/budgets/budget-123/savings/1', async ({ request }) => {
        requestBody = await request.json()
        return HttpResponse.json({ id: '1' })
      })
    )

    render(
      <SavingsItemModal
        {...defaultProps}
        item={{
          id: '1',
          name: 'Trip',
          amount: 500,
          bankAccount: { id: '1', name: 'Savings' },
          savingsGoalId: 'goal-1',
        }}
      />
    )

    await userEvent.click(await screen.findByRole('combobox', { name: /goal/i }))
    await userEvent.click(await screen.findByRole('option', { name: 'No goal' }))
    await userEvent.click(screen.getByRole('button', { name: /save/i }))

    await waitFor(() => {
      expect(requestBody).toEqual({
        name: 'Trip',
        amount: 500,
        bankAccountId: '1',
      })
    })
  })
})
