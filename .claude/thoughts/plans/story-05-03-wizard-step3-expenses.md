# Story 5.3: Step 2 — Income

**As a** user  
**I want to** add income items to my budget  
**So that** I can track my expected income for the month

### Acceptance Criteria

- [ ] Shows table of income items (source, amount)
- [ ] "Add Income" button to add new row
- [ ] Inline editing of source and amount
- [ ] Delete button per row
- [ ] Shows total income
- [ ] "Copy from Last Budget" button
- [ ] At least one income item required to proceed

### Implementation

**Create `src/components/wizard/steps/StepIncome.tsx`:**

```typescript
import { useState } from 'react'
import { Plus, Trash2, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from '@/components/ui/table'
import { useWizard } from '../WizardContext'
import { useBudgets, useBudgetDetail } from '@/hooks'
import { formatCurrency } from '@/lib/utils'
import type { IncomeItem } from '../types'

function generateId(): string {
  return crypto.randomUUID()
}

export function StepIncome() {
  const { state, dispatch } = useWizard()
  const { data: budgetsData } = useBudgets()
  const [isCopying, setIsCopying] = useState(false)

  // Find the most recent budget to copy from
  const sortedBudgets = [...(budgetsData?.budgets ?? [])].sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year
    return b.month - a.month
  })
  const lastBudget = sortedBudgets[0]

  const totalIncome = state.incomeItems.reduce((sum, item) => sum + (item.amount || 0), 0)

  const handleAddItem = () => {
    dispatch({
      type: 'ADD_INCOME_ITEM',
      item: { id: generateId(), source: '', amount: 0 },
    })
  }

  const handleUpdateItem = (id: string, field: keyof IncomeItem, value: string | number) => {
    dispatch({
      type: 'UPDATE_INCOME_ITEM',
      id,
      updates: { [field]: value },
    })
  }

  const handleRemoveItem = (id: string) => {
    dispatch({ type: 'REMOVE_INCOME_ITEM', id })
  }

  const handleCopyFromLast = async () => {
    if (!lastBudget) return

    setIsCopying(true)
    try {
      // Fetch the full budget detail
      const response = await fetch(`/api/budgets/${lastBudget.id}`)
      const budget = await response.json()

      if (budget.incomeItems && budget.incomeItems.length > 0) {
        const copiedItems: IncomeItem[] = budget.incomeItems.map((item: { source: string; amount: number }) => ({
          id: generateId(),
          source: item.source,
          amount: item.amount,
        }))
        dispatch({ type: 'SET_INCOME_ITEMS', items: copiedItems })
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
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Income</h2>
          <p className="text-sm text-gray-500">
            Add your expected income sources for this month.
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

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[60%]">Source</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {state.incomeItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-gray-500 py-8">
                  No income items yet. Add your first income source.
                </TableCell>
              </TableRow>
            ) : (
              state.incomeItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <Input
                      value={item.source}
                      onChange={(e) => handleUpdateItem(item.id, 'source', e.target.value)}
                      placeholder="e.g., Salary, Freelance"
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
          {state.incomeItems.length > 0 && (
            <TableFooter>
              <TableRow>
                <TableCell className="font-medium">Total</TableCell>
                <TableCell className="text-right font-semibold text-green-600">
                  {formatCurrency(totalIncome)}
                </TableCell>
                <TableCell></TableCell>
              </TableRow>
            </TableFooter>
          )}
        </Table>
      </div>

      <Button variant="outline" onClick={handleAddItem}>
        <Plus className="w-4 h-4 mr-2" />
        Add Income
      </Button>

      {state.incomeItems.length === 0 && (
        <p className="text-sm text-amber-600">
          Add at least one income source to continue.
        </p>
      )}
    </div>
  )
}
```

### Test File: `src/components/wizard/steps/StepIncome.test.tsx`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import { WizardProvider } from '../WizardContext'
import { StepIncome } from './StepIncome'
import { server } from '@/test/mocks/server'
import { http, HttpResponse } from 'msw'

function renderWithWizard() {
  return render(
    <WizardProvider>
      <StepIncome />
    </WizardProvider>
  )
}

