import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import { UpdateBalanceModal } from './UpdateBalanceModal'
import { server } from '@/test/mocks/server'
import { http, HttpResponse } from 'msw'
import type { BankAccount } from '@/api/types'

const mockAccount: BankAccount = {
  id: '123',
  name: 'Checking',
  description: 'Main account',
  currentBalance: 5000,
  createdAt: '2025-01-01',
}

describe('UpdateBalanceModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders when open', () => {
    render(
      <UpdateBalanceModal
        account={mockAccount}
        open={true}
        onOpenChange={vi.fn()}
      />
    )

    expect(screen.getByText('Update Balance')).toBeInTheDocument()
  })

  it('shows account name and current balance', () => {
    render(
      <UpdateBalanceModal
        account={mockAccount}
        open={true}
        onOpenChange={vi.fn()}
      />
    )

    expect(screen.getByText('Checking')).toBeInTheDocument()
    expect(screen.getByText(/5 000,00 kr/)).toBeInTheDocument()
  })

  it('has form fields', () => {
    render(
      <UpdateBalanceModal
        account={mockAccount}
        open={true}
        onOpenChange={vi.fn()}
      />
    )

    expect(screen.getByLabelText(/new balance/i)).toBeInTheDocument()
    expect(screen.getByLabelText('Date *')).toBeInTheDocument()
    expect(screen.getByLabelText(/comment/i)).toBeInTheDocument()
  })

  it('defaults date to today', () => {
    render(
      <UpdateBalanceModal
        account={mockAccount}
        open={true}
        onOpenChange={vi.fn()}
      />
    )

    const dateInput = screen.getByLabelText('Date *') as HTMLInputElement
    const today = new Date().toISOString().split('T')[0]
    expect(dateInput.value).toBe(today)
  })

  it('submits valid form data', async () => {
    let requestBody: unknown
    server.use(
      http.post('/api/bank-accounts/123/balance', async ({ request }) => {
        requestBody = await request.json()
        return HttpResponse.json({
          id: '123',
          currentBalance: 6000,
          previousBalance: 5000,
          changeAmount: 1000,
        })
      })
    )

    const onOpenChange = vi.fn()
    render(
      <UpdateBalanceModal
        account={mockAccount}
        open={true}
        onOpenChange={onOpenChange}
      />
    )

    await userEvent.clear(screen.getByLabelText(/new balance/i))
    await userEvent.type(screen.getByLabelText(/new balance/i), '6000')
    await userEvent.type(screen.getByLabelText(/comment/i), 'Test update')
    await userEvent.click(screen.getByRole('button', { name: /update/i }))

    await waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledWith(false)
    })

    expect(requestBody).toMatchObject({
      newBalance: 6000,
      comment: 'Test update',
    })
    // Verify date is in YYYY-MM-DD format (no time component)
    expect((requestBody as { date: string }).date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('shows error for API error response', async () => {
    server.use(
      http.post('/api/bank-accounts/123/balance', () => {
        return HttpResponse.json(
          { error: 'Date cannot be in the future' },
          { status: 403 }
        )
      })
    )

    render(
      <UpdateBalanceModal
        account={mockAccount}
        open={true}
        onOpenChange={vi.fn()}
      />
    )

    await userEvent.click(screen.getByRole('button', { name: /update/i }))

    await waitFor(() => {
      expect(screen.getByText(/cannot be in the future/i)).toBeInTheDocument()
    })
  })
})
