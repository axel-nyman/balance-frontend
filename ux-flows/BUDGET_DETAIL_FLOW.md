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
│  │ ▼ Income                              Total: 50 000 kr    │  │
│  │ ┌─────────────────────────────────────────────────────┐   │  │
│  │ │ Salary        │ 45 000 kr │ Checking │ [Edit] [Del] │   │  │
│  │ │ Side gig      │ 5 000 kr  │ Checking │ [Edit] [Del] │   │  │
│  │ │                                      │ [+ Add]       │   │  │
│  │ └─────────────────────────────────────────────────────┘   │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ ▶ Expenses (collapsed)                Total: 32 000 kr    │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ ▶ Savings (collapsed)                 Total: 18 000 kr    │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Summary                                                  │  │
│  │  ─────────────────────────────────────────────────────    │  │
│  │  Income:        50 000,00 kr                              │  │
│  │  Expenses:     -32 000,00 kr                              │  │
│  │  Savings:      -18 000,00 kr                              │  │
│  │  ─────────────────────────                                │  │
│  │  Balance:           0,00 kr  ✓                            │  │
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
│ ▶ Expenses                               Total: 32 000 kr │
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
| Name | Text | Display only, edit via modal |
| Amount | Currency | Display only, edit via modal |
| Bank Account | Text | Display only, edit via modal |
| Actions | Buttons | Edit (opens modal), Delete |

**Note:** Table rows are not clickable. Use the Edit button in the Actions column to modify items.

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
| Name | Text | Display only, edit via modal |
| Amount | Currency | Display only, edit via modal |
| Bank Account | Text | Display only, edit via modal |
| Manual | Icon | Visual indicator only, edit via modal |
| Actions | Buttons | Edit (opens modal), Delete |

**Note:** Table rows are not clickable. Use the Edit button in the Actions column to modify items.

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
| Name | Text | Display only, edit via modal |
| Amount | Currency | Display only, edit via modal |
| Bank Account | Text | Display only, edit via modal |
| Actions | Buttons | Edit (opens modal), Delete |

**Note:** Table rows are not clickable. Use the Edit button in the Actions column to modify items.

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
│  Income:        50 000,00 kr        │
│  Expenses:     -32 000,00 kr        │
│  Savings:      -18 000,00 kr        │
│  ───────────────────────────────    │
│  Balance:           0,00 kr  ✓      │
└─────────────────────────────────────┘
```

### Balance Indicator
| Balance | Display |
|---------|---------|
| 0,00 kr | Green checkmark ✓ |
| Positive (surplus) | Warning color, shows amount remaining to allocate |
| Negative (deficit) | Error color, shows overspent amount |

---

## Action Buttons

### Unlocked Budget

| Button | Position | Behavior |
|--------|----------|----------|
| Delete Budget | Bottom left | Opens confirmation modal, deletes budget and all items |
| Lock | Bottom right | Enabled only when balance = 0 kr, locks budget |

### Locked Budget

| Button | Position | Behavior |
|--------|----------|----------|
| View Todo List | Bottom right | Navigates to `/budgets/:id/todo` |
| Unlock | Bottom right | Unlocks budget (only for most recent budget) |

---

## Editing Items (Unlocked Budget)

All editing is done via modals for consistency and simplicity:

- Click "Edit" button in the actions column
- Opens modal with full form
- All fields editable at once
- Save and Cancel buttons
- Form validation before save
- Toast notification on success/error
- Modal closes on successful save

---

## Edit Modals (Unlocked Budget)

### Edit Income Modal
```
┌─────────────────────────────────────┐
│  Edit Income                   [X]  │
│  ───────────────────────────────    │
│  Name                               │
│  [________Salary______________]     │
│                                     │
│  Amount                             │
│  [________45000_______________]     │
│                                     │
│  Bank Account                       │
│  [Checking               ▼]         │
│                                     │
│           [Cancel]  [Save]          │
└─────────────────────────────────────┘
```

- Pre-filled with current values
- API call: `PUT /api/budgets/{budgetId}/income/{id}`
- On success: Close modal, show toast, refresh data

### Edit Expense Modal
```
┌─────────────────────────────────────┐
│  Edit Expense                  [X]  │
│  ───────────────────────────────    │
│  Name                               │
│  [________Rent________________]     │
│                                     │
│  Amount                             │
│  [________8000________________]     │
│                                     │
│  Bank Account                       │
│  [Checking               ▼]         │
│                                     │
│  ☑ Manual payment required          │
│                                     │
│           [Cancel]  [Save]          │
└─────────────────────────────────────┘
```

- Pre-filled with current values
- API call: `PUT /api/budgets/{budgetId}/expenses/{id}`
- On success: Close modal, show toast, refresh data

### Edit Savings Modal

Same structure as Edit Income modal.

- Pre-filled with current values
- API call: `PUT /api/budgets/{budgetId}/savings/{id}`
- On success: Close modal, show toast, refresh data

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
- Balance must equal 0,00 kr

### Lock Button State
| Condition | Button State |
|-----------|--------------|
| Balance = 0 kr | Enabled |
| Balance ≠ 0 kr | Disabled, tooltip: "Budget must balance to 0 kr to lock" |

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
  │  45 000,00 kr               │
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
