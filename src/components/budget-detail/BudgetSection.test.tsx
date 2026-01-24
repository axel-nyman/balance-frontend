import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import { BudgetSection } from './BudgetSection'

const mockItems = [
  { id: '1', label: 'Salary', amount: 50000 },
  { id: '2', label: 'Bonus', amount: 5000, sublabel: 'Q1 bonus' },
]

describe('BudgetSection', () => {
  it('renders section title', () => {
    render(
      <BudgetSection
        title="Income"
        items={mockItems}
        total={55000}
        totalColor="green"
        isEditable={false}
      />
    )

    expect(screen.getByText('Income')).toBeInTheDocument()
  })

  it('shows item count', () => {
    render(
      <BudgetSection
        title="Income"
        items={mockItems}
        total={55000}
        totalColor="green"
        isEditable={false}
      />
    )

    expect(screen.getByText('(2)')).toBeInTheDocument()
  })

  it('shows total with correct color', () => {
    const { container } = render(
      <BudgetSection
        title="Income"
        items={mockItems}
        total={55000}
        totalColor="green"
        isEditable={false}
      />
    )

    expect(screen.getByText(/55 000,00 kr/)).toBeInTheDocument()
    expect(container.querySelector('.text-income')).toBeInTheDocument()
  })

  it('renders all items', () => {
    render(
      <BudgetSection
        title="Income"
        items={mockItems}
        total={55000}
        totalColor="green"
        isEditable={false}
      />
    )

    expect(screen.getByText('Salary')).toBeInTheDocument()
    expect(screen.getByText('Bonus')).toBeInTheDocument()
  })

  it('shows sublabel when provided', () => {
    render(
      <BudgetSection
        title="Income"
        items={mockItems}
        total={55000}
        totalColor="green"
        isEditable={false}
      />
    )

    expect(screen.getByText('Q1 bonus')).toBeInTheDocument()
  })

  it('shows empty message when no items and not editable', () => {
    render(
      <BudgetSection
        title="Savings"
        items={[]}
        total={0}
        totalColor="blue"
        isEditable={false}
        emptyMessage="No savings planned"
      />
    )

    expect(screen.getByText('No savings planned')).toBeInTheDocument()
  })

  it('shows clickable add button when empty and editable', async () => {
    const onAdd = vi.fn()
    render(
      <BudgetSection
        title="Savings"
        items={[]}
        total={0}
        totalColor="blue"
        isEditable={true}
        onAdd={onAdd}
      />
    )

    const addButton = screen.getByRole('button', { name: /add savings/i })
    expect(addButton).toBeInTheDocument()

    await userEvent.click(addButton)
    expect(onAdd).toHaveBeenCalled()
  })

  it('shows Add button when editable', () => {
    render(
      <BudgetSection
        title="Income"
        items={mockItems}
        total={55000}
        totalColor="green"
        isEditable={true}
        onAdd={vi.fn()}
      />
    )

    expect(screen.getByRole('button', { name: /add income/i })).toBeInTheDocument()
  })

  it('hides Add button when not editable', () => {
    render(
      <BudgetSection
        title="Income"
        items={mockItems}
        total={55000}
        totalColor="green"
        isEditable={false}
        onAdd={vi.fn()}
      />
    )

    expect(screen.queryByRole('button', { name: /add income/i })).not.toBeInTheDocument()
  })

  it('shows Edit/Delete buttons when editable', () => {
    render(
      <BudgetSection
        title="Income"
        items={mockItems}
        total={55000}
        totalColor="green"
        isEditable={true}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    )

    expect(screen.getAllByRole('button', { name: /edit/i })).toHaveLength(2)
    expect(screen.getAllByRole('button', { name: /delete/i })).toHaveLength(2)
  })

  it('calls onAdd when Add clicked', async () => {
    const onAdd = vi.fn()
    render(
      <BudgetSection
        title="Income"
        items={mockItems}
        total={55000}
        totalColor="green"
        isEditable={true}
        onAdd={onAdd}
      />
    )

    await userEvent.click(screen.getByRole('button', { name: /add income/i }))

    expect(onAdd).toHaveBeenCalled()
  })

  it('calls onEdit with item id when Edit clicked', async () => {
    const onEdit = vi.fn()
    render(
      <BudgetSection
        title="Income"
        items={mockItems}
        total={55000}
        totalColor="green"
        isEditable={true}
        onEdit={onEdit}
      />
    )

    const editButtons = screen.getAllByRole('button', { name: /edit/i })
    await userEvent.click(editButtons[0])

    expect(onEdit).toHaveBeenCalledWith('1')
  })

  it('calls onDelete with item id when Delete clicked', async () => {
    const onDelete = vi.fn()
    render(
      <BudgetSection
        title="Income"
        items={mockItems}
        total={55000}
        totalColor="green"
        isEditable={true}
        onDelete={onDelete}
      />
    )

    const deleteButtons = screen.getAllByRole('button', { name: /delete/i })
    await userEvent.click(deleteButtons[0])

    expect(onDelete).toHaveBeenCalledWith('1')
  })

  it('can collapse and expand', async () => {
    render(
      <BudgetSection
        title="Income"
        items={mockItems}
        total={55000}
        totalColor="green"
        isEditable={false}
      />
    )

    // Initially expanded
    expect(screen.getByText('Salary')).toBeVisible()

    // Click to collapse
    await userEvent.click(screen.getByText('Income'))

    // Items should be hidden (Radix removes from DOM when collapsed)
    expect(screen.queryByText('Salary')).not.toBeInTheDocument()
  })
})
