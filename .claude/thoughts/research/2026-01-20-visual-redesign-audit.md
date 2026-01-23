---
date: 2026-01-20T14:30:00+01:00
researcher: Claude
git_commit: 01276af4a40e368fc46cc88729f21befbe9e4d18
branch: main
repository: balance-frontend
topic: "Visual Redesign Audit - Wizard, Budget Details, and Todo List"
tags: [research, codebase, wizard, budget-detail, todo, design-system, component-architecture]
status: complete
last_updated: 2026-01-20
last_updated_by: Claude
---

# Research: Visual Redesign Audit - Wizard, Budget Details, and Todo List

**Date**: 2026-01-20T14:30:00+01:00
**Researcher**: Claude
**Git Commit**: 01276af4a40e368fc46cc88729f21befbe9e4d18
**Branch**: main
**Repository**: balance-frontend

## Research Question

Audit the uncommitted visual redesign changes across the budget creation Wizard, budget details page, and todo list page. Document the current implementation, identify code patterns, and examine the component architecture.

## Summary

The visual redesign introduces a cohesive card-based design system across three areas:

1. **Budget Creation Wizard** - New `ItemCard` component with inline editing, collapsible accordion-style sections, step progress indicators
2. **Budget Detail Page** - New `BudgetItemCard` for read-only display, `BudgetSection` with collapsible groups, `BudgetSummary` hero card
3. **Todo List** - New `TodoItemCard` with custom checkbox, `TodoSection` with collapsible grouping, `TodoProgress` celebration state

The implementation creates **two parallel card component hierarchies** with similar but distinct patterns:
- `src/components/wizard/ItemCard.tsx` (editable, inline inputs)
- `src/components/budget-detail/BudgetItemCard.tsx` (read-only, clickable)

## Detailed Findings

### Component Inventory

#### New Files Created (Untracked)

| File | Purpose | Lines |
|------|---------|-------|
| `src/components/wizard/ItemCard.tsx` | Editable card with inline inputs for wizard steps | 248 |
| `src/components/budget-detail/BudgetItemCard.tsx` | Read-only card for budget detail views | 85 |

#### Modified Components

| Component | Change Summary |
|-----------|----------------|
| `WizardShell.tsx` | Accordion-style collapsible sections with Radix Collapsible |
| `ProgressHeader.tsx` | Step indicators (numbered circles with checkmarks) |
| `SectionHeader.tsx` | Clickable headers with status indicators and chevron |
| `StepIncome.tsx` | Refactored to use ItemCard, added CopyableItem pattern |
| `StepExpenses.tsx` | Refactored to use ItemCard, added RecurringExpenseItem |
| `StepSavings.tsx` | Refactored to use ItemCard, CopyableItem pattern |
| `StepReview.tsx` | New collapsible review sections, balanced state celebration |
| `BudgetSection.tsx` | Refactored to use BudgetItemCard, collapsible pattern |
| `BudgetSummary.tsx` | New hero card with balanced/unbalanced states |
| `TodoItemRow.tsx` | Renamed to TodoItemCard internally, card-based design |
| `TodoItemList.tsx` | TodoSection pattern with collapsibles |
| `TodoProgress.tsx` | Celebration card when all items complete |

### Design System Implementation

#### Color Tokens (index.css:98-106)

```css
--income: oklch(0.55 0.15 145);          /* Green - money coming in */
--expense: oklch(0.55 0.2 25);           /* Red - money going out */
--savings: oklch(0.545 0.175 262);       /* Blue - money set aside */
--balanced: oklch(0.55 0.15 145);        /* Green - equilibrium achieved */
```

Each has a `-muted` variant for backgrounds (e.g., `--income-muted`).

#### Type Style Maps

Three components define type-specific styling using `Record<ItemType, {...}>` pattern:

**wizard/ItemCard.tsx:29-45**
```typescript
const typeStyles: Record<ItemType, { border: string; accent: string; amountColor: string }> = {
  income: {
    border: 'border-income/20 hover:border-income/30',
    accent: 'bg-income/5',
    amountColor: 'text-income',
  },
  // ... expense, savings
}
```

**budget-detail/BudgetItemCard.tsx:17-30**
```typescript
const typeStyles: Record<ItemType, { border: string; amountColor: string }> = {
  income: {
    border: 'border-income/20 hover:border-income/30',
    amountColor: 'text-income',
  },
  // ... expense, savings
}
```

**todo/TodoItemRow.tsx:14-25**
```typescript
const typeStyles: Record<ItemType, { border: string; borderCompleted: string; amountColor: string }> = {
  transfer: {
    border: 'border-savings/20 hover:border-savings/30',
    borderCompleted: 'border-savings/10',
    amountColor: 'text-savings',
  },
  // payment maps to expense colors
}
```

