import { describe, it, expect } from 'vitest'
import { render, screen } from '@/test/test-utils'
import { TodoProgress } from './TodoProgress'
import type { TodoItem } from '@/api/types'

const createItem = (status: 'PENDING' | 'COMPLETED'): TodoItem => ({
  id: crypto.randomUUID(),
  type: 'PAYMENT',
  name: 'Test Payment',
  amount: 100,
  status,
  fromAccount: { id: 'acc-1', name: 'Main Account' },
  toAccount: null,
  completedAt: status === 'COMPLETED' ? '2025-03-15T10:30:00Z' : null,
  createdAt: '2025-03-01T00:00:00Z',
})

describe('TodoProgress', () => {
  it('shows completion count', () => {
    const items = [
      createItem('COMPLETED'),
      createItem('PENDING'),
      createItem('PENDING'),
    ]

    render(<TodoProgress items={items} />)

    expect(screen.getByText(/1 of 3 completed/i)).toBeInTheDocument()
  })

  it('shows percentage', () => {
    const items = [
      createItem('COMPLETED'),
      createItem('COMPLETED'),
      createItem('PENDING'),
      createItem('PENDING'),
    ]

    render(<TodoProgress items={items} />)

    expect(screen.getByText('50%')).toBeInTheDocument()
  })

  it('shows 0% when no items completed', () => {
    const items = [
      createItem('PENDING'),
      createItem('PENDING'),
    ]

    render(<TodoProgress items={items} />)

    expect(screen.getByText('0%')).toBeInTheDocument()
  })

  it('shows 100% when all items completed', () => {
    const items = [
      createItem('COMPLETED'),
      createItem('COMPLETED'),
    ]

    render(<TodoProgress items={items} />)

    expect(screen.getByText('100%')).toBeInTheDocument()
  })

  it('handles empty items array', () => {
    render(<TodoProgress items={[]} />)

    expect(screen.getByText(/0 of 0 completed/i)).toBeInTheDocument()
    expect(screen.getByText('0%')).toBeInTheDocument()
  })

  it('applies green styling when complete', () => {
    const items = [
      createItem('COMPLETED'),
      createItem('COMPLETED'),
    ]

    const { container } = render(<TodoProgress items={items} />)

    expect(container.querySelector('.text-green-600')).toBeInTheDocument()
  })
})
