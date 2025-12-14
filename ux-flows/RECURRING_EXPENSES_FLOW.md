# Balance — Recurring Expenses UX Flow

This document defines the user experience for managing recurring expense templates at `/recurring-expenses`.

---

## Overview

The Recurring Expenses page allows users to:
- View all recurring expense templates
- See which expenses are due based on their interval
- Create new templates
- Edit existing templates
- Delete templates

Recurring expenses are **templates**, not actual budget items. They make it easy to quickly add regular expenses (rent, subscriptions, insurance) to monthly budgets via the budget wizard.

---

## Page Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Recurring Expenses                    [+ New Recurring Expense]│
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ Name          │ Amount   │ Interval  │ Due      │ Actions │  │
│  │───────────────│──────────│───────────│──────────│─────────│  │
│  │ 🔴 Rent       │ $1,500   │ Monthly   │ Due now  │ [✏️][🗑️]│  │
│  │ 🔴 Electric   │ $120     │ Monthly   │ Due now  │ [✏️][🗑️]│  │
│  │ 🟢 Car Insur. │ $600     │ Biannually│ Mar 2025 │ [✏️][🗑️]│  │
│  │ 🟢 Amazon Pr. │ $140     │ Yearly    │ Sep 2025 │ [✏️][🗑️]│  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  💡 Click any row to edit                                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Header Section

### Elements
- **Page title:** "Recurring Expenses"
- **New Recurring Expense button:** Primary action, top right

---

## Recurring Expenses Table

### Columns

| Column | Content | Notes |
|--------|---------|-------|
| Name | Expense name | With due status indicator (colored dot) |
| Amount | Default amount | Formatted as currency |
| Interval | Recurrence interval | MONTHLY, QUARTERLY, BIANNUALLY, YEARLY |
| Due | Due status | "Due now" or next due date |
| Actions | Action buttons | Edit, Delete |

### Due Status Indicator

Visual indicator at the start of each row:

| Status | Indicator | Due Column Text |
|--------|-----------|-----------------|
| Due now | 🔴 Red dot | "Due now" |
| Not due | 🟢 Green dot | Next due date (e.g., "Mar 2025") |
| Never used | 🟡 Yellow dot | "Never used" |

### Sorting
- Default: Due items first, then sorted by next due date ascending
- This puts the most relevant items at the top

### Row Interaction

**Row Click (anywhere on Name, Amount, Interval, or Due):**
- Opens the Edit modal for that recurring expense
- Row should have hover state to indicate clickability

### Row Actions

Each row has action buttons in the Actions column:

| Action | Display | Description |
|--------|---------|-------------|
| Edit | Icon button (pencil) | Open edit modal |
| Delete | Icon button (trash) | Delete template (with confirmation) |

---

## Empty State

When no recurring expenses exist:

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                    📋                                           │
│                                                                 │
│            No recurring expenses yet                            │
│                                                                 │
│    Create templates for regular expenses like rent,             │
│    subscriptions, and bills to quickly add them to              │
│    your monthly budgets.                                        │
│                                                                 │
│               [+ Create Recurring Expense]                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Create Recurring Expense Modal

Triggered by: "New Recurring Expense" button

```
┌─────────────────────────────────────┐
│  New Recurring Expense         [X]  │
│  ───────────────────────────────    │
│                                     │
│  Name *                             │
│  [________________________]         │
│                                     │
│  Amount *                           │
│  [________________________]         │
│                                     │
│  Interval *                         │
│  [Monthly                  ▼]       │
│                                     │
│  ☐ Requires manual payment          │
│                                     │
│           [Cancel]  [Create]        │
└─────────────────────────────────────┘
```

### Fields

| Field | Required | Validation | Notes |
|-------|----------|------------|-------|
| Name | Yes | Non-empty, unique | Must not match existing template |
| Amount | Yes | Positive number | Default amount when adding to budget |
| Interval | Yes | Select one | MONTHLY, QUARTERLY, BIANNUALLY, YEARLY |
| Manual payment | No | Checkbox | If checked, creates PAYMENT todo item when budget is locked |

### Interval Options

| Value | Display | Meaning |
|-------|---------|---------|
| MONTHLY | Monthly | Due every month |
| QUARTERLY | Quarterly | Due every 3 months |
| BIANNUALLY | Biannually | Due every 6 months |
| YEARLY | Yearly | Due once per year |

### Behavior
- Form validation on submit
- API call: `POST /api/recurring-expenses`
- On success: Close modal, show toast "Recurring expense created", refresh list
- On error: Show inline error (e.g., "Name already exists")

---

## Edit Recurring Expense Modal

Triggered by: Clicking row OR Edit button

```
┌─────────────────────────────────────┐
│  Edit Recurring Expense        [X]  │
│  ───────────────────────────────    │
│                                     │
│  Name *                             │
│  [_______Rent_______________]       │
│                                     │
│  Amount *                           │
│  [_______1500_______________]       │
│                                     │
│  Interval *                         │
│  [Monthly                  ▼]       │
│                                     │
│  ☑ Requires manual payment          │
│                                     │
│  ───────────────────────────────    │
│  Last used: February 2025           │
│  Next due: March 2025               │
│  ───────────────────────────────    │
│                                     │
│           [Cancel]  [Save]          │
└─────────────────────────────────────┘
```

