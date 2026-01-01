# Story 5.4: Step 3 — Expenses

**As a** user  
**I want to** add expense items to my budget  
**So that** I can plan my spending for the month

### Acceptance Criteria

- [x] Shows table of expense items (name, amount)
- [x] "Add Expense" button for manual entry
- [x] Quick-add section with recurring expense templates
- [x] Due recurring expenses highlighted
- [x] Clicking template adds it to expenses table
- [x] Already-added templates show checkmark (removed from list)
- [x] Delete button per row
- [x] Shows total expenses
- [ ] ~~"Copy from Last Budget" button~~ (skipped - recurring templates solve same use case)

### Implementation

**Create `src/components/wizard/steps/StepExpenses.tsx`:**

```typescript
import { useState } from 'react'
import { Plus, Trash2, Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useWizard } from '../WizardContext'
import { useBudgets, useRecurringExpenses } from '@/hooks'
import { formatCurrency } from '@/lib/utils'
import type { ExpenseItem } from '../types'

function generateId(): string {
  return crypto.randomUUID()
}

export function StepExpenses() {
  const { state, dispatch } = useWizard()
  const { data: budgetsData } = useBudgets()
  const { data: recurringData } = useRecurringExpenses()
  const [isCopying, setIsCopying] = useState(false)

  const recurringExpenses = recurringData?.expenses ?? []
  
  // Sort: due first, then by name
  const sortedRecurring = [...recurringExpenses].sort((a, b) => {
    if (a.isDue !== b.isDue) return a.isDue ? -1 : 1
    return a.name.localeCompare(b.name)
  })

  // Find last budget for copy feature
  const sortedBudgets = [...(budgetsData?.budgets ?? [])].sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year
    return b.month - a.month
  })
  const lastBudget = sortedBudgets[0]

  const totalExpenses = state.expenseItems.reduce((sum, item) => sum + (item.amount || 0), 0)

  // Check if a recurring expense is already added
  const isRecurringAdded = (recurringId: string) => {
    return state.expenseItems.some((item) => item.recurringExpenseId === recurringId)
  }

  const handleAddItem = () => {
    dispatch({
      type: 'ADD_EXPENSE_ITEM',
      item: { id: generateId(), name: '', amount: 0 },
    })
  }

  const handleAddRecurring = (recurring: typeof recurringExpenses[0]) => {
    if (isRecurringAdded(recurring.id)) return

    dispatch({
      type: 'ADD_EXPENSE_ITEM',
      item: {
        id: generateId(),
        name: recurring.name,
        amount: recurring.amount,
        recurringExpenseId: recurring.id,
      },
    })
  }

  const handleUpdateItem = (id: string, field: keyof ExpenseItem, value: string | number) => {
    dispatch({
      type: 'UPDATE_EXPENSE_ITEM',
      id,
      updates: { [field]: value },
    })
  }

  const handleRemoveItem = (id: string) => {
    dispatch({ type: 'REMOVE_EXPENSE_ITEM', id })
  }

  const handleCopyFromLast = async () => {
    if (!lastBudget) return

    setIsCopying(true)
    try {
      const response = await fetch(`/api/budgets/${lastBudget.id}`)
      const budget = await response.json()

      if (budget.expenseItems && budget.expenseItems.length > 0) {
        const copiedItems: ExpenseItem[] = budget.expenseItems.map((item: { name: string; amount: number; recurringExpenseId?: string }) => ({
          id: generateId(),
          name: item.name,
          amount: item.amount,
          recurringExpenseId: item.recurringExpenseId,
        }))
        dispatch({ type: 'SET_EXPENSE_ITEMS', items: copiedItems })
      }
    } catch (error) {
      console.error('Failed to copy from last budget:', error)
    } finally {
      setIsCopying(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Expenses</h2>
          <p className="text-sm text-gray-500">
            Add your planned expenses for this month.
          </p>
        </div>
        {lastBudget && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyFromLast}
            disabled={isCopying}
          >
            <Copy className="w-4 h-4 mr-2" />
            {isCopying ? 'Copying...' : 'Copy from Last Budget'}
          </Button>
        )}
      </div>

      {/* Quick-add from recurring */}
      {sortedRecurring.length > 0 && (
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm font-medium">Quick Add from Recurring</CardTitle>
          </CardHeader>
          <CardContent className="py-3 pt-0">
            <div className="flex flex-wrap gap-2">
              {sortedRecurring.map((recurring) => {
                const isAdded = isRecurringAdded(recurring.id)
                return (
                  <Button
                    key={recurring.id}
                    variant={isAdded ? 'secondary' : 'outline'}
                    size="sm"
                    onClick={() => handleAddRecurring(recurring)}
                    disabled={isAdded}
                    className="relative"
                  >
                    {isAdded && <Check className="w-3 h-3 mr-1" />}
                    {recurring.name}
                    {recurring.isDue && !isAdded && (
                      <Badge variant="destructive" className="ml-2 text-xs py-0">
                        Due
                      </Badge>
                    )}
                  </Button>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Expenses table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[60%]">Name</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {state.expenseItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-gray-500 py-8">
                  No expenses yet. Add expenses manually or use quick-add above.
                </TableCell>
              </TableRow>
            ) : (
              state.expenseItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <Input
                      value={item.name}
                      onChange={(e) => handleUpdateItem(item.id, 'name', e.target.value)}
                      placeholder="e.g., Rent, Groceries"
                      className="border-0 shadow-none focus-visible:ring-0 px-0"
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <Input
                      type="number"
                      value={item.amount || ''}
                      onChange={(e) => handleUpdateItem(item.id, 'amount', parseFloat(e.target.value) || 0)}
                      placeholder="0"
                      className="border-0 shadow-none focus-visible:ring-0 px-0 text-right"
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveItem(item.id)}
                      aria-label="Remove item"
                    >
                      <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
          {state.expenseItems.length > 0 && (
            <TableFooter>
              <TableRow>
                <TableCell className="font-medium">Total</TableCell>
                <TableCell className="text-right font-semibold text-red-600">
                  {formatCurrency(totalExpenses)}
                </TableCell>
                <TableCell></TableCell>
              </TableRow>
            </TableFooter>
          )}
        </Table>
      </div>

      <Button variant="outline" onClick={handleAddItem}>
        <Plus className="w-4 h-4 mr-2" />
        Add Expense
      </Button>
    </div>
  )
}
```

