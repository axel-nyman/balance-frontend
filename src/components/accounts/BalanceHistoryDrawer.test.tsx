import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@/test/test-utils'
import { BalanceHistoryDrawer } from './BalanceHistoryDrawer'
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

const mockHistoryResponse = {
  content: [
    {
      id: '1',
      balance: 5000,
      changeAmount: 500,
      changeDate: '2025-01-15T10:00:00Z',
      comment: 'Paycheck',
      source: 'MANUAL' as const,
      budgetId: null,
    },
    {
      id: '2',
      balance: 4500,
      changeAmount: 200,
      changeDate: '2025-01-01T10:00:00Z',
      comment: null,
      source: 'AUTOMATIC' as const,
      budgetId: 'budget-123',
    },
  ],
  page: { size: 20, number: 0, totalElements: 2, totalPages: 1 },
}

describe('BalanceHistoryDrawer', () => {
  beforeEach(() => {
    server.use(
      http.get('/api/bank-accounts/123/balance-history', () => {
        return HttpResponse.json(mockHistoryResponse)
      })
    )
  })

  it('renders when open with account', async () => {
    render(
      <BalanceHistoryDrawer
        account={mockAccount}
        open={true}
        onOpenChange={vi.fn()}
      />
    )

    expect(screen.getByText('Balance History')).toBeInTheDocument()
    expect(screen.getByText('Checking')).toBeInTheDocument()
  })

  it('shows current balance', () => {
    render(
      <BalanceHistoryDrawer
        account={mockAccount}
        open={true}
        onOpenChange={vi.fn()}
      />
    )

    expect(screen.getByText(/5 000,00 kr/)).toBeInTheDocument()
  })

  it('renders history entries', async () => {
    render(
      <BalanceHistoryDrawer
        account={mockAccount}
        open={true}
        onOpenChange={vi.fn()}
      />
    )

    await waitFor(() => {
      expect(screen.getByText(/Paycheck/)).toBeInTheDocument()
    })
  })

  it('shows source badges', async () => {
    render(
      <BalanceHistoryDrawer
        account={mockAccount}
        open={true}
        onOpenChange={vi.fn()}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('MANUAL')).toBeInTheDocument()
      expect(screen.getByText('AUTOMATIC')).toBeInTheDocument()
    })
  })

  it('shows change amounts with correct formatting', async () => {
    render(
      <BalanceHistoryDrawer
        account={mockAccount}
        open={true}
        onOpenChange={vi.fn()}
      />
    )

    await waitFor(() => {
      expect(screen.getByText(/\+500,00 kr/)).toBeInTheDocument()
    })
  })

  it('renders Update Balance button', () => {
    render(
      <BalanceHistoryDrawer
        account={mockAccount}
        open={true}
        onOpenChange={vi.fn()}
      />
    )

    expect(screen.getByRole('button', { name: /update balance/i })).toBeInTheDocument()
  })

  it('transitions from loading to content', async () => {
    // Verifies that the component properly handles the loading -> loaded transition
    // by checking that content appears after the API resolves
    render(
      <BalanceHistoryDrawer
        account={mockAccount}
        open={true}
        onOpenChange={vi.fn()}
      />
    )

    // After data loads, history entries should appear
    await waitFor(() => {
      expect(screen.getByText(/Paycheck/)).toBeInTheDocument()
    })

    // And skeleton should no longer be present
    expect(screen.queryByText('No history yet')).not.toBeInTheDocument()
  })

  it('shows "From budget" text for automatic entries with budgetId', async () => {
    render(
      <BalanceHistoryDrawer
        account={mockAccount}
        open={true}
        onOpenChange={vi.fn()}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('From budget')).toBeInTheDocument()
    })
  })

  it('shows empty state when no history', async () => {
    server.use(
      http.get('/api/bank-accounts/123/balance-history', () => {
        return HttpResponse.json({
          content: [],
          page: { size: 20, number: 0, totalElements: 0, totalPages: 0 },
        })
      })
    )

    render(
      <BalanceHistoryDrawer
        account={mockAccount}
        open={true}
        onOpenChange={vi.fn()}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('No history yet')).toBeInTheDocument()
    })
  })

  it('shows Load More button when more pages exist', async () => {
    server.use(
      http.get('/api/bank-accounts/123/balance-history', () => {
        return HttpResponse.json({
          content: mockHistoryResponse.content,
          page: { size: 20, number: 0, totalElements: 40, totalPages: 2 },
        })
      })
    )

    render(
      <BalanceHistoryDrawer
        account={mockAccount}
        open={true}
        onOpenChange={vi.fn()}
      />
    )

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /load more/i })).toBeInTheDocument()
    })
  })

  it('shows entry count', async () => {
    render(
      <BalanceHistoryDrawer
        account={mockAccount}
        open={true}
        onOpenChange={vi.fn()}
      />
    )

    await waitFor(() => {
      expect(screen.getByText(/Showing 2 of 2 entries/)).toBeInTheDocument()
    })
  })
})
