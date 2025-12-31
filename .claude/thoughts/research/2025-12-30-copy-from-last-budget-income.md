---
date: 2025-12-30T12:00:00+01:00
researcher: Claude
git_commit: ef65adfbeadfe9d282ec8c955895462686ed85ce
branch: main
repository: balance-frontend
topic: "Copy from Last Budget Feature in Income Step"
tags: [research, codebase, budget-wizard, copy-feature, income]
status: complete
last_updated: 2025-12-30
last_updated_by: Claude
---

# Research: Copy from Last Budget Feature in Income Step

**Date**: 2025-12-30T12:00:00+01:00
**Researcher**: Claude
**Git Commit**: ef65adfbeadfe9d282ec8c955895462686ed85ce
**Branch**: main
**Repository**: balance-frontend

## Research Question
Research everything regarding the "copy from last budget" feature from the income section of the new budget wizard. Functionality, logic, design etc.

## Summary

The "Copy from Last Budget" feature allows users to quickly populate income items in a new budget by copying from their most recent existing budget. It consists of three main components: a custom hook for fetching the last budget's details, a reusable modal for item selection, and integration logic in the income step that handles duplicate prevention and state updates.

## Detailed Findings

### Component Architecture

The feature is built with three main pieces:

1. **`useLastBudget` Hook** - Fetches the most recent budget with full details
2. **`CopyFromLastBudgetModal`** - Generic modal for selecting items to copy
3. **`StepIncome` Integration** - Handler logic for processing copied items

```
┌─────────────────────────────────────────────────────────────┐
│                      StepIncome                              │
│  ┌─────────────────┐    ┌────────────────────────────────┐  │
│  │ useBudgets()    │    │ handleCopyFromLast()           │  │
│  │ (button check)  │    │ - Filter duplicates            │  │
│  └─────────────────┘    │ - Transform to WizardIncomeItem│  │
│          │              │ - Dispatch ADD_INCOME_ITEM     │  │
│          ▼              └────────────────────────────────┘  │
│  [Copy from Last Budget]         ▲                          │
│          │                       │                          │
│          ▼                       │                          │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              CopyFromLastBudgetModal                 │    │
│  │  ┌──────────────────────────────────────────────┐   │    │
│  │  │ useLastBudget() -> fetches full budget       │   │    │
│  │  └──────────────────────────────────────────────┘   │    │
│  │  [ ] Select all (3)                                  │    │
│  │  [x] Salary - 50 000 kr • Checking                  │    │
│  │  [ ] Freelance - 5 000 kr • Savings                 │    │
│  │  [x] Side Project - 2 000 kr • Checking             │    │
│  │  [Cancel] [Copy (2)]                                │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

---

### useLastBudget Hook

**File**: `src/hooks/use-last-budget.ts`

This hook implements a two-stage fetch pattern to get the most recent budget with full details:

```typescript
export function useLastBudget(): UseLastBudgetResult {
  // Stage 1: Fetch all budgets to find the most recent
  const { data: budgetList, isLoading: isLoadingList, error: listError } = useQuery({
    queryKey: queryKeys.budgets.all,
    queryFn: getBudgets,
  })

  // Sort by year DESC, then month DESC
  const sortedBudgets = [...(budgetList?.budgets ?? [])].sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year
    return b.month - a.month
  })
  const mostRecentBudgetId = sortedBudgets[0]?.id

  // Stage 2: Fetch full details of most recent budget
  const { data: budgetDetail, isLoading: isLoadingDetail, error: detailError } = useQuery({
    queryKey: queryKeys.budgets.detail(mostRecentBudgetId ?? ''),
    queryFn: () => getBudget(mostRecentBudgetId!),
    enabled: !!mostRecentBudgetId,  // Only runs when ID is available
  })

  return {
    lastBudget: budgetDetail ?? null,
    isLoading: isLoadingList || isLoadingDetail,
    error: (listError as Error) ?? (detailError as Error) ?? null,
  }
}
```

**Key characteristics**:
- Uses TanStack Query for data fetching and caching
- Two-stage approach: list fetch → detail fetch
- The detail query is conditionally enabled based on having a budget ID
- Combines loading/error states from both queries
- Returns `BudgetDetail` which includes `income`, `expenses`, and `savings` arrays

---

### CopyFromLastBudgetModal Component

**File**: `src/components/wizard/CopyFromLastBudgetModal.tsx`

A generic modal component that works with both income and savings items:

```typescript
interface CopyFromLastBudgetModalProps<T> {
  open: boolean
  onOpenChange: (open: boolean) => void
  itemType: 'income' | 'savings'
  onCopy: (items: T[]) => void
}
```

**UI States**:

| State | Display |
|-------|---------|
| Loading | 3 skeleton rows |
| Empty | "No income items in the last budget." |
| Has Items | Checkbox list with "Select all" |

**Item Display**:
Each item shows:
- Checkbox for selection
- Item name (bold)
- Amount formatted as currency + bank account name
- Green checkmark when selected

**Selection Logic**:
```typescript
const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

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
```

**Copy Button**:
- Disabled when no items selected
- Shows count: "Copy" → "Copy (2)"
- Resets selection state on close

---

### StepIncome Integration

**File**: `src/components/wizard/steps/StepIncome.tsx`

#### Button Visibility Check (lines 36-41)

The "Copy from Last Budget" button only appears when a previous budget exists:

```typescript
const { data: budgetsData } = useBudgets()