### Fields

| Field | Required | Validation | Notes |
|-------|----------|------------|-------|
| Name | Yes | Non-empty, unique (excluding self) | Can rename |
| Amount | Yes | Positive number | Can adjust |
| Interval | Yes | Select one | Can change |
| Manual payment | No | Checkbox | Can toggle |

### Read-only Information
- **Last used:** Date when this template was last added to a locked budget (or "Never")
- **Next due:** Calculated next due date based on interval and last used date

### Behavior
- Pre-filled with current values
- API call: `PUT /api/recurring-expenses/:id`
- On success: Close modal, show toast "Recurring expense updated", refresh list
- On error: Show inline error

---

## Delete Recurring Expense

Triggered by: Delete button in row

### Confirmation Modal

```
┌─────────────────────────────────────┐
│  Delete Recurring Expense      [X]  │
│  ───────────────────────────────    │
│                                     │
│  Are you sure you want to delete    │
│  "Rent"?                            │
│                                     │
│  This will not affect any existing  │
│  budget expenses created from this  │
│  template.                          │
│                                     │
│           [Cancel]  [Delete]        │
└─────────────────────────────────────┘
```

### Behavior
- API call: `DELETE /api/recurring-expenses/:id`
- On success: Close modal, show toast "Recurring expense deleted", refresh list
- On error: Show error toast

**Note:** Deleting a template does NOT affect budget expenses that were previously created from it. Those remain in their respective budgets.

---

## Due Date Calculation Logic

The frontend displays due status based on data from the API:

| Field | Source |
|-------|--------|
| `lastUsedDate` | From API (set when budget using this template is locked) |
| `nextDueDate` | Calculated by API based on lastUsedDate + interval |
| `isDue` | Calculated by API (true if nextDueDate ≤ current date) |

### Display Logic

```
if (lastUsedDate is null) {
  show "Never used" with yellow indicator
} else if (isDue) {
  show "Due now" with red indicator
} else {
  show nextDueDate formatted as "Mon YYYY" with green indicator
}
```

---

## Error Handling

### Loading State
- Skeleton loader for table while fetching

### API Errors
- Toast notifications for failed operations
- Modals show inline errors for validation issues

### Network Failure
- Toast with retry option

---

## Responsive Behavior

### Desktop (≥1024px)
- Full table layout
- Modals centered

### Tablet (768px - 1023px)
- Full table layout
- May hide or abbreviate Interval column if needed

### Mobile (<768px)

**Table becomes card list:**
```
┌─────────────────────────────────────┐
│  🔴 Rent                            │  ← Tap card to edit
│  $1,500.00 • Monthly                │
│  Due now                            │
│                        [✏️]  [🗑️]   │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  🟢 Car Insurance                   │  ← Tap card to edit
│  $600.00 • Biannually               │
│  Next due: Mar 2025                 │
│                        [✏️]  [🗑️]   │
└─────────────────────────────────────┘
```

- Each template is a card
- Tapping the card body opens edit modal
- Due status indicator and text prominent
- Action icons (edit, delete) at bottom of card
- Modals become full-screen

---

## Keyboard Accessibility

- Tab through table rows and action buttons
- Enter on focused row opens edit modal
- Enter on focused action button activates that action
- Escape to close modals
- Action buttons should stop propagation (don't open edit modal)

---

## Data Refresh

### When to Refetch
- On page load
- After create/edit/delete
- On window focus (React Query default)

### React Query Structure
```typescript
// List recurring expenses
const { data, isLoading } = useQuery({
  queryKey: ['recurring-expenses'],
  queryFn: fetchRecurringExpenses
});

// Create
const createMutation = useMutation({
  mutationFn: createRecurringExpense,
  onSuccess: () => queryClient.invalidateQueries(['recurring-expenses'])
});

// Update
const updateMutation = useMutation({
  mutationFn: updateRecurringExpense,
  onSuccess: () => queryClient.invalidateQueries(['recurring-expenses'])
});

// Delete
const deleteMutation = useMutation({
  mutationFn: deleteRecurringExpense,
  onSuccess: () => queryClient.invalidateQueries(['recurring-expenses'])
});
```

---

## Relationship to Budget Wizard

Recurring expenses created here appear in the Budget Wizard (Step 3: Expenses):

1. **Quick Add section** shows all recurring expense templates
2. **Due This Month** subsection shows templates where `isDue = true`
3. **All Recurring Expenses** subsection shows remaining templates
4. Clicking "+" on a template creates a budget expense with the template's default values
5. When the budget is locked, `lastUsedDate` is updated on the template

This creates a cycle:
```
Create template → Add to budget → Lock budget → lastUsedDate updates → Due status changes
```

---

*Last updated: December 2024*
