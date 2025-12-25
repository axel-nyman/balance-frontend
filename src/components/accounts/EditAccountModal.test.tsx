import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import { EditAccountModal } from './EditAccountModal'
import type { BankAccount } from '@/api/types'

// Mock the useUpdateAccount hook
vi.mock('@/hooks', () => ({
  useUpdateAccount: () => ({
    mutateAsync: vi.fn().mockResolvedValue({}),
    isPending: false,
    error: null,
  }),
}))

const mockAccount: BankAccount = {
  id: '123',
  name: 'Checking',
  description: 'Main account',
  currentBalance: 5000,
  createdAt: '2025-01-01',
}

describe('EditAccountModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders when account is provided', () => {
    render(<EditAccountModal account={mockAccount} onClose={vi.fn()} />)

    expect(screen.getByText('Edit Account')).toBeInTheDocument()
  })

  it('does not render when account is null', () => {
    render(<EditAccountModal account={null} onClose={vi.fn()} />)

    expect(screen.queryByText('Edit Account')).not.toBeInTheDocument()
  })

  it('pre-fills form with account values', () => {
    render(<EditAccountModal account={mockAccount} onClose={vi.fn()} />)

    expect(screen.getByDisplayValue('Checking')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Main account')).toBeInTheDocument()
  })

  it('does not have balance field', () => {
    render(<EditAccountModal account={mockAccount} onClose={vi.fn()} />)

    expect(screen.queryByLabelText(/balance/i)).not.toBeInTheDocument()
  })

  it('shows validation error when name is cleared', async () => {
    render(<EditAccountModal account={mockAccount} onClose={vi.fn()} />)

    await userEvent.clear(screen.getByLabelText(/name/i))
    await userEvent.click(screen.getByRole('button', { name: /save/i }))

    expect(await screen.findByText(/name is required/i)).toBeInTheDocument()
  })

  it('calls onClose when cancel is clicked', async () => {
    const onClose = vi.fn()
    render(<EditAccountModal account={mockAccount} onClose={onClose} />)

    await userEvent.click(screen.getByRole('button', { name: /cancel/i }))

    expect(onClose).toHaveBeenCalled()
  })

  it('handles account with null description', () => {
    const accountWithNullDescription: BankAccount = {
      ...mockAccount,
      description: null,
    }
    render(<EditAccountModal account={accountWithNullDescription} onClose={vi.fn()} />)

    // Description field should be empty but present
    const descriptionInput = screen.getByLabelText(/description/i)
    expect(descriptionInput).toHaveValue('')
  })
})