### Test File: `src/components/wizard/steps/StepExpenses.test.tsx`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import { WizardProvider } from '../WizardContext'
import { StepExpenses } from './StepExpenses'
import { server } from '@/test/mocks/server'
import { http, HttpResponse } from 'msw'

function renderWithWizard() {
  return render(
    <WizardProvider>
      <StepExpenses />
    </WizardProvider>
  )
}

describe('StepExpenses', () => {
  beforeEach(() => {
    server.use(
      http.get('/api/budgets', () => {
        return HttpResponse.json({ budgets: [] })
      }),
      http.get('/api/recurring-expenses', () => {
        return HttpResponse.json({ expenses: [] })
      })
    )
  })

  it('renders expense table', () => {
    renderWithWizard()
    
    expect(screen.getByText('Name')).toBeInTheDocument()
    expect(screen.getByText('Amount')).toBeInTheDocument()
  })

  it('shows empty state message', () => {
    renderWithWizard()
    
    expect(screen.getByText(/no expenses yet/i)).toBeInTheDocument()
  })

  it('adds expense item when button clicked', async () => {
    renderWithWizard()
    
    await userEvent.click(screen.getByRole('button', { name: /add expense/i }))
    
    expect(screen.getByPlaceholderText(/rent/i)).toBeInTheDocument()
  })

  it('removes expense item when delete clicked', async () => {
    renderWithWizard()
    
    await userEvent.click(screen.getByRole('button', { name: /add expense/i }))
    expect(screen.getByPlaceholderText(/rent/i)).toBeInTheDocument()
    
    await userEvent.click(screen.getByRole('button', { name: /remove/i }))
    
    expect(screen.queryByPlaceholderText(/rent/i)).not.toBeInTheDocument()
  })

  it('shows total expenses', async () => {
    renderWithWizard()
    
    await userEvent.click(screen.getByRole('button', { name: /add expense/i }))
    const amountInput = screen.getByPlaceholderText('0')
    await userEvent.type(amountInput, '8000')
    
    expect(screen.getByText(/8 000,00 kr/)).toBeInTheDocument()
  })

  it('shows quick-add section when recurring expenses exist', async () => {
    server.use(
      http.get('/api/recurring-expenses', () => {
        return HttpResponse.json({
          expenses: [
            { id: '1', name: 'Rent', amount: 8000, isDue: true },
            { id: '2', name: 'Netflix', amount: 169, isDue: false },
          ]
        })
      })
    )

    renderWithWizard()
    
    await waitFor(() => {
      expect(screen.getByText(/quick add/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /rent/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /netflix/i })).toBeInTheDocument()
    })
  })

  it('shows "Due" badge on due recurring expenses', async () => {
    server.use(
      http.get('/api/recurring-expenses', () => {
        return HttpResponse.json({
          expenses: [
            { id: '1', name: 'Rent', amount: 8000, isDue: true },
          ]
        })
      })
    )

    renderWithWizard()
    
    await waitFor(() => {
      expect(screen.getByText('Due')).toBeInTheDocument()
    })
  })

  it('adds recurring expense to table when quick-add clicked', async () => {
    server.use(
      http.get('/api/recurring-expenses', () => {
        return HttpResponse.json({
          expenses: [
            { id: '1', name: 'Rent', amount: 8000, isDue: false },
          ]
        })
      })
    )

    renderWithWizard()
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /rent/i })).toBeInTheDocument()
    })

    await userEvent.click(screen.getByRole('button', { name: /rent/i }))
    
    expect(screen.getByDisplayValue('Rent')).toBeInTheDocument()
    expect(screen.getByDisplayValue('8000')).toBeInTheDocument()
  })

  it('shows checkmark on added recurring expenses', async () => {
    server.use(
      http.get('/api/recurring-expenses', () => {
        return HttpResponse.json({
          expenses: [
            { id: '1', name: 'Rent', amount: 8000, isDue: false },
          ]
        })
      })
    )

    renderWithWizard()
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /rent/i })).toBeInTheDocument()
    })

    await userEvent.click(screen.getByRole('button', { name: /rent/i }))
    
    // Button should now be disabled and have a checkmark
    const rentButton = screen.getByRole('button', { name: /rent/i })
    expect(rentButton).toBeDisabled()
  })

  it('does not show quick-add section when no recurring expenses', () => {
    renderWithWizard()
    
    expect(screen.queryByText(/quick add/i)).not.toBeInTheDocument()
  })
})
```

### Definition of Done

- [x] All tests pass
- [x] Can add/edit/remove expense items
- [x] Quick-add shows recurring expenses
- [x] Due expenses highlighted
- [x] Added templates show checkmark (filtered from list)
- [x] Total displays correctly
- [x] Recurring expenses are removed from Quick-Add list when added to budget

### Quick-Add State Tracking Implementation

Track which recurring expenses have been added using a derived state approach:

```typescript
// In ExpenseStep component - derive from expense items
const addedRecurringExpenseIds = useMemo(() => {
  const ids = new Set<string>()
  for (const item of state.expenseItems) {
    if (item.recurringExpenseId) {
      ids.add(item.recurringExpenseId)
    }
  }
  return ids
}, [state.expenseItems])