describe('StepIncome', () => {
  beforeEach(() => {
    server.use(
      http.get('/api/budgets', () => {
        return HttpResponse.json({ budgets: [] })
      })
    )
  })

  it('renders income table', () => {
    renderWithWizard()
    
    expect(screen.getByText('Source')).toBeInTheDocument()
    expect(screen.getByText('Amount')).toBeInTheDocument()
  })

  it('shows empty state message', () => {
    renderWithWizard()
    
    expect(screen.getByText(/no income items yet/i)).toBeInTheDocument()
  })

  it('adds income item when button clicked', async () => {
    renderWithWizard()
    
    await userEvent.click(screen.getByRole('button', { name: /add income/i }))
    
    expect(screen.getByPlaceholderText(/salary/i)).toBeInTheDocument()
  })

  it('allows editing income source', async () => {
    renderWithWizard()
    
    await userEvent.click(screen.getByRole('button', { name: /add income/i }))
    
    const sourceInput = screen.getByPlaceholderText(/salary/i)
    await userEvent.type(sourceInput, 'My Salary')
    
    expect(sourceInput).toHaveValue('My Salary')
  })

  it('allows editing income amount', async () => {
    renderWithWizard()
    
    await userEvent.click(screen.getByRole('button', { name: /add income/i }))
    
    const amountInput = screen.getByPlaceholderText('0')
    await userEvent.type(amountInput, '50000')
    
    expect(amountInput).toHaveValue(50000)
  })

  it('removes income item when delete clicked', async () => {
    renderWithWizard()
    
    await userEvent.click(screen.getByRole('button', { name: /add income/i }))
    expect(screen.getByPlaceholderText(/salary/i)).toBeInTheDocument()
    
    await userEvent.click(screen.getByRole('button', { name: /remove/i }))
    
    expect(screen.queryByPlaceholderText(/salary/i)).not.toBeInTheDocument()
  })

  it('shows total income', async () => {
    renderWithWizard()
    
    await userEvent.click(screen.getByRole('button', { name: /add income/i }))
    const amountInput = screen.getByPlaceholderText('0')
    await userEvent.type(amountInput, '50000')
    
    expect(screen.getByText(/50 000,00 kr/)).toBeInTheDocument()
  })

  it('shows validation message when no items', () => {
    renderWithWizard()
    
    expect(screen.getByText(/add at least one/i)).toBeInTheDocument()
  })

  it('shows copy from last budget button when budget exists', async () => {
    server.use(
      http.get('/api/budgets', () => {
        return HttpResponse.json({
          budgets: [
            { id: '1', month: 1, year: 2025, status: 'LOCKED' }
          ]
        })
      })
    )

    renderWithWizard()
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /copy from last/i })).toBeInTheDocument()
    })
  })

  it('does not show copy button when no previous budgets', () => {
    renderWithWizard()
    
    expect(screen.queryByRole('button', { name: /copy from last/i })).not.toBeInTheDocument()
  })

  it('copies income from last budget', async () => {
    server.use(
      http.get('/api/budgets', () => {
        return HttpResponse.json({
          budgets: [
            { id: '1', month: 1, year: 2025, status: 'LOCKED' }
          ]
        })
      }),
      http.get('/api/budgets/1', () => {
        return HttpResponse.json({
          id: '1',
          incomeItems: [
            { id: 'old-1', source: 'Salary', amount: 50000 },
            { id: 'old-2', source: 'Side gig', amount: 5000 },
          ]
        })
      })
    )

    renderWithWizard()
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /copy from last/i })).toBeInTheDocument()
    })

    await userEvent.click(screen.getByRole('button', { name: /copy from last/i }))
    
    await waitFor(() => {
      expect(screen.getByDisplayValue('Salary')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Side gig')).toBeInTheDocument()
    })
  })
})
```

### Definition of Done

- [ ] All tests pass
- [ ] Can add/edit/remove income items
- [ ] Total displays correctly
- [ ] Copy from last budget works
- [ ] Validation message shows when empty
- [ ] Duplicate items are skipped when copying

### Copy from Last Budget Implementation

**Create `src/hooks/use-last-budget.ts`:**

```typescript
import { useQuery } from '@tanstack/react-query'
import { getBudgets, getBudget } from '@/api'
import { queryKeys } from './query-keys'
import type { BudgetDetail } from '@/api/types'

interface UseLastBudgetResult {
  lastBudget: BudgetDetail | null
  isLoading: boolean
  error: Error | null
}

