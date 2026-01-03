import { describe, it, expect } from 'vitest'
import { render, screen } from '@/test/test-utils'
import { TodoItemList } from './TodoItemList'
import type { TodoItem } from '@/api/types'

const mockItems: TodoItem[] = [
  {
    id: 'todo-1',
    type: 'PAYMENT',
    name: 'Pay Rent',
    amount: 8000,
    status: 'PENDING',
    fromAccount: { id: 'acc-main', name: 'Main Account' },
    toAccount: null,
    completedAt: null,
    createdAt: '2025-03-01T00:00:00Z',
  },
  {
    id: 'todo-2',
    type: 'PAYMENT',
    name: 'Pay Insurance',
    amount: 500,
    status: 'COMPLETED',
    fromAccount: { id: 'acc-main', name: 'Main Account' },
    toAccount: null,
    completedAt: '2025-03-15T10:30:00Z',
    createdAt: '2025-03-01T00:00:00Z',
  },
  {
    id: 'todo-3',
    type: 'TRANSFER',
    name: 'Transfer to Savings',
    amount: 5000,
    status: 'PENDING',
    fromAccount: { id: 'acc-main', name: 'Main Account' },
    toAccount: { id: 'acc-savings', name: 'Savings Account' },
    completedAt: null,
    createdAt: '2025-03-01T00:00:00Z',
  },
]

describe('TodoItemList', () => {
  it('renders payment items under Payments section', () => {
    render(<TodoItemList budgetId="123" items={mockItems} />)

    expect(screen.getByText('Payments')).toBeInTheDocument()
    expect(screen.getByText('Pay Rent')).toBeInTheDocument()
    expect(screen.getByText('Pay Insurance')).toBeInTheDocument()
  })

  it('renders transfer items under Transfers section', () => {
    render(<TodoItemList budgetId="123" items={mockItems} />)

    expect(screen.getByText('Transfers')).toBeInTheDocument()
    expect(screen.getByText('Transfer to Savings')).toBeInTheDocument()
  })

  it('shows destination account for transfer items', () => {
    render(<TodoItemList budgetId="123" items={mockItems} />)

    expect(screen.getByText(/to: savings account/i)).toBeInTheDocument()
  })

  it('shows amounts for all items', () => {
    render(<TodoItemList budgetId="123" items={mockItems} />)

    expect(screen.getByText(/8 000,00 kr/)).toBeInTheDocument()
    expect(screen.getByText(/500,00 kr/)).toBeInTheDocument()
    expect(screen.getByText(/5 000,00 kr/)).toBeInTheDocument()
  })

  it('does not show Payments section when no payments', () => {
    const transfersOnly = mockItems.filter((item) => item.type === 'TRANSFER')
    render(<TodoItemList budgetId="123" items={transfersOnly} />)

    expect(screen.queryByText('Payments')).not.toBeInTheDocument()
    expect(screen.getByText('Transfers')).toBeInTheDocument()
  })

  it('does not show Transfers section when no transfers', () => {
    const paymentsOnly = mockItems.filter((item) => item.type === 'PAYMENT')
    render(<TodoItemList budgetId="123" items={paymentsOnly} />)

    expect(screen.getByText('Payments')).toBeInTheDocument()
    expect(screen.queryByText('Transfers')).not.toBeInTheDocument()
  })
})
