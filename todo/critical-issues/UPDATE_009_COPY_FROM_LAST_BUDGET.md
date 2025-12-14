# Update #009: Add "Copy from Last Budget" Feature Implementation

**Purpose:** Implement the "Copy from Last Budget" feature for income and savings steps  
**Files Affected:** `FRONTEND_STORIES_EPIC5.md` (Stories 5.3 and 5.5)  
**Priority:** Medium (improves UX for returning users)

---

## Feature Overview

From `BUDGET_WIZARD_FLOW.md`:
> **Copy from Last Budget:**
> - "Copy from last budget" button (only shown if a previous budget exists)
> - Opens a modal/drawer showing income items from the most recent budget
> - User can select which items to copy (checkboxes)
> - Selected items are added to the table with their previous values
> - User can then edit amounts/accounts as needed in the table

This feature appears in:
- Step 2: Income
- Step 4: Savings

---

## API Strategy

There's no dedicated "get last budget" endpoint. Use the existing endpoints:

1. `GET /api/budgets` — Get all budgets, find most recent
2. `GET /api/budgets/{id}` — Get full details of most recent budget

**Combined in a hook:**

```typescript
// src/hooks/use-last-budget.ts

import { useQuery } from '@tanstack/react-query'
import { getBudgets, getBudget } from '@/api'
import { queryKeys } from './query-keys'
import type { BudgetDetail, BudgetSummary } from '@/api/types'

interface UseLastBudgetResult {
  lastBudget: BudgetDetail | null
  isLoading: boolean
  error: Error | null
}

export function useLastBudget(): UseLastBudgetResult {
  // First, get all budgets to find the most recent
  const {
    data: budgetList,
    isLoading: isLoadingList,
    error: listError,
  } = useQuery({
    queryKey: queryKeys.budgets.all,
    queryFn: getBudgets,
  })

  // Find the most recent budget (already sorted by year DESC, month DESC from API)
  const mostRecentBudgetId = budgetList?.budgets[0]?.id

  // Then fetch its full details
  const {
    data: budgetDetail,
    isLoading: isLoadingDetail,
    error: detailError,
  } = useQuery({
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

---

## Implementation

### 1. Create Copy Modal Component

**Create `src/components/wizard/CopyFromLastBudgetModal.tsx`:**

```typescript
import { useState, useMemo } from 'react'
import { Copy, Check } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
  open,
  onOpenChange,
  itemType,
  onCopy,
}: CopyFromLastBudgetModalProps<T>) {
  const { lastBudget, isLoading, error } = useLastBudget()
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // Get items based on type
  const items = useMemo(() => {
    if (!lastBudget) return []
    return itemType === 'income' ? lastBudget.income : lastBudget.savings
  }, [lastBudget, itemType]) as T[]

  // Toggle selection
  const toggleItem = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  // Select all / deselect all
  const toggleAll = () => {
    if (selectedIds.size === items.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(items.map((item) => item.id)))
    }
  }

  // Handle copy
  const handleCopy = () => {
    const selectedItems = items.filter((item) => selectedIds.has(item.id))
    onCopy(selectedItems)
    onOpenChange(false)
    setSelectedIds(new Set()) // Reset for next time
  }

  // Reset selection when modal closes
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setSelectedIds(new Set())
    }
    onOpenChange(isOpen)
  }

  const title = itemType === 'income' ? 'Copy Income from Last Budget' : 'Copy Savings from Last Budget'
  const allSelected = items.length > 0 && selectedIds.size === items.length

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Copy className="w-5 h-5" />
            {title}
          </DialogTitle>
          {lastBudget && (
            <p className="text-sm text-gray-500">
              From {formatMonthYear(lastBudget.month, lastBudget.year)}
            </p>
          )}
        </DialogHeader>

        <div className="py-4">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-4">
              <p className="text-sm text-red-600">Failed to load previous budget.</p>
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-sm text-gray-500">
                No {itemType} items in the previous budget.
              </p>
            </div>
          ) : (
            <>
              {/* Select All */}
              <div className="flex items-center gap-2 mb-3 pb-3 border-b">
                <Checkbox
                  id="select-all"
                  checked={allSelected}
                  onCheckedChange={toggleAll}
                />
                <label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
                  Select All ({items.length})
                </label>
              </div>

              {/* Item List */}
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                    onClick={() => toggleItem(item.id)}
                  >
                    <Checkbox
                      checked={selectedIds.has(item.id)}
                      onCheckedChange={() => toggleItem(item.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{item.name}</p>
                      <p className="text-sm text-gray-500">
                        {formatCurrency(item.amount)} • {item.bankAccount.name}
                      </p>
                    </div>
                    {selectedIds.has(item.id) && (
                      <Check className="w-4 h-4 text-green-600 shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleCopy}
            disabled={selectedIds.size === 0}
          >
            Copy {selectedIds.size > 0 ? `(${selectedIds.size})` : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

---

### 2. Update Income Step (Story 5.3)

**Add to `IncomeStep.tsx`:**

```typescript
import { useState } from 'react'
import { Copy, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CopyFromLastBudgetModal } from './CopyFromLastBudgetModal'
import { useLastBudget } from '@/hooks/use-last-budget'
import type { BudgetIncome } from '@/api/types'
import type { WizardIncomeItem } from '../types'
import { generateId } from '@/lib/utils'

function IncomeStep() {
  const [state, dispatch] = useWizardContext()
  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false)
  const { lastBudget } = useLastBudget()

  const hasPreviousBudget = Boolean(lastBudget)

  const handleCopyFromLast = (items: BudgetIncome[]) => {
    // Convert API items to wizard items
    const wizardItems: WizardIncomeItem[] = items.map((item) => ({
      id: generateId(), // New client-side ID
      name: item.name,
      amount: item.amount,
      bankAccountId: item.bankAccount.id,
      bankAccountName: item.bankAccount.name,
    }))

    // Add to existing items (don't replace)
    for (const item of wizardItems) {
      dispatch({ type: 'ADD_INCOME_ITEM', item })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold">Income</h2>
          <p className="text-sm text-gray-500">Add your expected income for this month.</p>
        </div>

        {hasPreviousBudget && (
          <Button variant="outline" onClick={() => setIsCopyModalOpen(true)}>
            <Copy className="w-4 h-4 mr-2" />
            Copy from Last
          </Button>
        )}
      </div>

      {/* Income table */}
      <IncomeTable
        items={state.incomeItems}
        onUpdate={(id, updates) => dispatch({ type: 'UPDATE_INCOME_ITEM', id, updates })}
        onRemove={(id) => dispatch({ type: 'REMOVE_INCOME_ITEM', id })}
      />

      <Button
        variant="outline"
        onClick={() => dispatch({ type: 'ADD_INCOME_ITEM', item: createEmptyIncomeItem() })}
      >
        <Plus className="w-4 h-4 mr-2" />
        Add Income
      </Button>

      {/* Total */}
      <div className="text-right">
        <span className="text-sm text-gray-500">Total Income: </span>
        <span className="font-semibold">
          {formatCurrency(state.incomeItems.reduce((sum, item) => sum + item.amount, 0))}
        </span>
      </div>

      {/* Copy Modal */}
      <CopyFromLastBudgetModal<BudgetIncome>
        open={isCopyModalOpen}
        onOpenChange={setIsCopyModalOpen}
        itemType="income"
        onCopy={handleCopyFromLast}
      />
    </div>
  )
}
```

---

### 3. Update Savings Step (Story 5.5)

**Add similar pattern to `SavingsStep.tsx`:**

```typescript
import { useState } from 'react'
import { Copy, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CopyFromLastBudgetModal } from './CopyFromLastBudgetModal'
import { useLastBudget } from '@/hooks/use-last-budget'
import type { BudgetSavings } from '@/api/types'
import type { WizardSavingsItem } from '../types'
import { generateId } from '@/lib/utils'

function SavingsStep() {
  const [state, dispatch] = useWizardContext()
  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false)
  const { lastBudget } = useLastBudget()

  const hasPreviousBudget = Boolean(lastBudget)

  const handleCopyFromLast = (items: BudgetSavings[]) => {
    const wizardItems: WizardSavingsItem[] = items.map((item) => ({
      id: generateId(),
      name: item.name,
      amount: item.amount,
      bankAccountId: item.bankAccount.id,
      bankAccountName: item.bankAccount.name,
    }))

    for (const item of wizardItems) {
      dispatch({ type: 'ADD_SAVINGS_ITEM', item })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold">Savings</h2>
          <p className="text-sm text-gray-500">Allocate money to your savings accounts.</p>
        </div>

        {hasPreviousBudget && (
          <Button variant="outline" onClick={() => setIsCopyModalOpen(true)}>
            <Copy className="w-4 h-4 mr-2" />
            Copy from Last
          </Button>
        )}
      </div>

      {/* Savings table */}
      <SavingsTable
        items={state.savingsItems}
        onUpdate={(id, updates) => dispatch({ type: 'UPDATE_SAVINGS_ITEM', id, updates })}
        onRemove={(id) => dispatch({ type: 'REMOVE_SAVINGS_ITEM', id })}
      />

      <Button
        variant="outline"
        onClick={() => dispatch({ type: 'ADD_SAVINGS_ITEM', item: createEmptySavingsItem() })}
      >
        <Plus className="w-4 h-4 mr-2" />
        Add Savings
      </Button>

      {/* Running Balance */}
      <BudgetBalanceSummary
        incomeTotal={state.incomeItems.reduce((sum, i) => sum + i.amount, 0)}
        expensesTotal={state.expenseItems.reduce((sum, i) => sum + i.amount, 0)}
        savingsTotal={state.savingsItems.reduce((sum, i) => sum + i.amount, 0)}
      />

      {/* Copy Modal */}
      <CopyFromLastBudgetModal<BudgetSavings>
        open={isCopyModalOpen}
        onOpenChange={setIsCopyModalOpen}
        itemType="savings"
        onCopy={handleCopyFromLast}
      />
    </div>
  )
}
```

---

### 4. Handle Duplicate Prevention

When copying items, check if similar items already exist:

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
    toast.info(`Skipped ${items.length - wizardItems.length} duplicate item(s)`)
  }

  for (const item of wizardItems) {
    dispatch({ type: 'ADD_INCOME_ITEM', item })
  }
}
```

---

## Files to Create/Modify

| File | Action |
|------|--------|
| `src/hooks/use-last-budget.ts` | Create new hook |
| `src/components/wizard/CopyFromLastBudgetModal.tsx` | Create new component |
| `src/components/wizard/steps/IncomeStep.tsx` | Add copy button and modal |
| `src/components/wizard/steps/SavingsStep.tsx` | Add copy button and modal |
| Tests | Add tests for modal and hook |

---

## Tests to Add

```typescript
describe('CopyFromLastBudgetModal', () => {
  it('shows items from last budget', async () => {
    // Mock last budget with items
    server.use(
      http.get('/api/budgets', () => {
        return HttpResponse.json({ budgets: [{ id: '1', month: 2, year: 2025 }] })
      }),
      http.get('/api/budgets/1', () => {
        return HttpResponse.json({
          id: '1',
          income: [{ id: 'i1', name: 'Salary', amount: 30000, bankAccount: { id: 'a1', name: 'Checking' } }],
          // ...
        })
      })
    )

    render(
      <CopyFromLastBudgetModal
        open={true}
        onOpenChange={vi.fn()}
        itemType="income"
        onCopy={vi.fn()}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Salary')).toBeInTheDocument()
    })
  })

  it('calls onCopy with selected items', async () => {
    // ... test selection and copy
  })
})
```

---

*Created: [Current Date]*
