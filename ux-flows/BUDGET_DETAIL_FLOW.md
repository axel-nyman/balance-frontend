# Balance — Budget Detail & Edit UX Flow

This document defines the user experience for viewing and editing existing budgets at `/budgets/:id`.

---

## Overview

The Budget Detail page serves multiple purposes depending on budget state:

| Budget State | User Can... |
|--------------|-------------|
| **UNLOCKED** | View, edit all items, add items, delete items, lock (if balanced), delete budget |
| **LOCKED** | View only, access todo list, unlock (if most recent budget) |

The page design mirrors the Review step of the budget wizard, providing a consistent experience.

---

## Page Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  ← Back to Budgets                                              │
│                                                                 │
│  March 2025                                        [UNLOCKED]   │
│  Created: Mar 1, 2025                                           │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ ▼ Income                                  Total: $5,000   │  │
│  │ ┌─────────────────────────────────────────────────────┐   │  │
│  │ │ Salary        │ $4,500  │ Checking  │ [Edit] [Del]  │   │  │
│  │ │ Side gig      │ $500    │ Checking  │ [Edit] [Del]  │   │  │
│  │ │                                      │ [+ Add]       │   │  │
│  │ └─────────────────────────────────────────────────────┘   │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ ▶ Expenses (collapsed)                    Total: $3,200   │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ ▶ Savings (collapsed)                     Total: $1,800   │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Summary                                                  │  │
│  │  ─────────────────────────────────────────────────────    │  │
│  │  Income:        $5,000.00                                 │  │
│  │  Expenses:     -$3,200.00                                 │  │
│  │  Savings:      -$1,800.00                                 │  │
│  │  ─────────────────────────                                │  │
│  │  Balance:          $0.00  ✓                               │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  [Delete Budget]                                    [Lock]      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Header Section

### Elements
- **Back link:** "← Back to Budgets" → navigates to `/budgets`
- **Title:** Month and year (e.g., "March 2025")
- **Status badge:** Visual indicator showing LOCKED or UNLOCKED
- **Metadata:** Created date, locked date (if applicable)

### Status Badge Styling
| Status | Appearance |
|--------|------------|
| UNLOCKED | Neutral/muted color (gray), indicates editable |
| LOCKED | Success color (green), indicates finalized |

---

## Collapsible Sections

Each category (Income, Expenses, Savings) is displayed as a collapsible accordion section.

### Collapsed State
```
┌───────────────────────────────────────────────────────────┐
│ ▶ Expenses                                   Total: $3,200 │
└───────────────────────────────────────────────────────────┘
```
- Chevron icon (▶) indicates expandable
- Category name
- Total amount for category
- Click anywhere on header to expand

### Expanded State
Shows full table of items within that category.

---

## Income Section (Expanded)

### Table Columns — Unlocked Budget

| Column | Type | Notes |
|--------|------|-------|
| Name | Text (editable) | Click to edit inline |
| Amount | Currency (editable) | Click to edit inline |
| Bank Account | Dropdown (editable) | Click to change |
| Actions | Buttons | Edit (opens modal), Delete |

### Table Columns — Locked Budget

| Column | Type | Notes |
|--------|------|-------|
| Name | Text (read-only) | Display only |
| Amount | Currency (read-only) | Display only |
| Bank Account | Text (read-only) | Display only |

*No actions column for locked budgets.*

### Add Button (Unlocked Only)
- "Add Income" button at bottom of table
- Opens modal form for new income entry

---

## Expenses Section (Expanded)

### Table Columns — Unlocked Budget

| Column | Type | Notes |
|--------|------|-------|
| Name | Text (editable) | Click to edit inline |
| Amount | Currency (editable) | Click to edit inline |
| Bank Account | Dropdown (editable) | Click to change |
| Manual | Checkbox (editable) | Toggle directly |
| Actions | Buttons | Edit (opens modal), Delete |

### Table Columns — Locked Budget

| Column | Type | Notes |
|--------|------|-------|
| Name | Text (read-only) | Display only |
| Amount | Currency (read-only) | Display only |
| Bank Account | Text (read-only) | Display only |
| Manual | Indicator | Icon or text showing manual status |

### Visual Indicator for Recurring Expenses
- Expenses linked to a recurring template may show a subtle indicator (icon or badge)
- This is informational only — helps user know where the expense came from

