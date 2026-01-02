import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import { DeleteItemDialog } from './DeleteItemDialog'
import { server } from '@/test/mocks/server'
import { http, HttpResponse } from 'msw'

describe('DeleteItemDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders when itemId is provided', () => {
    render(
      <DeleteItemDialog
        budgetId="budget-123"
        itemId="item-1"
        itemName="Salary"
        itemType="income"
        onClose={vi.fn()}
      />
    )

    expect(screen.getByText(/delete income/i)).toBeInTheDocument()
  })

  it('does not render when itemId is null', () => {
    render(
      <DeleteItemDialog
        budgetId="budget-123"
        itemId={null}
        itemName="Salary"
        itemType="income"
        onClose={vi.fn()}
      />
    )

    expect(screen.queryByText(/delete income/i)).not.toBeInTheDocument()
  })

  it('shows item name in confirmation', () => {
    render(
      <DeleteItemDialog
        budgetId="budget-123"
        itemId="item-1"
        itemName="Rent"
        itemType="expense"
        onClose={vi.fn()}
      />
    )

    expect(screen.getByText(/Rent/)).toBeInTheDocument()
  })

  it('deletes income item', async () => {
    server.use(
      http.delete('/api/budgets/budget-123/income/item-1', () => {
        return new HttpResponse(null, { status: 204 })
      })
    )

    const onClose = vi.fn()
    render(
      <DeleteItemDialog
        budgetId="budget-123"
        itemId="item-1"
        itemName="Salary"
        itemType="income"
        onClose={onClose}
      />
    )

    await userEvent.click(screen.getByRole('button', { name: /delete/i }))

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled()
    })
  })

  it('deletes expense item', async () => {
    server.use(
      http.delete('/api/budgets/budget-123/expenses/item-1', () => {
        return new HttpResponse(null, { status: 204 })
      })
    )

    const onClose = vi.fn()
    render(
      <DeleteItemDialog
        budgetId="budget-123"
        itemId="item-1"
        itemName="Rent"
        itemType="expense"
        onClose={onClose}
      />
    )

    await userEvent.click(screen.getByRole('button', { name: /delete/i }))

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled()
    })
  })

  it('deletes savings item', async () => {
    server.use(
      http.delete('/api/budgets/budget-123/savings/item-1', () => {
        return new HttpResponse(null, { status: 204 })
      })
    )

    const onClose = vi.fn()
    render(
      <DeleteItemDialog
        budgetId="budget-123"
        itemId="item-1"
        itemName="Emergency Fund"
        itemType="savings"
        onClose={onClose}
      />
    )

    await userEvent.click(screen.getByRole('button', { name: /delete/i }))

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled()
    })
  })

  it('calls onClose when cancel is clicked', async () => {
    const onClose = vi.fn()
    render(
      <DeleteItemDialog
        budgetId="budget-123"
        itemId="item-1"
        itemName="Salary"
        itemType="income"
        onClose={onClose}
      />
    )

    await userEvent.click(screen.getByRole('button', { name: /cancel/i }))

    expect(onClose).toHaveBeenCalled()
  })
})
