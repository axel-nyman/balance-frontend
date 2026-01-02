# Story 6.3: Collapsible Budget Sections

**As a** user  
**I want to** see income, expenses, and savings in collapsible sections  
**So that** I can focus on one category at a time

### Acceptance Criteria

- [x] Three collapsible sections: Income, Expenses, Savings
- [x] Each shows item count and total in header
- [x] Expanded by default
- [x] Lists all items when expanded
- [x] "Add" button in each section header (draft only)
- [x] Edit/Delete buttons per item (draft only)

### Implementation

**Create `src/components/budget-detail/BudgetSection.tsx`:**

```typescript
import { useState } from 'react'
import { ChevronDown, ChevronRight, Plus, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface BudgetSectionItem {
  id: string
  label: string
  amount: number
  sublabel?: string
}

interface BudgetSectionProps {
  title: string
  items: BudgetSectionItem[]
  total: number
  totalColor: 'green' | 'red' | 'blue'
  isEditable: boolean
  onAdd?: () => void
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
  emptyMessage?: string
}

export function BudgetSection({
  title,
  items,
  total,
  totalColor,
  isEditable,
  onAdd,
  onEdit,
  onDelete,
  emptyMessage = 'No items',
}: BudgetSectionProps) {
  const [isOpen, setIsOpen] = useState(true)

  const colorClasses = {
    green: 'text-green-600',
    red: 'text-red-600',
    blue: 'text-blue-600',
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="border rounded-lg">
      <CollapsibleTrigger asChild>
        <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50">
          <div className="flex items-center gap-2">
            {isOpen ? (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-500" />
            )}
            <span className="font-medium text-gray-900">{title}</span>
            <span className="text-sm text-gray-500">({items.length})</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={cn('font-semibold', colorClasses[totalColor])}>
              {formatCurrency(total)}
            </span>
            {isEditable && onAdd && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onAdd()
                }}
                aria-label={`Add ${title.toLowerCase()}`}
              >
                <Plus className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="border-t">
          {items.length === 0 ? (
            <p className="p-4 text-center text-gray-500">{emptyMessage}</p>
          ) : (
            <ul className="divide-y">
              {items.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between px-4 py-3 hover:bg-gray-50"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{item.label}</p>
                    {item.sublabel && (
                      <p className="text-sm text-gray-500 truncate">{item.sublabel}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <span className="font-medium text-gray-900">
                      {formatCurrency(item.amount)}
                    </span>
                    {isEditable && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit?.(item.id)}
                          aria-label={`Edit ${item.label}`}
                        >
                          <Pencil className="w-4 h-4 text-gray-400" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDelete?.(item.id)}
                          aria-label={`Delete ${item.label}`}
                        >
                          <Trash2 className="w-4 h-4 text-gray-400" />
                        </Button>
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
```

### Test File: `src/components/budget-detail/BudgetSection.test.tsx`

```typescript
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
    expect(container.querySelector('.text-green-600')).toBeInTheDocument()
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

  it('shows empty message when no items', () => {
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
    
    // Items should be hidden
    expect(screen.queryByText('Salary')).not.toBeVisible()
  })
})
```

### Definition of Done

- [x] Tests pass
- [x] Sections render with items (integrated into BudgetDetailPage)
- [x] Collapse/expand works
- [x] Add/Edit/Delete buttons show only when editable
- [x] Callbacks fire correctly

---