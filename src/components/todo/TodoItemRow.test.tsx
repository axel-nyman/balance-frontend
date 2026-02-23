import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import { TodoItemRow } from './TodoItemRow'
import { server } from '@/test/mocks/server'
import { http, HttpResponse } from 'msw'
import type { TodoItem } from '@/api/types'

const pendingPayment: TodoItem = {
  id: 'todo-1',
  type: 'PAYMENT',
  name: 'Pay Rent',
  amount: 8000,
  status: 'PENDING',
  fromAccount: { id: 'acc-main', name: 'Main Account' },
  toAccount: null,
  completedAt: null,
  createdAt: '2025-03-01T00:00:00Z',
}

const completedTransfer: TodoItem = {
  id: 'todo-2',
  type: 'TRANSFER',
  name: 'Transfer to Savings',
  amount: 5000,
  status: 'COMPLETED',
  fromAccount: { id: 'acc-main', name: 'Main Account' },
  toAccount: { id: 'acc-savings', name: 'Savings Account' },
  completedAt: '2025-03-15T10:30:00Z',
  createdAt: '2025-03-01T00:00:00Z',
}

describe('TodoItemRow', () => {
  beforeEach(() => {
    server.use(
      http.put('/api/budgets/:budgetId/todo-list/items/:itemId', () => {
        return HttpResponse.json(pendingPayment)
      })
    )
  })

  it('renders item name', () => {
    render(<TodoItemRow budgetId="123" item={pendingPayment} />)

    expect(screen.getByText('Rent')).toBeInTheDocument()
  })

  it('renders item amount', () => {
    render(<TodoItemRow budgetId="123" item={pendingPayment} />)

    expect(screen.getByText(/8 000 kr/)).toBeInTheDocument()
  })

  it('shows unchecked checkbox for pending items', () => {
    render(<TodoItemRow budgetId="123" item={pendingPayment} />)

    const checkbox = screen.getByRole('checkbox')
    expect(checkbox).not.toBeChecked()
  })

  it('shows checked checkbox for completed items', () => {
    render(<TodoItemRow budgetId="123" item={completedTransfer} />)

    const checkbox = screen.getByRole('checkbox')
    expect(checkbox).toBeChecked()
  })

  it('applies strikethrough to completed items', () => {
    render(<TodoItemRow budgetId="123" item={completedTransfer} />)

    const name = screen.getByText('Main Account → Savings Account')
    expect(name).toHaveClass('line-through')
  })

  it('shows transfer as from → to format', () => {
    render(<TodoItemRow budgetId="123" item={completedTransfer} />)

    expect(screen.getByText(/Main Account → Savings Account/)).toBeInTheDocument()
  })

  it('calls API when checkbox toggled', async () => {
    let requestBody: unknown
    server.use(
      http.put('/api/budgets/123/todo-list/items/todo-1', async ({ request }) => {
        requestBody = await request.json()
        return HttpResponse.json({ ...pendingPayment, status: 'COMPLETED' })
      })
    )

    render(<TodoItemRow budgetId="123" item={pendingPayment} />)

    await userEvent.click(screen.getByRole('checkbox'))

    await waitFor(() => {
      expect(requestBody).toEqual({ status: 'COMPLETED' })
    })
  })

  it('shows update balance button for completed transfers', () => {
    const onUpdateBalance = vi.fn()
    render(
      <TodoItemRow
        budgetId="123"
        item={completedTransfer}
        onUpdateBalance={onUpdateBalance}
      />
    )

    expect(screen.getByTitle(/update account balance/i)).toBeInTheDocument()
  })

  it('does not show update balance button for pending transfers', () => {
    const pendingTransfer = { ...completedTransfer, status: 'PENDING' as const, completedAt: null }
    render(
      <TodoItemRow
        budgetId="123"
        item={pendingTransfer}
        onUpdateBalance={vi.fn()}
      />
    )

    expect(screen.queryByTitle(/update account balance/i)).not.toBeInTheDocument()
  })

  it('calls onUpdateBalance when balance button clicked', async () => {
    const onUpdateBalance = vi.fn()
    render(
      <TodoItemRow
        budgetId="123"
        item={completedTransfer}
        onUpdateBalance={onUpdateBalance}
      />
    )

    await userEvent.click(screen.getByTitle(/update account balance/i))

    expect(onUpdateBalance).toHaveBeenCalled()
  })
})