// Filter out already-added templates from Quick-Add section
const availableRecurringExpenses = recurringExpenses.filter(
  exp => !addedRecurringExpenseIds.has(exp.id)
)

// Separate into due and not due
const dueExpenses = availableRecurringExpenses.filter(exp => exp.isDue)
const otherExpenses = availableRecurringExpenses.filter(exp => !exp.isDue)
```

**QuickAddSection Component:**

```typescript
interface QuickAddSectionProps {
  addedIds: Set<string>
  onAdd: (template: RecurringExpense) => void
}

export function QuickAddSection({ addedIds, onAdd }: QuickAddSectionProps) {
  const { data, isLoading } = useRecurringExpenses()

  if (isLoading) {
    return <Skeleton className="h-32" />
  }

  const expenses = data?.expenses ?? []

  // Filter out already-added templates
  const availableExpenses = expenses.filter(exp => !addedIds.has(exp.id))

  // Separate into due and not due
  const dueExpenses = availableExpenses.filter(exp => exp.isDue)
  const otherExpenses = availableExpenses.filter(exp => !exp.isDue)

  if (availableExpenses.length === 0) {
    return (
      <div className="p-4 bg-gray-50 rounded-lg text-center">
        <p className="text-sm text-gray-500">
          {expenses.length === 0
            ? 'Inga återkommande utgifter ännu.'
            : 'Alla återkommande utgifter har lagts till.'}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-gray-900">Snabblägg från återkommande utgifter</h3>

      {dueExpenses.length > 0 && (
        <div>
          <h4 className="text-xs font-medium text-red-600 uppercase tracking-wide mb-2">
            Förfaller denna månad
          </h4>
          <div className="space-y-2">
            {dueExpenses.map(exp => (
              <QuickAddItem key={exp.id} expense={exp} onAdd={onAdd} />
            ))}
          </div>
        </div>
      )}

      {otherExpenses.length > 0 && (
        <div>
          <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
            Alla återkommande utgifter
          </h4>
          <div className="space-y-2">
            {otherExpenses.map(exp => (
              <QuickAddItem key={exp.id} expense={exp} onAdd={onAdd} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
```

**Visual Feedback for Recurring Expense Items:**

```typescript
// In the expense table row component
function ExpenseTableRow({ item, onUpdate, onRemove }: ExpenseTableRowProps) {
  const isFromRecurring = Boolean(item.recurringExpenseId)

  return (
    <tr className={cn(isFromRecurring && 'bg-blue-50/50')}>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <span>{item.name}</span>
          {isFromRecurring && (
            <Badge variant="secondary" className="text-xs">
              <Repeat className="w-3 h-3 mr-1" />
              Återkommande
            </Badge>
          )}
        </div>
      </td>
      {/* ... other columns ... */}
    </tr>
  )
}
```

---