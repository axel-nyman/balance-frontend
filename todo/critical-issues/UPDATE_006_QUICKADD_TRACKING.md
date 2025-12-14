# Update #006: Add Quick-Add State Tracking for Recurring Expenses

**Purpose:** Track which recurring expenses have been added to prevent duplicates  
**Files Affected:** `FRONTEND_STORIES_EPIC5.md` (Story 5.4)  
**Priority:** High (improves UX, prevents user confusion)

---

## Problem Summary

From `BUDGET_WIZARD_FLOW.md`:
> "Template disappears from Quick Add section once added (prevent duplicates)"

Epic 5 doesn't specify how to track this state or filter the Quick Add list.

---

## Implementation Required

### 1. Track Added Recurring Expense IDs in Wizard State

**Update `WizardState` in `src/components/wizard/types.ts`:**

```typescript
export interface WizardState {
  currentStep: number
  month: number | null
  year: number | null
  incomeItems: WizardIncomeItem[]
  expenseItems: WizardExpenseItem[]
  savingsItems: WizardSavingsItem[]
  // NEW: Track which recurring expense templates have been added
  addedRecurringExpenseIds: Set<string>
  isDirty: boolean
  isSubmitting: boolean
  error: string | null
}
```

**Update `WizardAction` types:**

```typescript
export type WizardAction =
  // ... existing actions ...
  | { type: 'ADD_EXPENSE_ITEM'; item: WizardExpenseItem }
  | { type: 'REMOVE_EXPENSE_ITEM'; id: string }
  // No new actions needed - tracking is derived from expense items
```

---

### 2. Update Reducer to Derive Added IDs

**Update `src/components/wizard/wizardReducer.ts`:**

```typescript
// Helper function to extract recurring expense IDs from expense items
function getAddedRecurringExpenseIds(items: WizardExpenseItem[]): Set<string> {
  const ids = new Set<string>()
  for (const item of items) {
    if (item.recurringExpenseId) {
      ids.add(item.recurringExpenseId)
    }
  }
  return ids
}

export const initialWizardState: WizardState = {
  currentStep: 1,
  month: null,
  year: null,
  incomeItems: [],
  expenseItems: [],
  savingsItems: [],
  addedRecurringExpenseIds: new Set(),
  isDirty: false,
  isSubmitting: false,
  error: null,
}

export function wizardReducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    // ... existing cases ...

    case 'ADD_EXPENSE_ITEM': {
      const newExpenseItems = [...state.expenseItems, action.item]
      return {
        ...state,
        expenseItems: newExpenseItems,
        addedRecurringExpenseIds: getAddedRecurringExpenseIds(newExpenseItems),
        isDirty: true,
      }
    }

    case 'REMOVE_EXPENSE_ITEM': {
      const newExpenseItems = state.expenseItems.filter(item => item.id !== action.id)
      return {
        ...state,
        expenseItems: newExpenseItems,
        addedRecurringExpenseIds: getAddedRecurringExpenseIds(newExpenseItems),
        isDirty: true,
      }
    }

    case 'SET_EXPENSE_ITEMS': {
      return {
        ...state,
        expenseItems: action.items,
        addedRecurringExpenseIds: getAddedRecurringExpenseIds(action.items),
        isDirty: true,
      }
    }

    case 'RESET':
      return initialWizardState

    // ... other cases ...
  }
}
```

---

### 3. Update Quick Add Section Component

**Update `src/components/wizard/steps/ExpenseStep.tsx`:**

```typescript
import { useRecurringExpenses } from '@/hooks'
import type { RecurringExpense } from '@/api/types'

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
            ? 'No recurring expense templates yet.'
            : 'All recurring expenses have been added.'}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-gray-900">Quick Add from Recurring Expenses</h3>

      {dueExpenses.length > 0 && (
        <div>
          <h4 className="text-xs font-medium text-red-600 uppercase tracking-wide mb-2">
            Due This Month
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
            All Recurring Expenses
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

interface QuickAddItemProps {
  expense: RecurringExpense
  onAdd: (expense: RecurringExpense) => void
}

function QuickAddItem({ expense, onAdd }: QuickAddItemProps) {
  const intervalLabel = {
    MONTHLY: 'Monthly',
    QUARTERLY: 'Quarterly',
    BIANNUALLY: 'Biannually',
    YEARLY: 'Yearly',
  }[expense.recurrenceInterval]

  return (
    <div className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
      <div>
        <p className="font-medium text-gray-900">{expense.name}</p>
        <p className="text-sm text-gray-500">
          {formatCurrency(expense.amount)} • {intervalLabel}
        </p>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onAdd(expense)}
        aria-label={`Add ${expense.name}`}
      >
        <Plus className="w-4 h-4" />
      </Button>
    </div>
  )
}
```