#### Animation Classes (index.css:179-253)

Custom keyframes defined:
- `pop-check` - Checkmark animation on todo completion
- `fade-in-subtle` - New item appears with slight slide-up
- `collapse-row` - Grid row collapse animation
- `collapsible-down/up` - Radix collapsible height animations

### Component Architecture Analysis

#### Wizard ItemCard (wizard/ItemCard.tsx)

Exports three components:
1. `ItemCard` - Main editable card with inline inputs
2. `RecurringExpenseItem` - Clickable item for quick-adding recurring expenses
3. `CopyableItem` - Clickable item for copying from last budget

**Props pattern for ItemCard (lines 11-27):**
```typescript
interface ItemCardProps {
  type: ItemType
  name: string
  amount: number
  bankAccountId: string
  bankAccountName: string
  onNameChange: (value: string) => void
  onAmountChange: (value: number) => void
  onAccountChange: (accountId: string, accountName: string) => void
  onDelete: () => void
  namePlaceholder?: string
  isNew?: boolean
  // Expense-specific props
  isManual?: boolean
  onManualChange?: (value: boolean) => void
  isRecurring?: boolean
}
```

Uses borderless inputs for inline editing:
```typescript
<Input
  className="border-0 shadow-none px-0 h-auto py-0 text-base font-medium ... focus-visible:ring-0"
/>
```

#### Budget Detail BudgetItemCard (budget-detail/BudgetItemCard.tsx)

Simpler read-only card:
```typescript
interface BudgetItemCardProps {
  type: ItemType
  name: string
  amount: number
  accountName: string
  isEditable: boolean
  onClick?: () => void
  onDelete?: () => void
}
```

Key difference: No inline editing, instead uses `onClick` for modal-based editing.
Includes keyboard accessibility: `tabIndex`, `role="button"`, `onKeyDown` for Enter.

#### Todo TodoItemCard (todo/TodoItemRow.tsx)

Custom checkbox implementation with animation:
```typescript
<button
  className={cn(
    'flex h-5 w-5 items-center justify-center rounded-md border-2 transition-all duration-150',
    isCompleted
      ? 'border-balanced bg-balanced text-white'
      : 'border-border hover:border-muted-foreground',
  )}
>
  {isCompleted && (
    <Check className="h-3 w-3 animate-pop-check" strokeWidth={3} />
  )}
</button>
```

Maintains backwards compatibility export:
```typescript
export { TodoItemCard as TodoItemRow }
```

### Collapsible Section Pattern

Three implementations of collapsible sections, all using Radix Collapsible:

**1. WizardShell accordion (WizardShell.tsx:176-205)**
- Full step content collapsible
- Only current step expanded
- Uses SectionHeader as trigger

**2. BudgetSection (BudgetSection.tsx:51-117)**
- Income/Expense/Savings grouping on detail page
- Toggle with ChevronDown icon
- Shows count and total in header

**3. TodoSection (TodoItemList.tsx:36-78)**
- Savings Transfers vs Manual Payments grouping
- Same ChevronDown pattern
- Shows completed/total count

All three use identical animation classes:
```typescript
className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down"
```

### Balance State Display

Two components display balance celebration state:

**StepReview.tsx:48-92** (Wizard)
```typescript
<div className={cn(
  'relative overflow-hidden rounded-xl p-5 text-center transition-colors duration-300',
  isBalanced && 'bg-balanced-muted',
  isNegative && 'bg-expense-muted',
  isPositive && !isBalanced && 'bg-muted'
)}>
  {isBalanced && (
    <div className="absolute inset-0 flex items-center justify-center opacity-[0.07]">
      <Sparkles className="w-32 h-32 text-balanced" />
    </div>
  )}
  // ... content
</div>
```

**BudgetSummary.tsx:16-33** (Budget Detail)
```typescript
if (isBalanced) {
  return (
    <div className="rounded-xl bg-balanced-muted p-5 shadow-md">
      <div className="flex flex-col items-center text-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-balanced/20 text-balanced mb-3">
          <Check className="h-5 w-5" strokeWidth={2.5} />
        </div>
        <p className="text-lg font-semibold text-balanced">Perfectly Balanced</p>
        // ...
      </div>
    </div>
  )
}
```

Similar patterns with minor differences (Sparkles icon vs plain check, size variations).

### Export Structure

**wizard/index.ts** exports:
- WizardProvider, useWizard
- WizardShell
- ProgressHeader, WizardNavigation, SectionHeader
- ItemCard, CopyableItem, RecurringExpenseItem (new)
- types, wizardReducer

