# Balance — Todo List UX Flow

This document defines the user experience for viewing and managing todo lists at `/budgets/:id/todo`.

---

## Overview

The Todo List is auto-generated when a budget is locked. It provides a checklist of actions the user needs to take to execute their budget:

- **TRANSFER items:** Money that needs to move between accounts
- **PAYMENT items:** Bills or expenses requiring manual payment

Users can toggle items between pending and completed with a single click.

---

## Entry Points

Users can access the todo list from:

1. **Budget Detail page** (locked budget) → "View Todo List" button
2. **Budget List page** → Todo icon/indicator on locked budget cards (stretch goal)
3. **Direct URL:** `/budgets/:id/todo`

---

## Page Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  ← Back to Budget                                               │
│                                                                 │
│  Todo List                                                      │
│  March 2025                                                     │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Progress                                                 │  │
│  │  ████████████░░░░░░░░░░░░░░░░░░  3 of 5 completed        │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                                                           │  │
│  │  TRANSFERS                                                │  │
│  │  ─────────────────────────────────────────────────────    │  │
│  │  ☑  Transfer $800 from Checking to Savings                │  │
│  │  ☑  Transfer $200 from Checking to Joint                  │  │
│  │  ☐  Transfer $150 from Joint to Savings                   │  │
│  │                                                           │  │
│  │  PAYMENTS                                                 │  │
│  │  ─────────────────────────────────────────────────────    │  │
│  │  ☑  Pay Rent — $1,500 from Checking                       │  │
│  │  ☐  Pay Electric — $120 from Checking                     │  │
│  │                                                           │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Header Section

### Elements
- **Back link:** "← Back to Budget" → navigates to `/budgets/:id`
- **Page title:** "Todo List"
- **Budget context:** Month and year (e.g., "March 2025")

---

## Progress Card

Shows overall completion status:

```
┌─────────────────────────────────────────────────────────────────┐
│  Progress                                                       │
│  ████████████░░░░░░░░░░░░░░░░░░  3 of 5 completed              │
└─────────────────────────────────────────────────────────────────┘
```

### Elements
- **Progress bar:** Visual representation of completion percentage
- **Text:** "X of Y completed"

### States

| Completion | Appearance |
|------------|------------|
| 0% | Empty bar, muted color |
| 1-99% | Partial fill, primary color |
| 100% | Full bar, success color (green), "All done! ✓" |

### 100% Complete State
```
┌─────────────────────────────────────────────────────────────────┐
│  Progress                                                       │
│  ██████████████████████████████  All done! ✓                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Todo Items List

Items are grouped by type with section headers.

### Section: Transfers

```
TRANSFERS
─────────────────────────────────────────────────────
☑  Transfer $800 from Checking to Savings
☐  Transfer $150 from Joint to Savings
```

### Section: Payments

```
PAYMENTS
─────────────────────────────────────────────────────
☑  Pay Rent — $1,500 from Checking
☐  Pay Electric — $120 from Checking
```

### Empty Sections
- If no transfers exist, hide the TRANSFERS section entirely
- If no payments exist, hide the PAYMENTS section entirely
- At least one section will always exist (otherwise there's no todo list)

---

## Todo Item Display

### Transfer Item

```
☐  Transfer $800 from Checking to Savings
   └── [checkbox] [action] [amount] from [source] to [destination]
```

| Element | Content |
|---------|---------|
| Checkbox | Toggle for completion status |
| Action | "Transfer" |
| Amount | Formatted currency |
| From | Source account name |
| To | Destination account name |

### Payment Item

```
☐  Pay Rent — $1,500 from Checking
   └── [checkbox] [action] [name] — [amount] from [account]
```

| Element | Content |
|---------|---------|
| Checkbox | Toggle for completion status |
| Action | "Pay" |
| Name | Expense name |
| Amount | Formatted currency |
| From | Account the payment comes from |

---

## Item States

### Pending (Unchecked)

```
☐  Transfer $800 from Checking to Savings
```
- Empty checkbox
- Normal text styling

### Completed (Checked)

```
☑  Transfer $800 from Checking to Savings
```
- Filled checkbox with checkmark
- Text may have muted color or strikethrough (subtle, still readable)
- Shows completion context on hover or as secondary text (optional)

---

## Toggle Interaction

### Click Behavior
- Click anywhere on the item row (checkbox or text) to toggle
- Immediate visual feedback (checkbox updates instantly)
- API call fires in background

### API Integration
- **Endpoint:** `PUT /api/budgets/:budgetId/todo-list/items/:id`
- **Payload:** `{ "status": "COMPLETED" }` or `{ "status": "PENDING" }`

### Optimistic Update
1. User clicks item
2. UI immediately shows new state
3. API call fires
4. On success: No visible change (already updated)
5. On failure: Revert to previous state, show error toast

### Rapid Toggling
- Debounce or queue rapid clicks to prevent race conditions
- Each click should reliably toggle the state

---

## Completed Items Ordering

Two options (pick one based on preference):

### Option A: Maintain Original Order
- Items stay in their original position regardless of status
- Completed items shown with muted styling
- **Pro:** Stable, predictable layout
- **Recommended**

### Option B: Move Completed to Bottom
- Completed items sink to bottom of their section
- Pending items rise to top
- **Pro:** Focus on what's left to do
- **Con:** Layout shifts can be disorienting

---

## Empty State

If viewing a todo list with all items completed:

```
┌─────────────────────────────────────────────────────────────────┐
│  Progress                                                       │
│  ██████████████████████████████  All done! ✓                   │
└─────────────────────────────────────────────────────────────────┘