### Add Button (Unlocked Only)
- "Add Expense" button at bottom of table
- Opens modal form for new expense entry

---

## Savings Section (Expanded)

### Table Columns — Unlocked Budget

| Column | Type | Notes |
|--------|------|-------|
| Name | Text (editable) | Click to edit inline |
| Amount | Currency (editable) | Click to edit inline |
| Bank Account | Dropdown (editable) | Click to change |
| Actions | Buttons | Edit (opens modal), Delete |

### Table Columns — Locked Budget

| Column | Type | Notes |
|--------|------|-------|
| Name | Text (read-only) | Display only |
| Amount | Currency (read-only) | Display only |
| Bank Account | Text (read-only) | Display only |

### Add Button (Unlocked Only)
- "Add Savings" button at bottom of table
- Opens modal form for new savings entry

---

## Summary Card

Always visible at the bottom of the sections, showing:

```
┌─────────────────────────────────────┐
│  Summary                            │
│  ───────────────────────────────    │
│  Income:        $5,000.00           │
│  Expenses:     -$3,200.00           │
│  Savings:      -$1,800.00           │
│  ───────────────────────────────    │
│  Balance:          $0.00  ✓         │
└─────────────────────────────────────┘
```

### Balance Indicator
| Balance | Display |
|---------|---------|
| $0.00 | Green checkmark ✓ |
| Positive (surplus) | Warning color, shows amount remaining to allocate |
| Negative (deficit) | Error color, shows overspent amount |

---

## Action Buttons

### Unlocked Budget

| Button | Position | Behavior |
|--------|----------|----------|
| Delete Budget | Bottom left | Opens confirmation modal, deletes budget and all items |
| Lock | Bottom right | Enabled only when balance = $0, locks budget |

### Locked Budget

| Button | Position | Behavior |
|--------|----------|----------|
| View Todo List | Bottom right | Navigates to `/budgets/:id/todo` |
| Unlock | Bottom right | Unlocks budget (only for most recent budget) |

---

## Editing Items (Unlocked Budget)

Two editing patterns are supported:

### Pattern 1: Inline Editing
- Click directly on a cell (name, amount, account)
- Cell becomes editable input
- Save on blur or Enter
- Cancel on Escape
- Best for quick single-field changes

### Pattern 2: Modal Editing
- Click "Edit" button in actions column
- Opens modal with full form
- All fields editable at once
- Save and Cancel buttons
- Best for editing multiple fields

### Which to Use?
- Both options available for flexibility
- Inline for speed, modal for comprehensive edits
- Consistent with wizard behavior

---

## Adding Items (Unlocked Budget)

Clicking "Add Income/Expense/Savings" opens a modal form:

### Add Income Modal
```
┌─────────────────────────────────────┐
│  Add Income                    [X]  │
│  ───────────────────────────────    │
│  Name                               │
│  [________________________]         │
│                                     │
│  Amount                             │
│  [________________________]         │
│                                     │
│  Bank Account                       │
│  [Select account         ▼]        │
│                                     │
│           [Cancel]  [Save]          │
└─────────────────────────────────────┘
```

### Add Expense Modal
```
┌─────────────────────────────────────┐
│  Add Expense                   [X]  │
│  ───────────────────────────────    │
│  Name                               │
│  [________________________]         │
│                                     │
│  Amount                             │
│  [________________________]         │
│                                     │
│  Bank Account                       │
│  [Select account         ▼]        │
│                                     │
│  ☐ Manual payment required          │
│                                     │
│           [Cancel]  [Save]          │
└─────────────────────────────────────┘
```

### Add Savings Modal
Same as Add Income modal.

### Modal Behavior
- Form validation before save
- API call on save
- Toast notification on success/error
- Modal closes on successful save
- Data refreshes automatically (React Query invalidation)

---

## Deleting Items (Unlocked Budget)

### Single Item Delete
1. User clicks Delete button on item row
2. Confirmation modal appears: "Delete [item name]?"
3. On confirm: API call, item removed, totals update
4. On cancel: Modal closes, no action

### Delete Budget
1. User clicks "Delete Budget" button
2. Confirmation modal: "Delete March 2025 budget? This will remove all income, expenses, and savings entries. This cannot be undone."
3. On confirm: API call, navigate to `/budgets`
4. On cancel: Modal closes, no action