// Sort to find most recent
const sortedBudgets = [...(budgetsData?.budgets ?? [])].sort((a, b) => {
  if (a.year !== b.year) return b.year - a.year
  return b.month - a.month
})
const lastBudget = sortedBudgets[0]

// Button only renders if lastBudget exists
{lastBudget && (
  <Button variant="outline" size="sm" onClick={() => setShowCopyModal(true)}>
    <Copy className="w-4 h-4 mr-2" />
    Copy from Last Budget
  </Button>
)}
```

#### Copy Handler (lines 89-107)

Processes selected items with duplicate prevention:

```typescript
const handleCopyFromLast = (items: BudgetIncome[]) => {
  // Build set of existing names (case-insensitive)
  const existingNames = new Set(
    state.incomeItems.map((i) => i.name.toLowerCase())
  )

  // Filter and transform items
  const newItems: WizardIncomeItem[] = items
    .filter((item) => !existingNames.has(item.name.toLowerCase()))
    .map((item) => ({
      id: generateId(),           // New client-side UUID
      name: item.name,
      amount: item.amount,
      bankAccountId: item.bankAccount.id,
      bankAccountName: item.bankAccount.name,
    }))

  // Dispatch each item to wizard state
  for (const item of newItems) {
    dispatch({ type: 'ADD_INCOME_ITEM', item })
  }
}
```

**Duplicate Prevention**:
- Collects all current income item names (lowercased)
- Filters out any copied items whose name already exists
- Case-insensitive comparison prevents "Salary" and "salary" duplicates

**Type Transformation**:
| BudgetIncome (API) | WizardIncomeItem (Local) |
|--------------------|--------------------------|
| `id` (server ID) | `id` (new client UUID) |
| `name` | `name` |
| `amount` | `amount` |
| `bankAccount.id` | `bankAccountId` |
| `bankAccount.name` | `bankAccountName` |

---

### State Management

**File**: `src/components/wizard/wizardReducer.ts`

The wizard uses a reducer pattern for state management:

```typescript
case 'ADD_INCOME_ITEM':
  return {
    ...state,
    incomeItems: [...state.incomeItems, action.item],
    isDirty: true,
  }
```

Items are added one-by-one via dispatch, and `isDirty` is set to true to track unsaved changes.

---

### Type Definitions

**API Types** (`src/api/types.ts`):
```typescript
interface BudgetIncome {
  id: string
  name: string
  amount: number
  bankAccount: BankAccountRef  // { id, name }
}
```

**Wizard Types** (`src/components/wizard/types.ts`):
```typescript
interface WizardIncomeItem {
  id: string           // Client-side UUID
  name: string
  amount: number
  bankAccountId: string
  bankAccountName: string  // Denormalized for display
}
```

---

### Design Decisions

1. **Two-stage data fetching**: The hook fetches the budget list first, then the full details. This allows showing the button quickly (list is often cached) while loading details lazily.

2. **Generic modal component**: `CopyFromLastBudgetModal` is parameterized by `itemType` to support both income and savings without code duplication.

3. **Case-insensitive duplicate check**: Prevents issues where "Salary" and "SALARY" would both be added.

4. **New ID generation**: Copied items get new client-side UUIDs rather than reusing server IDs, since these are new items that will be created on save.

5. **Denormalized bank account name**: The wizard stores both `bankAccountId` and `bankAccountName` to avoid additional lookups during display.

6. **Immediate dispatch**: Items are dispatched one-by-one rather than batched, allowing the reducer to handle each addition uniformly.

## Code References

- `src/hooks/use-last-budget.ts:12-46` - useLastBudget hook implementation
- `src/components/wizard/CopyFromLastBudgetModal.tsx:24-137` - Modal component
- `src/components/wizard/steps/StepIncome.tsx:36-41` - Button visibility check
- `src/components/wizard/steps/StepIncome.tsx:89-107` - Copy handler with duplicate prevention
- `src/components/wizard/steps/StepIncome.tsx:118-127` - Button rendering
- `src/components/wizard/steps/StepIncome.tsx:238-243` - Modal usage
- `src/components/wizard/wizardReducer.ts:33-38` - ADD_INCOME_ITEM action
- `src/api/types.ts:139-144` - BudgetIncome type
- `src/components/wizard/types.ts:11-17` - WizardIncomeItem type

## Historical Context (from thoughts/)

- `.claude/thoughts/notes/BUDGET_WIZARD_FLOW.md` - UX flow specification mentioning copy feature
- `.claude/thoughts/plans/story-05-03-wizard-step3-expenses.md` - Story 5.3 implementation plan that first introduced the "Copy from Last Budget" pattern with the `use-last-budget.ts` hook
- `.claude/thoughts/plans/story-05-04-wizard-step4-savings.md` - References same pattern for savings step
- `.claude/thoughts/plans/story-05-05-wizard-step5-review.md` - Review step documentation

## Related Research

No prior research documents exist on this specific feature.

## Open Questions

None - the feature implementation is complete and well-documented in code.