export function useLastBudget(): UseLastBudgetResult {
  // First, get all budgets to find the most recent
  const { data: budgetList, isLoading: isLoadingList, error: listError } = useQuery({
    queryKey: queryKeys.budgets.all,
    queryFn: getBudgets,
  })

  // Find the most recent budget
  const mostRecentBudgetId = budgetList?.budgets[0]?.id

  // Then fetch its full details
  const { data: budgetDetail, isLoading: isLoadingDetail, error: detailError } = useQuery({
    queryKey: queryKeys.budgets.detail(mostRecentBudgetId ?? ''),
    queryFn: () => getBudget(mostRecentBudgetId!),
    enabled: !!mostRecentBudgetId,
  })

  return {
    lastBudget: budgetDetail ?? null,
    isLoading: isLoadingList || isLoadingDetail,
    error: (listError as Error) ?? (detailError as Error) ?? null,
  }
}
```

**Create `src/components/wizard/CopyFromLastBudgetModal.tsx`:**

```typescript
import { useState, useMemo } from 'react'
import { Copy, Check } from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency, formatMonthYear } from '@/lib/utils'
import { useLastBudget } from '@/hooks/use-last-budget'
import type { BudgetIncome, BudgetSavings } from '@/api/types'

interface CopyFromLastBudgetModalProps<T> {
  open: boolean
  onOpenChange: (open: boolean) => void
  itemType: 'income' | 'savings'
  onCopy: (items: T[]) => void
}

export function CopyFromLastBudgetModal<T extends BudgetIncome | BudgetSavings>({
  open, onOpenChange, itemType, onCopy,
}: CopyFromLastBudgetModalProps<T>) {
  const { lastBudget, isLoading, error } = useLastBudget()
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const items = useMemo(() => {
    if (!lastBudget) return []
    return itemType === 'income' ? lastBudget.income : lastBudget.savings
  }, [lastBudget, itemType]) as T[]

  const toggleItem = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleAll = () => {
    if (selectedIds.size === items.length) setSelectedIds(new Set())
    else setSelectedIds(new Set(items.map((item) => item.id)))
  }

  const handleCopy = () => {
    const selectedItems = items.filter((item) => selectedIds.has(item.id))
    onCopy(selectedItems)
    onOpenChange(false)
    setSelectedIds(new Set())
  }

  const title = itemType === 'income'
    ? 'Kopiera inkomster från förra budgeten'
    : 'Kopiera sparande från förra budgeten'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Copy className="w-5 h-5" />
            {title}
          </DialogTitle>
          {lastBudget && (
            <p className="text-sm text-gray-500">
              Från {formatMonthYear(lastBudget.month, lastBudget.year)}
            </p>
          )}
        </DialogHeader>

        <div className="py-4">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : items.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">
              Inga {itemType === 'income' ? 'inkomster' : 'sparande'} i förra budgeten.
            </p>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-3 pb-3 border-b">
                <Checkbox checked={selectedIds.size === items.length} onCheckedChange={toggleAll} />
                <span className="text-sm font-medium">Välj alla ({items.length})</span>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                    onClick={() => toggleItem(item.id)}
                  >
                    <Checkbox checked={selectedIds.has(item.id)} />
                    <div className="flex-1">
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-gray-500">
                        {formatCurrency(item.amount)} • {item.bankAccount.name}
                      </p>
                    </div>
                    {selectedIds.has(item.id) && <Check className="w-4 h-4 text-green-600" />}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Avbryt</Button>
          <Button onClick={handleCopy} disabled={selectedIds.size === 0}>
            Kopiera {selectedIds.size > 0 ? `(${selectedIds.size})` : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

**Usage in IncomeStep:**

```typescript
const handleCopyFromLast = (items: BudgetIncome[]) => {
  const existingNames = new Set(state.incomeItems.map((i) => i.name.toLowerCase()))

  const wizardItems: WizardIncomeItem[] = items
    .filter((item) => !existingNames.has(item.name.toLowerCase())) // Skip duplicates
    .map((item) => ({
      id: generateId(),
      name: item.name,
      amount: item.amount,
      bankAccountId: item.bankAccount.id,
      bankAccountName: item.bankAccount.name,
    }))

  if (wizardItems.length < items.length) {
    toast.info(`Hoppade över ${items.length - wizardItems.length} dubbletter`)
  }

  for (const item of wizardItems) {
    dispatch({ type: 'ADD_INCOME_ITEM', item })
  }
}
```

---