---

## Locking a Budget

### Prerequisites
- Budget must be UNLOCKED
- Balance must equal $0.00

### Lock Button State
| Condition | Button State |
|-----------|--------------|
| Balance = $0 | Enabled |
| Balance ≠ $0 | Disabled, tooltip: "Budget must balance to $0 to lock" |

### Lock Flow
1. User clicks "Lock" button
2. Confirmation modal: "Lock March 2025 budget? This will finalize the budget and generate your todo list."
3. On confirm:
   - API call: `PUT /api/budgets/:id/lock`
   - Backend generates todo list and updates account balances
   - Page refreshes to show locked state
   - Toast: "Budget locked successfully"
   - "View Todo List" button appears
4. On cancel: Modal closes, no action

---

## Unlocking a Budget

### Prerequisites
- Budget must be LOCKED
- Budget must be the **most recent** budget (by year DESC, month DESC)

### Unlock Button Visibility
| Condition | Display |
|-----------|---------|
| Locked + most recent | Show "Unlock" button |
| Locked + not most recent | No unlock button, or disabled with tooltip |

### Unlock Flow
1. User clicks "Unlock" button
2. Confirmation modal: "Unlock March 2025 budget? This will delete the todo list and reverse account balance changes."
3. On confirm:
   - API call: `PUT /api/budgets/:id/unlock`
   - Backend reverses balance updates, deletes todo list
   - Page refreshes to show unlocked state
   - Toast: "Budget unlocked"
4. On cancel: Modal closes, no action

---

## Locked Budget View

When viewing a locked budget:

### Visual Differences
- Status badge shows "LOCKED" (green)
- All tables are read-only (no edit/delete buttons)
- No "Add" buttons
- No "Delete Budget" button
- "View Todo List" button is prominent
- "Unlock" button shown (if most recent)

### Locked Date Display
- Header shows: "Locked: Mar 15, 2025"

### Todo List Access
```
┌─────────────────────────────────────────────────────────┐
│  Todo List                                              │
│  ───────────────────────────────────────────────────    │
│  3 of 5 items completed                                 │
│                                    [View Todo List →]   │
└─────────────────────────────────────────────────────────┘
```

- Shows quick summary of todo progress
- Button navigates to `/budgets/:id/todo`

---

## Error Handling

### Loading State
- Skeleton loader matching page layout
- Shows while fetching budget details

### Budget Not Found
- Show 404-style message: "Budget not found"
- Link back to budget list

### API Errors
- Toast notifications for failed operations
- Form modals show inline errors for validation failures
- Retry option where appropriate

### Optimistic Updates
- Consider optimistic updates for inline edits
- Revert on API failure with error toast

---

## Responsive Behavior

### Desktop (≥1024px)
- Full table layouts
- Modals centered with max-width

### Tablet (768px - 1023px)
- Full table layouts
- Modals may be slightly narrower

### Mobile (<768px)
- Tables become card-based layouts
- Each item is a card:
  ```
  ┌─────────────────────────────┐
  │  Salary                     │
  │  $4,500.00                  │
  │  Checking Account           │
  │  [Edit]  [Delete]           │
  └─────────────────────────────┘
  ```
- Modals become full-screen or bottom sheets
- Summary card stacks vertically

---

## Navigation Context

### Entry Points
- From Budget List (`/budgets`): Click on budget card
- From Wizard: After Save or Lock
- From Todo List: "← Back to Budget" link
- Direct URL: `/budgets/:id`

### Exit Points
- "← Back to Budgets" → `/budgets`
- "View Todo List" → `/budgets/:id/todo`
- Navigation menu → anywhere

---

## State Refresh

### When to Refetch Budget Data
- On page load
- After any mutation (add, edit, delete item)
- After lock/unlock
- On window focus (optional, React Query default)

### React Query Integration
```typescript
// Fetch budget details
const { data: budget, isLoading } = useQuery({
  queryKey: ['budget', budgetId],
  queryFn: () => fetchBudget(budgetId)
});

// Mutations invalidate the query
const addIncome = useMutation({
  mutationFn: createBudgetIncome,
  onSuccess: () => queryClient.invalidateQueries(['budget', budgetId])
});
```

---

*Last updated: December 2024*