**todo/index.ts** exports:
- TodoProgress
- TodoItemList
- TodoItemCard, TodoItemRow (alias for backwards compatibility)

### Animation Definitions

**New items** use `animate-fade-in-subtle`:
```typescript
isNew && 'animate-fade-in-subtle'
```

State managed via `newlyAddedIds` Set with timeout cleanup (StepIncome.tsx:35-55):
```typescript
const [newlyAddedIds, setNewlyAddedIds] = useState<Set<string>>(new Set())

const handleAddItem = () => {
  const newId = generateId()
  setNewlyAddedIds((prev) => new Set(prev).add(newId))
  // ... dispatch add action
  setTimeout(() => {
    setNewlyAddedIds((prev) => {
      const next = new Set(prev)
      next.delete(newId)
      return next
    })
  }, 300)
}
```

This pattern is duplicated in StepExpenses.tsx:62-83 and StepSavings.tsx:53-73.

### Copy Item Pattern

**StepIncome** and **StepSavings** both have "copy from last budget" functionality with identical animation pattern using `copyingIds` Set (StepIncome.tsx:61-96, StepSavings.tsx:79-118).

**StepExpenses** has similar but different "quick add from recurring" using the same `copyingIds` pattern (StepExpenses.tsx:85-122).

Both patterns:
1. Add ID to `copyingIds` Set
2. Wait 150ms then add item and trigger `newlyAddedIds` animation
3. Wait 500ms then remove from `copyingIds`

## Code References

| Pattern | Files |
|---------|-------|
| ItemType definition | `wizard/ItemCard.tsx:9`, `budget-detail/BudgetItemCard.tsx:5`, `todo/TodoItemRow.tsx:12` |
| Type styles map | `wizard/ItemCard.tsx:29-45`, `budget-detail/BudgetItemCard.tsx:17-30`, `todo/TodoItemRow.tsx:14-25` |
| Collapsible animation | `index.css:229-253`, `BudgetSection.tsx:72`, `TodoItemList.tsx:66` |
| Balance celebration | `StepReview.tsx:48-92`, `BudgetSummary.tsx:16-33`, `TodoProgress.tsx:18-30` |
| Copy item animation | `StepIncome.tsx:61-96`, `StepExpenses.tsx:85-122`, `StepSavings.tsx:79-118` |
| New item animation | `StepIncome.tsx:35-55`, `StepExpenses.tsx:62-83`, `StepSavings.tsx:53-73` |

## Architecture Documentation

### Design System Alignment

The implementation follows the design system documented in `.design-engineer/system.md`:
- Warm stone palette with oklch colors
- Semantic colors for income/expense/savings/balanced
- Card-based layout with rounded-xl borders
- Tabular-nums for currency amounts
- Collapsible sections with smooth animations

### Component Patterns

**Two card paradigms exist:**
1. **Editable (Wizard)**: Inline inputs, change handlers, borderless inputs
2. **Read-only (Detail/Todo)**: Display only, onClick for modal editing, cursor-pointer

**Collapsible section pattern** is consistent across all three areas:
- ChevronDown icon rotates -90deg when collapsed
- Count shown in parentheses
- Total amount on right side
- Radix Collapsible with custom animations

### State Management

- Wizard uses context (`WizardContext`) with reducer pattern
- Todo uses React Query hooks (`useUpdateTodoItem`)
- Local animation state uses `useState<Set<string>>` for tracking IDs

## Historical Context

The `.design-engineer/system.md` file documents the design direction established for this redesign:
- "Warm like a shared notebook"
- Cards not tables for mobile-first design
- Two editing modes: inline (wizard) vs modal (detail pages)
- Balance celebration as a "small victory" moment

## Related Research

- `.claude/thoughts/research/2026-01-19-wizard-table-mobile-overflow.md` - Previous research on mobile overflow issues that led to card-based redesign

## Open Questions

1. **ItemType duplication**: Three separate `ItemType` definitions exist. Are they intentionally different or could they share a type?

2. **Copy animation pattern**: The `copyingIds`/`newlyAddedIds` animation logic is duplicated across three step components. Is this intentional separation of concerns or could it be abstracted?

3. **Balance celebration components**: `StepReview`, `BudgetSummary`, and `TodoProgress` all have similar celebration states. Should these share a common component?

4. **Type style maps**: Three components define their own `typeStyles` records with overlapping but not identical structures. Is this intentional variance?

5. **TodoItemRow alias**: The backwards compatibility export `TodoItemRow` is maintained. When can this be removed?
