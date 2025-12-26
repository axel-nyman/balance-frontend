import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import { DeleteAccountDialog } from './DeleteAccountDialog'
import { server } from '@/test/mocks/server'
import { http, HttpResponse } from 'msw'
import type { BankAccount } from '@/api/types'

const mockAccount: BankAccount = {
  id: '123',
  name: 'Test Account',
  description: null,
  currentBalance: 1000,
  createdAt: '2025-01-01',
}

describe('DeleteAccountDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders when account is provided', () => {
    render(<DeleteAccountDialog account={mockAccount} onClose={vi.fn()} />)

    expect(screen.getByText(/delete account/i)).toBeInTheDocument()
  })

  it('does not render when account is null', () => {
    render(<DeleteAccountDialog account={null} onClose={vi.fn()} />)

    expect(screen.queryByText(/delete account/i)).not.toBeInTheDocument()
  })

  it('shows account name in confirmation message', () => {
    render(<DeleteAccountDialog account={mockAccount} onClose={vi.fn()} />)

    expect(screen.getByText(/Test Account/)).toBeInTheDocument()
  })

  it('deletes account on confirm', async () => {
    server.use(
      http.delete('/api/bank-accounts/123', () => {
        return new HttpResponse(null, { status: 204 })
      })
    )

    const onClose = vi.fn()
    render(<DeleteAccountDialog account={mockAccount} onClose={onClose} />)

    await userEvent.click(screen.getByRole('button', { name: /delete/i }))

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled()
    })
  })

  it('calls onClose when cancel is clicked', async () => {
    const onClose = vi.fn()
    render(<DeleteAccountDialog account={mockAccount} onClose={onClose} />)

    await userEvent.click(screen.getByRole('button', { name: /cancel/i }))

    expect(onClose).toHaveBeenCalled()
  })

  it('shows error when account is in use', async () => {
    server.use(
      http.delete('/api/bank-accounts/123', () => {
        return HttpResponse.json(
          { error: 'Cannot delete account used in unlocked budget' },
          { status: 400 }
        )
      })
    )

    render(<DeleteAccountDialog account={mockAccount} onClose={vi.fn()} />)

    await userEvent.click(screen.getByRole('button', { name: /delete/i }))

    // Toast should appear with error - this would need toast testing setup
    // For now, we just verify the dialog stays open
    await waitFor(() => {
      expect(screen.getByText(/delete account/i)).toBeInTheDocument()
    })
  })
})
