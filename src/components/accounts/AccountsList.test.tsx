import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import { AccountsList } from './AccountsList'
import type { BankAccount } from '@/api/types'

const mockAccounts: BankAccount[] = [
  { id: '1', name: 'Checking', description: 'Main account', currentBalance: 5000, createdAt: '2025-01-01' },
  { id: '2', name: 'Savings', description: null, currentBalance: 10000, createdAt: '2025-01-01' },
]

const defaultProps = {
  accounts: mockAccounts,
  isLoading: false,
  isError: false,
  onRetry: vi.fn(),
  onEdit: vi.fn(),
  onDelete: vi.fn(),
  onClick: vi.fn(),
  onCreateNew: vi.fn(),
}

describe('AccountsList', () => {
  it('renders loading state', () => {
    render(<AccountsList {...defaultProps} isLoading={true} accounts={[]} />)

    expect(screen.queryByText('Checking')).not.toBeInTheDocument()
  })

  it('renders error state with retry button', async () => {
    const onRetry = vi.fn()
    render(<AccountsList {...defaultProps} isError={true} accounts={[]} onRetry={onRetry} />)

    expect(screen.getByText(/failed to load/i)).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /try again/i }))
    expect(onRetry).toHaveBeenCalled()
  })

  it('renders empty state when no accounts', () => {
    render(<AccountsList {...defaultProps} accounts={[]} />)

    expect(screen.getByText(/no accounts yet/i)).toBeInTheDocument()
  })

  it('renders empty state with create button', async () => {
    const onCreateNew = vi.fn()
    render(<AccountsList {...defaultProps} accounts={[]} onCreateNew={onCreateNew} />)

    await userEvent.click(screen.getByRole('button', { name: /create account/i }))
    expect(onCreateNew).toHaveBeenCalled()
  })

  it('renders account names', () => {
    render(<AccountsList {...defaultProps} />)

    // Both desktop and mobile views render, so we expect 2 of each
    expect(screen.getAllByText('Checking')).toHaveLength(2)
    expect(screen.getAllByText('Savings')).toHaveLength(2)
  })

  it('renders account balances', () => {
    render(<AccountsList {...defaultProps} />)

    // Both desktop and mobile views render, so we expect 2 of each
    expect(screen.getAllByText(/5 000,00 kr/)).toHaveLength(2)
    expect(screen.getAllByText(/10 000,00 kr/)).toHaveLength(2)
  })

  it('calls onClick when account row is clicked', async () => {
    const onClick = vi.fn()
    render(<AccountsList {...defaultProps} onClick={onClick} />)

    // Click the first occurrence (desktop table row)
    const checkingElements = screen.getAllByText('Checking')
    await userEvent.click(checkingElements[0])

    expect(onClick).toHaveBeenCalledWith(mockAccounts[0])
  })

  it('calls onEdit when edit button is clicked', async () => {
    const onEdit = vi.fn()
    render(<AccountsList {...defaultProps} onEdit={onEdit} />)

    // There are 4 edit buttons total (2 accounts x 2 views)
    const editButtons = screen.getAllByRole('button', { name: /edit checking/i })
    await userEvent.click(editButtons[0])

    expect(onEdit).toHaveBeenCalledWith(mockAccounts[0])
  })

  it('calls onDelete when delete button is clicked', async () => {
    const onDelete = vi.fn()
    render(<AccountsList {...defaultProps} onDelete={onDelete} />)

    // There are 4 delete buttons total (2 accounts x 2 views)
    const deleteButtons = screen.getAllByRole('button', { name: /delete checking/i })
    await userEvent.click(deleteButtons[0])

    expect(onDelete).toHaveBeenCalledWith(mockAccounts[0])
  })

  it('edit button click does not trigger row click', async () => {
    const onClick = vi.fn()
    const onEdit = vi.fn()
    render(<AccountsList {...defaultProps} onClick={onClick} onEdit={onEdit} />)

    const editButtons = screen.getAllByRole('button', { name: /edit checking/i })
    await userEvent.click(editButtons[0])

    expect(onEdit).toHaveBeenCalled()
    expect(onClick).not.toHaveBeenCalled()
  })
})