All tasks completed! Your March 2025 budget is fully executed.

[← Back to Budget]
```

**Note:** This is different from a budget with no todo list (only locked budgets have todo lists).

---

## Error Handling

### Loading State
- Skeleton loader for progress card and item list

### Todo List Not Found
If accessing `/budgets/:id/todo` for an unlocked budget:

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                    📋                                           │
│                                                                 │
│            No todo list available                               │
│                                                                 │
│    Todo lists are generated when a budget is locked.            │
│    Lock your budget to create a todo list.                      │
│                                                                 │
│                   [← Back to Budget]                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Toggle Failure
- Revert checkbox to previous state
- Show toast: "Failed to update item. Please try again."

### Network Failure
- Show toast with retry option
- Keep UI in last known good state

---

## Responsive Behavior

### Desktop (≥1024px)
- Full layout as shown above
- Generous spacing between items

### Tablet (768px - 1023px)
- Same layout, slightly tighter spacing

### Mobile (<768px)

```
┌─────────────────────────────────────┐
│  ← Back to Budget                   │
│                                     │
│  Todo List                          │
│  March 2025                         │
│                                     │
│  ████████████░░░░  3/5 done         │
│                                     │
│  TRANSFERS                          │
│  ┌─────────────────────────────┐    │
│  │ ☑ Transfer $800             │    │
│  │   Checking → Savings        │    │
│  └─────────────────────────────┘    │
│  ┌─────────────────────────────┐    │
│  │ ☐ Transfer $150             │    │
│  │   Joint → Savings           │    │
│  └─────────────────────────────┘    │
│                                     │
│  PAYMENTS                           │
│  ┌─────────────────────────────┐    │
│  │ ☑ Pay Rent                  │    │
│  │   $1,500 from Checking      │    │
│  └─────────────────────────────┘    │
│                                     │
└─────────────────────────────────────┘
```

- Items become cards with stacked layout
- Amount and accounts on separate lines
- Large touch targets for easy toggling

---

## Keyboard Accessibility

- Tab through todo items
- Space or Enter to toggle focused item
- Focus indicator clearly visible on items

---

## Data Refresh

### When to Refetch
- On page load
- After toggle (though optimistic update handles UI)
- On window focus

### React Query Structure
```typescript
// Fetch todo list
const { data: todoList, isLoading } = useQuery({
  queryKey: ['todo-list', budgetId],
  queryFn: () => fetchTodoList(budgetId)
});

// Toggle item
const toggleMutation = useMutation({
  mutationFn: ({ itemId, status }) => updateTodoItem(budgetId, itemId, status),
  onMutate: async ({ itemId, status }) => {
    // Optimistic update
    await queryClient.cancelQueries(['todo-list', budgetId]);
    const previous = queryClient.getQueryData(['todo-list', budgetId]);
    
    queryClient.setQueryData(['todo-list', budgetId], (old) => ({
      ...old,
      items: old.items.map(item => 
        item.id === itemId ? { ...item, status } : item
      )
    }));
    
    return { previous };
  },
  onError: (err, variables, context) => {
    // Revert on error
    queryClient.setQueryData(['todo-list', budgetId], context.previous);
    toast.error('Failed to update item');
  }
});
```

---

## Relationship to Budget Lifecycle

```
Budget UNLOCKED → User adds income/expenses/savings
                ↓
Budget LOCKED   → Todo list auto-generated
                → Account balances updated
                ↓
User executes   → Toggle items as completed
                → Progress tracked
                ↓
Budget UNLOCKED → Todo list DELETED
(if user unlocks)→ Account balances reversed
```

The todo list only exists while the budget is locked. Unlocking deletes it.

---

*Last updated: December 2024*
