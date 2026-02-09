import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import { RecurringExpensesList } from './RecurringExpensesList'
import type { RecurringExpense } from '@/api/types'

const mockExpenses: RecurringExpense[] = [
  {
    id: '1',
    name: 'Rent',
    amount: 8000,
    recurrenceInterval: 'MONTHLY',
    isManual: true,
    bankAccount: { id: '1', name: 'Checking' },
    lastUsedDate: '2025-01-01',
    nextDueDate: '2025-02-01',
    isDue: true,
    createdAt: '2025-01-01',
  },
  {
    id: '2',
    name: 'Car Insurance',
    amount: 3000,
    recurrenceInterval: 'BIANNUALLY',
    isManual: false,
    bankAccount: null,
    lastUsedDate: '2025-01-01',
    nextDueDate: '2025-07-01',
    isDue: false,
    createdAt: '2025-01-01',
  },
  {
    id: '3',
    name: 'New Subscription',
    amount: 100,
    recurrenceInterval: 'MONTHLY',
    isManual: false,
    bankAccount: null,
    lastUsedDate: null,
    nextDueDate: null,
    isDue: false,
    createdAt: '2025-01-01',
  },
]

const defaultProps = {
  expenses: mockExpenses,
  isLoading: false,
  isError: false,
  onRetry: vi.fn(),
  onEdit: vi.fn(),
  onDelete: vi.fn(),
  onCreateNew: vi.fn(),
}

describe('RecurringExpensesList', () => {
  it('renders loading state', () => {
    render(<RecurringExpensesList {...defaultProps} isLoading={true} expenses={[]} />)

    expect(screen.queryByText('Rent')).not.toBeInTheDocument()
  })

  it('renders error state with retry button', async () => {
    const onRetry = vi.fn()
    render(<RecurringExpensesList {...defaultProps} isError={true} expenses={[]} onRetry={onRetry} />)

    expect(screen.getByText(/failed to load/i)).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /try again/i }))
    expect(onRetry).toHaveBeenCalled()
  })

  it('renders empty state when no expenses', () => {
    render(<RecurringExpensesList {...defaultProps} expenses={[]} />)

    expect(screen.getByText(/no recurring expenses yet/i)).toBeInTheDocument()
  })

  it('renders empty state with create button', async () => {
    const onCreateNew = vi.fn()
    render(<RecurringExpensesList {...defaultProps} expenses={[]} onCreateNew={onCreateNew} />)

    await userEvent.click(screen.getByRole('button', { name: /create recurring expense/i }))
    expect(onCreateNew).toHaveBeenCalled()
  })

  // Note: Both desktop table and mobile cards are rendered in DOM (CSS hides one),
  // so we use getAllByText for tests that check rendered content
  it('renders expense names', () => {
    render(<RecurringExpensesList {...defaultProps} />)

    // Each name appears twice (table row + mobile card)
    expect(screen.getAllByText('Rent')).toHaveLength(2)
    expect(screen.getAllByText('Car Insurance')).toHaveLength(2)
    expect(screen.getAllByText('New Subscription')).toHaveLength(2)
  })

  it('renders expense amounts', () => {
    render(<RecurringExpensesList {...defaultProps} />)

    // Amounts appear in both views
    expect(screen.getAllByText(/8 000,00 kr/)).toHaveLength(2)
    expect(screen.getAllByText(/3 000,00 kr/)).toHaveLength(2)
  })

  it('renders interval labels', () => {
    render(<RecurringExpensesList {...defaultProps} />)

    // Table view has interval in separate td, mobile cards include it in combined text
    // Table: 2 Monthly items, 1 Biannually item
    // Mobile cards have combined text like "8 000,00 kr • Monthly"
    expect(screen.getAllByText('Monthly')).toHaveLength(2) // Table rows only
    expect(screen.getAllByText('Biannually')).toHaveLength(1) // Table row only
    // Mobile cards combine amount with interval
    expect(screen.getAllByText(/Monthly/)).toHaveLength(4) // 2 table + 2 mobile
  })

  it('shows due status indicators', () => {
    render(<RecurringExpensesList {...defaultProps} />)

    // Due status appears in both views
    expect(screen.getAllByText(/due now/i)).toHaveLength(2)
    expect(screen.getAllByText(/never used/i)).toHaveLength(2)
  })

  it('sorts due items first', () => {
    render(<RecurringExpensesList {...defaultProps} />)

    const rows = screen.getAllByRole('row')
    // First data row (after header) should be the due item
    expect(rows[1]).toHaveTextContent('Rent')
  })

  it('calls onEdit when edit button is clicked', async () => {
    const onEdit = vi.fn()
    render(<RecurringExpensesList {...defaultProps} onEdit={onEdit} />)

    const editButtons = screen.getAllByRole('button', { name: /edit/i })
    await userEvent.click(editButtons[0])

    expect(onEdit).toHaveBeenCalled()
  })

  it('shows bank account name in table', () => {
    render(<RecurringExpensesList {...defaultProps} />)

    // "Checking" appears in both desktop table and mobile card for the first expense
    expect(screen.getAllByText('Checking').length).toBeGreaterThanOrEqual(1)
  })

  it('shows em-dash for expenses without bank account', () => {
    render(<RecurringExpensesList {...defaultProps} />)

    // Em-dash appears for expenses without a bank account (Car Insurance and New Subscription)
    const dashes = screen.getAllByText('—')
    expect(dashes.length).toBeGreaterThanOrEqual(2)
  })

  it('calls onDelete when delete button is clicked', async () => {
    const onDelete = vi.fn()
    render(<RecurringExpensesList {...defaultProps} onDelete={onDelete} />)

    const deleteButtons = screen.getAllByRole('button', { name: /delete/i })
    await userEvent.click(deleteButtons[0])

    expect(onDelete).toHaveBeenCalled()
  })

})