---

### 4. Wire Up in Expense Step

**Update the expense step to use Quick Add:**

```typescript
// In ExpenseStep component

function ExpenseStep() {
  const [state, dispatch] = useWizardContext()

  const handleQuickAdd = (template: RecurringExpense) => {
    const newItem: WizardExpenseItem = {
      id: crypto.randomUUID(),
      name: template.name,
      amount: template.amount,
      bankAccountId: '',        // User must select
      bankAccountName: '',
      isManual: template.isManual,
      recurringExpenseId: template.id,
      deductedAt: undefined,
    }

    dispatch({ type: 'ADD_EXPENSE_ITEM', item: newItem })
  }

  return (
    <div className="space-y-6">
      {/* Quick Add Section */}
      <QuickAddSection
        addedIds={state.addedRecurringExpenseIds}
        onAdd={handleQuickAdd}
      />

      {/* Expense Table */}
      <div>
        <h3 className="text-sm font-medium text-gray-900 mb-2">Budget Expenses</h3>
        <ExpenseTable
          items={state.expenseItems}
          onUpdate={(id, updates) => dispatch({ type: 'UPDATE_EXPENSE_ITEM', id, updates })}
          onRemove={(id) => dispatch({ type: 'REMOVE_EXPENSE_ITEM', id })}
        />
        <Button
          variant="outline"
          className="mt-2"
          onClick={() => dispatch({
            type: 'ADD_EXPENSE_ITEM',
            item: createEmptyExpenseItem(),
          })}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Expense
        </Button>
      </div>
    </div>
  )
}
```

---

### 5. Visual Feedback for Already-Added Items

When a recurring expense is already in the budget, it should be visually distinguished in the expenses table:

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
              Recurring
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

### 6. Handle "Copy from Last Budget" Interaction

When copying expenses from a previous budget, the added IDs should be tracked:

```typescript
// When copying expenses from last budget
function handleCopyExpenses(expenses: BudgetExpense[]) {
  const wizardItems: WizardExpenseItem[] = expenses.map(exp => ({
    id: crypto.randomUUID(),
    name: exp.name,
    amount: exp.amount,
    bankAccountId: exp.bankAccount.id,
    bankAccountName: exp.bankAccount.name,
    isManual: exp.isManual,
    recurringExpenseId: exp.recurringExpenseId ?? undefined,
    deductedAt: exp.deductedAt ?? undefined,
  }))

  dispatch({ type: 'SET_EXPENSE_ITEMS', items: wizardItems })
  // The reducer automatically updates addedRecurringExpenseIds
}
```

---

## Alternative: Use Derived State (Simpler)

Instead of storing `addedRecurringExpenseIds` in state, derive it on render:

```typescript
// In the ExpenseStep component
const addedRecurringExpenseIds = useMemo(() => {
  const ids = new Set<string>()
  for (const item of state.expenseItems) {
    if (item.recurringExpenseId) {
      ids.add(item.recurringExpenseId)
    }
  }
  return ids
}, [state.expenseItems])
```

This is simpler and doesn't require reducer changes, but means the calculation runs on every render of the expense step.

**Recommendation:** Use the derived state approach unless performance becomes an issue.

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/wizard/types.ts` | Add `addedRecurringExpenseIds` to state (optional) |
| `src/components/wizard/wizardReducer.ts` | Track IDs on expense changes (optional) |
| `src/components/wizard/steps/ExpenseStep.tsx` | Add QuickAddSection, filter logic |
| `src/components/wizard/steps/QuickAddSection.tsx` | New component (or inline) |

---

*Created: [Current Date]*
